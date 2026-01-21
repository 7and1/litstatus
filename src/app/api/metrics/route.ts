import { NextResponse } from "next/server";
import { perfMonitor } from "@/lib/performance";
import { getCacheStats } from "@/lib/cache";
import { getRedisStats } from "@/lib/redis";
import { getCircuitBreakerStats } from "@/lib/openai";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSecurityHeaders } from "@/lib/security";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const APP_VERSION = process.env.APP_VERSION || "0.1.0";
const APP_NAME = "litstatus_com";

// In-memory metrics storage (resets on container restart)
const requestMetrics = {
  total: 0,
  byEndpoint: new Map<string, number>(),
  byStatus: new Map<number, number>(),
  byMethod: new Map<string, number>(),
  errors: 0,
};

const latencyBuckets = [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
const latencyHistogram = new Map<string, number[]>();

function recordLatency(operation: string, duration: number) {
  if (!latencyHistogram.has(operation)) {
    latencyHistogram.set(operation, new Array(latencyBuckets.length + 1).fill(0));
  }
  const buckets = latencyHistogram.get(operation)!;
  for (let i = 0; i < latencyBuckets.length; i++) {
    if (duration <= latencyBuckets[i]) {
      buckets[i]++;
      return;
    }
  }
  buckets[latencyBuckets.length]++; // +Inf bucket
}

function recordRequest(method: string, endpoint: string, status: number) {
  requestMetrics.total++;
  requestMetrics.byMethod.set(method, (requestMetrics.byMethod.get(method) || 0) + 1);
  requestMetrics.byEndpoint.set(endpoint, (requestMetrics.byEndpoint.get(endpoint) || 0) + 1);
  requestMetrics.byStatus.set(status, (requestMetrics.byStatus.get(status) || 0) + 1);
  if (status >= 400) {
    requestMetrics.errors++;
  }
}

// Export function to be used by middleware
// Function to record metrics (internal use, not exported for Next.js 15 compatibility)
function recordMetric(method: string, endpoint: string, status: number, duration: number) {
  recordRequest(method, endpoint, status);
  recordLatency(endpoint, duration);
}

function escapePrometheusValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function formatPrometheusMetric(
  name: string,
  value: number | string,
  labels?: Record<string, string>,
  help?: string
): string {
  let output = '';

  if (help) {
    output += `# HELP ${APP_NAME}_${name} ${help}\n`;
    output += `# TYPE ${APP_NAME}_${name} gauge\n`;
  }

  const labelStr = labels
    ? '{' + Object.entries(labels)
        .map(([k, v]) => `${k}="${escapePrometheusValue(v)}"`)
        .join(',') + '}'
    : '';

  output += `${APP_NAME}_${name}${labelStr} ${value}\n`;
  return output;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const securityHeaders = getSecurityHeaders();
  const ip = request.headers.get("x-forwarded-for")?.split(',')[0] ||
             request.headers.get("cf-connecting-ip") ||
             "unknown";

  // Rate limiting for metrics endpoint
  const rateResult = await checkRateLimit(`metrics:${ip}`, 10, 60 * 1000);

  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  }

  // Check for authentication via Bearer token (optional but recommended)
  const authHeader = request.headers.get("authorization");
  const metricsToken = process.env.METRICS_ACCESS_TOKEN;
  if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: securityHeaders,
      },
    );
  }

  let metrics = '';

  // Application info
  metrics += `# HELP ${APP_NAME}_info Application information\n`;
  metrics += `# TYPE ${APP_NAME}_info gauge\n`;
  metrics += `${APP_NAME}_info{version="${APP_VERSION}",name="litstatus.com"} 1\n\n`;

  // Uptime (not available in Edge Runtime, use request time as proxy)
  // Skip uptime metric for Cloudflare Workers

  // Request metrics
  metrics += formatPrometheusMetric('requests_total', requestMetrics.total, {}, 'Total number of requests');

  for (const [method, count] of requestMetrics.byMethod.entries()) {
    metrics += formatPrometheusMetric('requests_total', count, { method }, 'Total requests by method');
  }

  for (const [endpoint, count] of requestMetrics.byEndpoint.entries()) {
    metrics += formatPrometheusMetric('requests_total', count, { endpoint }, 'Total requests by endpoint');
  }

  for (const [status, count] of requestMetrics.byStatus.entries()) {
    metrics += formatPrometheusMetric('responses_total', count, { status: String(status) }, 'Total responses by status');
  }

  metrics += formatPrometheusMetric('errors_total', requestMetrics.errors, {}, 'Total number of errors');

  // Performance metrics
  const perfMetrics = perfMonitor.getMetrics();
  const durations = perfMetrics.map(m => m.duration);
  if (durations.length > 0) {
    durations.sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99 = durations[Math.floor(durations.length * 0.99)] || 0;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    metrics += formatPrometheusMetric('operation_duration_avg', avg.toFixed(2), {}, 'Average operation duration in ms');
    metrics += formatPrometheusMetric('operation_duration_p50', p50, {}, 'P50 operation duration in ms');
    metrics += formatPrometheusMetric('operation_duration_p95', p95, {}, 'P95 operation duration in ms');
    metrics += formatPrometheusMetric('operation_duration_p99', p99, {}, 'P99 operation duration in ms');
  }

  // Slow operations count
  const slowOps = perfMetrics.filter(m => m.duration > 1000);
  metrics += formatPrometheusMetric('slow_operations', slowOps.length, {}, 'Number of slow operations (>1s)');

  // OpenAI specific metrics
  const openaiMetrics = perfMetrics.filter(m => m.operation.startsWith('openai.'));
  if (openaiMetrics.length > 0) {
    const totalLatency = openaiMetrics.reduce((sum, m) => sum + m.duration, 0);
    const avgOpenaiLatency = totalLatency / openaiMetrics.length;
    const successRate = openaiMetrics.filter(m => m.success).length / openaiMetrics.length;

    metrics += formatPrometheusMetric('openai_latency_avg', avgOpenaiLatency.toFixed(2), {}, 'Average OpenAI API latency in ms');
    metrics += formatPrometheusMetric('openai_success_rate', successRate.toFixed(3), {}, 'OpenAI API success rate (0-1)');
  }

  // Circuit breaker metrics
  try {
    const cbStats = await getCircuitBreakerStats('openai.chat.completions');
    if (cbStats) {
      metrics += formatPrometheusMetric('circuit_breaker_open', cbStats.isOpen ? 1 : 0, { operation: 'openai.chat.completions' }, 'Circuit breaker state (1=open, 0=closed)');
      metrics += formatPrometheusMetric('circuit_breaker_failures', cbStats.failureCount, { operation: 'openai.chat.completions' }, 'Circuit breaker failure count');
      metrics += formatPrometheusMetric('circuit_breaker_successes', cbStats.successCount, { operation: 'openai.chat.completions' }, 'Circuit breaker success count');
    }
  } catch (error) {
    // Silently skip circuit breaker metrics if unavailable
  }

  // Cache metrics
  const cacheStats = getCacheStats();
  const totalCacheOps = cacheStats.hits + cacheStats.misses;
  const hitRate = totalCacheOps > 0 ? cacheStats.hits / totalCacheOps : 0;

  metrics += formatPrometheusMetric('cache_hits', cacheStats.hits, {}, 'Cache hits');
  metrics += formatPrometheusMetric('cache_misses', cacheStats.misses, {}, 'Cache misses');
  metrics += formatPrometheusMetric('cache_hit_rate', hitRate.toFixed(3), {}, 'Cache hit rate (0-1)');
  metrics += formatPrometheusMetric('cache_sets', cacheStats.sets, {}, 'Cache set operations');
  metrics += formatPrometheusMetric('cache_deletes', cacheStats.deletes, {}, 'Cache delete operations');

  // Redis metrics
  const redisStats = getRedisStats();
  metrics += formatPrometheusMetric('redis_enabled', redisStats.enabled ? 1 : 0, {}, 'Redis connection status');
  metrics += formatPrometheusMetric('redis_errors', redisStats.errorCount, {}, 'Redis error count');

  // Database metrics
  try {
    const dbStart = Date.now();
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStart;

    metrics += formatPrometheusMetric('database_up', error ? 0 : 1, {}, 'Database connectivity (1=up, 0=down)');
    metrics += formatPrometheusMetric('database_latency_ms', dbLatency, {}, 'Database query latency in ms');
  } catch {
    metrics += formatPrometheusMetric('database_up', 0, {}, 'Database connectivity (1=up, 0=down)');
  }

  // Memory metrics not available in Edge Runtime (Cloudflare Workers)

  // Response time for this request
  const responseTime = Date.now() - startTime;
  metrics += formatPrometheusMetric('metrics_response_time_ms', responseTime, {}, 'Time to generate metrics in ms');

  return new NextResponse(metrics, {
    status: 200,
    headers: {
      ...securityHeaders,
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}

// Export metrics recording function for use in other parts of the app
// Internal function for operation metrics (not exported for Next.js 15 compatibility)
function recordOperationMetric(operation: string, duration: number, success: boolean) {
  perfMonitor.record(operation, duration, success);
}
