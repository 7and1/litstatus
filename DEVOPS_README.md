# DevOps Documentation for litstatus.com

## Overview

This document covers all DevOps aspects of deploying and maintaining litstatus.com in production.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Health Monitoring](#health-monitoring)
3. [Metrics](#metrics)
4. [Database Backups](#database-backups)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD Pipelines](#cicd-pipelines)
7. [Docker Deployment](#docker-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Production Environment

- **Primary URL**: https://litstatus.com (VPS at 107.174.42.198:3023)
- **CDN URL**: https://litstatus.pages.dev (Cloudflare Pages)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Upstash Redis (optional)

### Deployment Methods

1. **VPS Docker Deployment** (Primary)
   ```bash
   ./deploy.sh vps
   ```

2. **Cloudflare Pages** (CDN)
   ```bash
   ./deploy.sh cloudflare
   ```

3. **Both** (Recommended)
   ```bash
   ./deploy.sh both
   ```

### Deployment Script Options

```bash
./deploy.sh [TARGET] [OPTIONS]

Targets:
  vps          Deploy to VPS Docker only
  cloudflare   Deploy to Cloudflare Pages only
  both         Deploy to both (default)

Options:
  --skip-tests    Skip build and type checks
  --force         Deploy without prompts
  --verbose       Enable verbose logging
  --dry-run       Show what would be done
  --rollback      Rollback to previous version
```

---

## Health Monitoring

### Health Endpoint

```
GET /api/health
```

**Basic Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": {
    "app": "litstatus.com",
    "version": "0.1.0",
    "buildTime": "2024-01-01T00:00:00.000Z",
    "gitCommit": "abc1234"
  },
  "services": {
    "database": { "status": "ok" },
    "openai": { "status": "ok" },
    "redis": { "status": "ok" }
  }
}
```

**Detailed Response** (add `?detailed=true`):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": {
    "app": "litstatus.com",
    "version": "0.1.0",
    "buildTime": "2024-01-01T00:00:00.000Z",
    "gitCommit": "abc1234"
  },
  "services": {
    "database": { "status": "ok", "latency": 45 },
    "openai": { "status": "ok", "circuitBreaker": { ... } },
    "redis": { "status": "ok", "stats": { ... } }
  },
  "performance": {
    "slowOperations": 0,
    "avgOpenaiLatency": 1250,
    "openaiSuccessRate": 0.98,
    "cacheHitRate": 0.75,
    "uptime": 3600
  },
  "system": {
    "memory": { "used": 128, "total": 256, "percentage": 50 },
    "environment": "production"
  }
}
```

### Health Status Codes

| Status | Code | Description |
|--------|------|-------------|
| healthy | 200 | All systems operational |
| degraded | 200 | Some issues but service is functional |
| unhealthy | 503 | Critical failures detected |

---

## Metrics

### Metrics Endpoint

```
GET /api/metrics
Authorization: Bearer METRICS_ACCESS_TOKEN
```

The metrics endpoint returns Prometheus-compatible metrics for monitoring.

**Available Metrics:**

| Metric | Type | Description |
|--------|------|-------------|
| `litstatus_com_up` | Gauge | Application uptime |
| `litstatus_com_requests_total` | Counter | Total HTTP requests |
| `litstatus_com_responses_total` | Counter | Total HTTP responses |
| `litstatus_com_errors_total` | Counter | Total error count |
| `litstatus_com_operation_duration_*` | Histogram | Operation latency metrics |
| `litstatus_com_cache_hit_rate` | Gauge | Cache hit rate |
| `litstatus_com_openai_latency_avg` | Gauge | Average OpenAI API latency |
| `litstatus_com_circuit_breaker_open` | Gauge | Circuit breaker state |
| `litstatus_com_database_up` | Gauge | Database connectivity |
| `litstatus_com_redis_enabled` | Gauge | Redis connection status |

### Prometheus Configuration

```yaml
scrape_configs:
  - job_name: 'litstatus'
    scrape_interval: 30s
    metrics_path: '/api/metrics'
    scheme: https
    authorization:
      credentials: 'YOUR_METRICS_TOKEN'
    static_configs:
      - targets: ['litstatus.com']
```

---

## Database Backups

### Backup Script

```bash
./scripts/backup-database.sh [OPTIONS]
```

**Options:**
- `--remote` - Backup from remote Supabase instance
- `--local` - Backup from local database
- `--restore FILE` - Restore from backup file
- `--list` - List available backups
- `--cleanup` - Remove old backups (>30 days)
- `--scheduled` - For cron jobs (auto cleanup)

### Automated Backups (Cron)

```bash
# Daily backup at 2 AM UTC
0 2 * * * cd /path/to/litstatus.com && ./scripts/backup-database.sh --scheduled
```

### Backup Location

- Local: `./backups/database/`
- Retention: 30 days
- Format: `litstatus_db_YYYYMMDD_HHMMSS.sql` or `.json`

### Restoring from Backup

```bash
# List available backups
./scripts/backup-database.sh --list

# Restore specific backup
./scripts/backup-database.sh --restore backups/database/litstatus_db_20240101_120000.sql
```

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
# Edit .env with your values
```

**Critical Variables:**

```bash
# OpenAI (Required)
OPENAI_API_KEY=sk-xxxxx

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Site Configuration (Required)
NEXT_PUBLIC_SITE_URL=https://litstatus.com

# Monitoring (Recommended)
METRICS_ACCESS_TOKEN=xxxxx

# Redis (Optional but recommended)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx
```

### Environment Validation

The application validates environment variables at startup. To skip validation:

```bash
SKIP_ENV_VALIDATION=true npm start
```

---

## CI/CD Pipelines

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and PR
   - Lint, type check, build verification
   - Security audit
   - Docker build test

2. **VPS Deployment** (`.github/workflows/deploy-vps.yml`)
   - Auto-deploys to VPS on push to main
   - Pre-flight checks
   - Backup before deploy
   - Health verification

3. **Cloudflare Deployment** (`.github/workflows/deploy-cloudflare.yml`)
   - Auto-deploys to Cloudflare Pages on push to main
   - Pre-flight checks
   - Health verification

### Required GitHub Secrets

```
VPS_SSH_PRIVATE_KEY          # SSH key for VPS access
SUPABASE_URL                 # Supabase project URL
SUPABASE_ANON_KEY            # Supabase anonymous key
CLOUDFLARE_API_TOKEN         # Cloudflare API token
CLOUDFLARE_ACCOUNT_ID        # Cloudflare Account ID
```

---

## Docker Deployment

### Building the Image

```bash
docker build -t litstatus:latest .
```

### Running with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop services
docker-compose down

# Rebuild without cache
docker-compose build --no-cache
```

### Container Health Check

The container includes a built-in health check:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Viewing Container Logs

```bash
# Live logs
docker logs -f litstatus-web

# Last 100 lines
docker logs --tail 100 litstatus-web

# Since timestamp
docker logs --since 2024-01-01T00:00:00 litstatus-web
```

---

## Troubleshooting

### Container Not Starting

```bash
# Check container logs
docker logs litstatus-web

# Check container status
docker inspect litstatus-web

# Restart container
docker-compose restart
```

### Database Connection Issues

```bash
# Check health endpoint
curl https://litstatus.com/api/health?detailed=true

# Check Supabase status
# Visit https://status.supabase.com
```

### High Memory Usage

```bash
# Check container stats
docker stats litstatus-web --no-stream

# If needed, adjust resource limits in docker-compose.yml
```

### Rollback Deployment

```bash
# Automatic rollback (uses last backup)
./deploy.sh --rollback

# Or specify backup
./deploy.sh --rollback /tmp/litstatus-backups/20240101_120000
```

### Useful SSH Commands

```bash
# Connect to VPS
ssh root@107.174.42.198

# View Docker logs on VPS
ssh root@107.174.42.198 'docker logs -f litstatus-web'

# Check container status on VPS
ssh root@107.174.42.198 'docker ps'

# Restart container on VPS
ssh root@107.174.42.198 'cd /opt/docker-projects/standalone-apps/litstatus && docker-compose restart'
```

---

## Monitoring Commands Summary

```bash
# Health check
curl https://litstatus.com/api/health

# Detailed health
curl https://litstatus.com/api/health?detailed=true

# Metrics (requires auth)
curl -H 'Authorization: Bearer $METRICS_TOKEN' https://litstatus.com/api/metrics

# Response time
curl -w "\nResponse Time: %{time_total}s\n" https://litstatus.com/api/health -o /dev/null
```

---

## Additional Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Cloudflare Dashboard: https://dash.cloudflare.com
- VPS SSH: `ssh root@107.174.42.198`
- GitHub Actions: https://github.com/7and1/litstatus/actions
