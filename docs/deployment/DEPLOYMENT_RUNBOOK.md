# LitStatus Deployment Runbook

Production deployment guide for LitStatus.com. This document covers step-by-step deployment procedures, health checks, troubleshooting, and rollback procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Methods](#deployment-methods)
4. [Health Verification](#health-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

---

## Prerequisites

### Required Tools

```bash
# Node.js (version 20+)
node --version

# Git
git --version

# For Cloudflare deployment
npm install -g wrangler

# For Docker deployment
docker --version
docker-compose --version
```

### Required Accounts & Services

1. **GitHub Repository** - Source code hosting
2. **Cloudflare Pages** (primary) - Edge deployment
3. **VPS/Docker** (fallback) - Node.js runtime deployment
4. **Supabase** - Database and authentication
5. **Upstash Redis** (recommended) - Rate limiting and caching
6. **OpenAI** - AI generation API
7. **Resend** (optional) - Email notifications

---

## Pre-Deployment Checklist

### 1. Code Quality

```bash
# Run linting
npm run lint:fix

# Type checking
npm run type-check

# Run tests (if configured)
npm run test:all

# Production build check
npm run build:production
```

### 2. Environment Variables

Verify all required environment variables are set:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_TEXT_MODEL` | No | Text model (default: gpt-4o-mini) |
| `OPENAI_VISION_MODEL` | No | Vision model (default: gpt-4o-mini) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production site URL |
| `UPSTASH_REDIS_REST_URL` | Recommended | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Upstash Redis token |
| `ADMIN_EXPORT_TOKEN` | Yes | Admin export token |
| `ADMIN_SIGNING_SECRET` | Recommended | Admin HMAC signing secret |
| `RESEND_API_KEY` | No | Resend API key |
| `RESEND_FROM` | No | Resend from address |
| `RESEND_NOTIFY_EMAIL` | No | Admin notification email |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | No | Plausible domain |
| `NEXT_PUBLIC_PLAUSIBLE_SRC` | No | Plausible script URL |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics ID |

### 3. Database Migration

```bash
# Run schema migration in Supabase SQL Editor
# Copy contents of supabase/schema.sql and execute
```

### 4. Backup Existing Deployment

```bash
# For Docker/VPS deployment
ssh user@server "docker exec litstatus-db pg_dump -U postgres litstatus > backup.sql"
scp user@server:backup.sql ./backups/pre-deploy-$(date +%Y%m%d).sql
```

---

## Deployment Methods

### Method 1: Cloudflare Pages (Primary)

Cloudflare Pages provides global edge deployment with automatic HTTPS and DDoS protection.

#### GitHub Actions Automatic Deployment

The project includes GitHub Actions workflow for automatic deployment:

1. **Configure GitHub Secrets:**

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN
   gh secret set CLOUDFLARE_ACCOUNT_ID
   gh secret set SUPABASE_URL
   gh secret set SUPABASE_ANON_KEY
   gh secret set SUPABASE_SERVICE_ROLE_KEY
   gh secret set OPENAI_API_KEY
   gh secret set UPSTASH_REDIS_REST_URL
   gh secret set UPSTASH_REDIS_REST_TOKEN
   gh secret set ADMIN_EXPORT_TOKEN
   ```

2. **Deploy:**

   ```bash
   git push origin main
   ```

   GitHub Actions will automatically:
   - Build the project
   - Run tests
   - Deploy to Cloudflare Pages

3. **Monitor Deployment:**

   Visit `https://github.com/7and1/litstatus/actions`

#### Manual Cloudflare Deployment

```bash
# Install Cloudflare adapter
npm install -D @cloudflare/next-on-pages

# Build for Cloudflare
npx @cloudflare/next-on-pages

# Deploy using Wrangler
npx wrangler pages deploy .vercel/output/static --project-name=litstatus
```

#### Cloudflare Configuration

Create `wrangler.toml`:

```toml
name = "litstatus"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[env.production]
vars = { ENVIRONMENT = "production" }
```

---

### Method 2: Docker/VPS Deployment

For deployments requiring Node.js runtime (admin endpoints, full Redis support).

#### Using deploy.sh Script

```bash
# Deploy to VPS
./deploy.sh vps

# Deploy to both Cloudflare and VPS
./deploy.sh both
```

#### Manual Docker Deployment

1. **Build Image:**

   ```bash
   docker build -t litstatus:latest .
   ```

2. **Save Image:**

   ```bash
   docker save litstatus:latest | gzip > litstatus.tar.gz
   ```

3. **Transfer to Server:**

   ```bash
   scp litstatus.tar.gz user@server:/path/to/app/
   ```

4. **Load and Run on Server:**

   ```bash
   ssh user@server
   cd /path/to/app
   gunzip < litstatus.tar.gz | docker load
   docker-compose up -d --build
   ```

#### Docker Compose Configuration

```yaml
version: '3.8'

services:
  app:
    image: litstatus:latest
    ports:
      - "3023:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

### Method 3: Platform.sh

```bash
# Install CLI
npm install -g platformsh

# Deploy
platform project:push
```

---

## Health Verification

After deployment, verify system health:

### 1. API Health Check

```bash
# Basic health
curl -w "\nHTTP Status: %{http_code}\n" \
  https://litstatus.com/api/health

# Detailed health
curl https://litstatus.com/api/health | jq '.'
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T10:00:00.000Z",
  "services": {
    "database": { "status": "ok", "latency": <200 },
    "openai": { "status": "ok" },
    "redis": { "status": "ok" }
  }
}
```

### 2. Endpoints Verification

```bash
# Test generate endpoint
curl -X POST https://litstatus.com/api/generate \
  -F "text=Test post" \
  -F "mode=Standard"

# Test quota endpoint
curl https://litstatus.com/api/quota
```

### 3. Database Connectivity

Verify in Supabase Dashboard:
- Database is accessible
- Tables exist (profiles, pro_wishlist, feedback, funnel_events, security_events)
- RLS policies are enabled

### 4. Redis Connectivity

For Upstash:
- Check dashboard for connectivity
- Verify key patterns exist: `ratelimit:*`, `quota:*`, `gen:*`

---

## Rollback Procedures

### Cloudflare Pages Rollback

```bash
# Using Wrangler
npx wrangler pages deployments list --project-name=litstatus

# Rollback to specific deployment
npx wrangler pages deployment rollback --project-name=litstatus <deployment-id>
```

Or via Cloudflare Dashboard:
1. Go to Pages > litstatus
2. Click "Deployments"
3. Click "Rollback" on previous deployment

### Docker Rollback

```bash
# SSH into server
ssh user@server
cd /path/to/app

# Pull previous image
docker pull litstatus:previous-tag

# Restart with previous version
docker-compose down
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
psql -U postgres -d litstatus < backup.sql
```

---

## Troubleshooting

### Issue: Build Fails

**Symptoms:** `npm run build` exits with error

**Solutions:**
```bash
# Clear cache
rm -rf .next node_modules
npm install

# Check Node version
node --version  # Should be 20+

# Check TypeScript errors
npm run type-check

# Check lint errors
npm run lint:fix
```

---

### Issue: Health Check Returns "unhealthy"

**Symptoms:** `/api/health` returns 503

**Diagnosis:**
```bash
curl https://litstatus.com/api/health | jq '.services'
```

**Solutions:**

1. **Database Error:**
   - Check Supabase status: https://status.supabase.com
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - Check RLS policies

2. **OpenAI Error:**
   - Check OpenAI status: https://status.openai.com
   - Verify `OPENAI_API_KEY`
   - Check circuit breaker state in health response

3. **Redis Error:**
   - Check Upstash dashboard
   - Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
   - System falls back to in-memory if Redis fails

---

### Issue: Rate Limiting Not Working

**Symptoms:** Quota not enforced, excessive requests allowed

**Solutions:**
```bash
# Verify Redis connectivity
curl https://litstatus.com/api/health | jq '.services.redis'

# Check environment variables
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test rate limit manually
for i in {1..50}; do
  curl -s https://litstatus.com/api/quota -w " %{http_code}\n"
done
```

---

### Issue: Auth Token Invalid

**Symptoms:** 401 errors for authenticated requests

**Solutions:**
```bash
# Verify Supabase JWT
# In Supabase Dashboard > Authentication > JWT Template
# Check expiration and claims

# Test token manually
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  https://litstatus.com/api/quota
```

---

### Issue: Image Upload Fails

**Symptoms:** Vision API returns error

**Solutions:**
```bash
# Check file size (max 10MB)
ls -lh image.jpg

# Check file type (must be JPEG, PNG, WebP, or GIF)
file image.jpg

# Verify Pro status
curl -H "Authorization: Bearer $TOKEN" \
  https://litstatus.com/api/quota | jq '.quota.isPro'
```

---

### Issue: CSP Violations

**Symptoms:** CSP reports in security_events table

**Solutions:**
1. Review CSP report: `/api/security/csp-report`
2. Check `src/lib/security.ts` for CSP configuration
3. Update CSP directives if needed:
   ```typescript
   export function getPageCspHeaders(nonce: string) {
     return {
       "Content-Security-Policy": [
         `default-src 'self'`,
         `script-src 'self' 'nonce-${nonce}' https://plausible.io`,
         // Add your domains here
       ].join("; "),
     };
   }
   ```

---

## Monitoring

### Log Locations

| Platform | Log Location |
|----------|-------------|
| Cloudflare | Dashboard > Pages > litstatus > Logs |
| Docker | `docker logs -f litstatus-app` |
| Supabase | Dashboard > Logs |
| Upstash | Dashboard > Metrics |

### Key Metrics to Monitor

1. **Response Time:** P50 < 500ms, P95 < 2000ms
2. **Error Rate:** < 1%
3. **Cache Hit Rate:** > 70%
4. **OpenAI Success Rate:** > 95%
5. **Database Latency:** < 100ms

### Alerting

Configure alerts for:
- Health check status != "healthy"
- Error rate > 5%
- OpenAI circuit breaker open
- Database connection failures

### Manual Monitoring Commands

```bash
# Continuous health monitoring
watch -n 30 'curl -s https://litstatus.com/api/health | jq'

# Check response time
curl -w "@-" -o /dev/null -s https://litstatus.com/api/health <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF
```

---

## Post-Deployment Tasks

1. **Verify Analytics:**
   - Check Plausible/GA for traffic
   - Test event tracking in browser console

2. **Verify Email Notifications:**
   - Join wishlist manually
   - Check email arrives

3. **Verify Admin Endpoints:**
   ```bash
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     "https://litstatus.com/api/admin/wishlist/export?format=csv"
   ```

4. **Update Documentation:**
   - Update version number in README
   - Document any breaking changes

5. **Notify Team:**
   - Send deployment confirmation
   - Share any known issues

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| DevOps Lead | devops@litstatus.com |
| Backend Lead | backend@litstatus.com |
| Security | security@litstatus.com |

---

## Appendix: Deploy Script Reference

The `deploy.sh` script performs:
1. Pre-flight checks (git status, build verification)
2. Remote deployment (rsync + docker-compose)
3. Health verification
4. Rollback on failure

Usage:
```bash
./deploy.sh [vps|cloudflare|both] [--skip-health] [--no-rollback]
```

Exit codes:
- `0`: Success
- `1`: Pre-flight check failed
- `2`: Build failed
- `3`: Deployment failed
- `4`: Health check failed
