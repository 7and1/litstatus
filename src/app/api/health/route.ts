import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getOpenAIClient, getCircuitBreakerStats } from "@/lib/openai";
import { getRedisStats } from "@/lib/redis";
import { perfMonitor } from "@/lib/performance";
import { getCacheStats } from "@/lib/cache";
import { getSecurityHeaders } from "@/lib/security";
import { getClientIp } from "@/lib/ip";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/security";
import { logSecurityEvent } from "@/lib/securityEvents";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const APP_VERSION = process.env.APP_VERSION || "0.1.0";
const APP_NAME = "litstatus.com";
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const GIT_COMMIT = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "unknown";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: {
    app: string;
    version: string;
    buildTime: string;
    gitCommit: string;
  };
  services: {
    database: { status: string; latency?: number; error?: string };
    openai: { status: string; circuitBreaker?: CircuitBreakerStats };
    redis: { status: string; stats?: RedisStats };
  };
  performance: {
    slowOperations: number;
    avgOpenaiLatency: number;
    openaiSuccessRate: number;
    cacheHitRate: number;
    uptime: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    environment: string;
  };
}

interface CircuitBreakerStats {
  isOpen: boolean;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
}

interface RedisStats {
  enabled: boolean;
  errorCount: number;
  lastErrorTime?: number;
}

// Process start time for uptime calculation
const PROCESS_START_TIME = Date.now();

export async function GET(request: Request) {
  const startTime = Date.now();
  const url = new URL(request.url);
  const securityHeaders = getSecurityHeaders();
  const ip = getClientIp(request) || "unknown";

  // Check for detailed output flag
  const detailed = url.searchParams.get("detailed") === "true";

  // Rate limiting for health endpoint to prevent abuse
  const rateResult = await checkRateLimit(`health:${ip}`, 30, 60 * 1000);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      event_type: "rate_limited",
      severity: "warn",
      user_id: null,
      ip,
      path: url.pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { endpoint: "health" },
    });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { ...securityHeaders, ...createRateLimitHeaders(rateResult) },
      },
    );
  }

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: {
      app: APP_NAME,
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      gitCommit: GIT_COMMIT.substring(0, 7),
    },
    services: {
      database: { status: "unknown" },
      openai: { status: "unknown" },
      redis: { status: "unknown" },
    },
    performance: {
      slowOperations: 0,
      avgOpenaiLatency: 0,
      openaiSuccessRate: 1,
      cacheHitRate: 0,
      uptime: Math.floor((Date.now() - PROCESS_START_TIME) / 1000),
    },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
      environment: process.env.NODE_ENV || "unknown",
    },
  };

  let degraded = false;

  // Check database connectivity
  try {
    const dbStart = Date.now();
    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    const dbLatency = Date.now() - dbStart;

    if (error) {
      health.services.database.status = "error";
      health.services.database.error = error.message;
      health.status = "unhealthy";
    } else {
      health.services.database.status = "ok";
      health.services.database.latency = dbLatency;

      // Warn if database is slow
      if (dbLatency > 500) {
        degraded = true;
      }
    }
  } catch (error) {
    health.services.database.status = "error";
    health.services.database.error = (error as Error).message;
    health.status = "unhealthy";
  }

  // Check OpenAI circuit breaker
  try {
    const cbStats = await getCircuitBreakerStats("openai.chat.completions");
    health.services.openai.circuitBreaker = cbStats as CircuitBreakerStats;

    if (cbStats?.isOpen) {
      health.services.openai.status = "circuit_open";
      health.status = "degraded";
      degraded = true;
    } else if (cbStats && cbStats.failureCount > 2) {
      health.services.openai.status = "degraded";
      degraded = true;
    } else {
      health.services.openai.status = "ok";
    }
  } catch (error) {
    health.services.openai.status = "error";
    degraded = true;
  }

  // Check Redis
  try {
    const redisStats = getRedisStats();
    health.services.redis.stats = redisStats as RedisStats;

    if (!redisStats.enabled) {
      health.services.redis.status = "disabled";
    } else if (redisStats.errorCount > 5) {
      health.services.redis.status = "degraded";
      degraded = true;
    } else {
      health.services.redis.status = "ok";
    }
  } catch (error) {
    health.services.redis.status = "error";
    degraded = true;
  }

  // Collect performance metrics
  const metrics = perfMonitor.getMetrics();
  const slowOps = metrics.filter((m) => m.duration > 1000);
  health.performance.slowOperations = slowOps.length;

  const openaiMetrics = metrics.filter((m) => m.operation.startsWith("openai."));
  if (openaiMetrics.length > 0) {
    const totalLatency = openaiMetrics.reduce((sum, m) => sum + m.duration, 0);
    health.performance.avgOpenaiLatency = Math.round(totalLatency / openaiMetrics.length);
    health.performance.openaiSuccessRate =
      openaiMetrics.filter((m) => m.success).length / openaiMetrics.length;

    // Warn if OpenAI is slow
    if (health.performance.avgOpenaiLatency > 3000) {
      degraded = true;
    }

    // Warn if success rate is low
    if (health.performance.openaiSuccessRate < 0.9) {
      degraded = true;
    }
  }

  // Cache statistics
  const cacheStatsData = getCacheStats();
  health.performance.cacheHitRate =
    cacheStatsData.hits + cacheStatsData.misses > 0
      ? Math.round((cacheStatsData.hits / (cacheStatsData.hits + cacheStatsData.misses)) * 100) / 100
      : 0;

  // Memory stats not available in Edge Runtime (Cloudflare Workers)
  // health.system.memory remains at default values

  // Set overall status
  if (health.status !== "unhealthy" && degraded) {
    health.status = "degraded";
  }

  const responseTime = Date.now() - startTime;

  // Filter output for non-detailed requests
  const response = detailed ? health : {
    status: health.status,
    timestamp: health.timestamp,
    version: health.version,
    services: {
      database: { status: health.services.database.status },
      openai: { status: health.services.openai.status },
      redis: { status: health.services.redis.status },
    },
  };

  return NextResponse.json(response, {
    status: health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503,
    headers: {
      ...securityHeaders,
      ...createRateLimitHeaders(rateResult),
      "X-Response-Time": `${responseTime}ms`,
      "Cache-Control": "no-store, must-revalidate",
      "X-App-Version": APP_VERSION,
      "X-App-Name": APP_NAME,
    },
  });
}
