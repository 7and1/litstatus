# LitStatus.com Operations Guide

Comprehensive guide for monitoring, maintaining, and troubleshooting LitStatus.com in production.

## Table of Contents

- [Monitoring](#monitoring)
- [Logging](#logging)
- [Alerting](#alerting)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)
- [Backup and Recovery](#backup-and-recovery)
- [Security Operations](#security-operations)
- [Performance Tuning](#performance-tuning)
- [Incident Response](#incident-response)

## Monitoring

### Application Health

**Health Check Endpoint**:
```bash
# Check application health
curl https://litstatus.com/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2024-01-17T12:00:00Z"
}
```

**Monitor**:
- Uptime (target: 99.9%)
- Response time (target: < 500ms p95)
- Error rate (target: < 0.1%)
- Request rate

### Database Monitoring (Supabase)

**Key Metrics**:
- Active connections
- Query performance
- Storage usage
- Auth statistics

**Supabase Dashboard**:
1. Go to https://supabase.com/dashboard
2. Select project
3. Monitor:
   - Database > Metrics
   - Database > Reports
   - Authentication > Users

**Critical Queries to Monitor**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'litstatus'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'litstatus'
ORDER BY idx_scan ASC;
```

### Redis Monitoring (Upstash)

**Key Metrics**:
- Memory usage
- Request count
- Hit rate
- Connection count

**Upstash Console**:
1. Go to https://app.upstash.com/
2. Select database
3. Monitor:
   - Metrics > Requests
   - Metrics > Memory
   - Metrics > Keys

**Key Patterns to Monitor**:
```
quota:*           # Quota tracking
gen:*             # Generation cache
gen:inflight      # Concurrent request counter
rate-limit:*      # Rate limiting
```

### OpenAI API Monitoring

**Metrics to Track**:
- Request count
- Token usage
- Error rate
- Response time

**OpenAI Dashboard**:
1. Go to https://platform.openai.com/
2. Monitor:
   - Usage > Tokens
   - Usage > Requests
   - Usage > Errors

### Cloudflare Monitoring

**Web Analytics**:
1. Go to Cloudflare Dashboard
2. Select domain
3. Monitor:
   - Analytics > Traffic
   - Analytics > Performance
   - Analytics > Security

**Key Metrics**:
- Page views
- Unique visitors
- Bandwidth
- Cache hit rate
- Threats blocked

## Logging

### Application Logs

**Docker Logs**:
```bash
# View real-time logs
docker logs -f litstatus-web

# View last 100 lines
docker logs --tail 100 litstatus-web

# View logs with timestamps
docker logs -t litstatus-web

# Export logs
docker logs litstatus-web > app.log
```

**Cloudflare Pages Logs**:
1. Go to Cloudflare Dashboard
2. Pages > litstatus > Functions
3. View real-time logs

### Database Logs

**Supabase Logs**:
1. Go to Supabase Dashboard
2. Database > Logs
3. Filter by:
   - Query logs
   - Error logs
   - Connection logs

**Export Logs**:
```bash
# Via Supabase CLI
supabase db logs -f > database.log
```

### Security Events Log

**View Security Events**:
```sql
-- Recent security events
SELECT
  event_type,
  severity,
  COUNT(*),
  MAX(created_at) as last_occurrence
FROM litstatus.security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY COUNT(*) DESC;

-- Suspicious activity
SELECT * FROM litstatus.security_events
WHERE severity = 'error'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Rate limit violations
SELECT * FROM litstatus.security_events
WHERE event_type = 'rate_limited'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Funnel Analytics

**Conversion Tracking**:
```sql
-- Funnel summary
SELECT
  event,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM litstatus.funnel_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event
ORDER BY count DESC;

-- Conversion rate
WITH users as (
  SELECT DISTINCT user_id, session_id
  FROM litstatus.funnel_events
  WHERE created_at > NOW() - INTERVAL '24 hours'
),
generate_events as (
  SELECT DISTINCT user_id, session_id
  FROM litstatus.funnel_events
  WHERE event = 'generate_success'
    AND created_at > NOW() - INTERVAL '24 hours'
)
SELECT
  COUNT(DISTINCT users.user_id) as total_users,
  COUNT(DISTINCT generate_events.user_id) as converting_users,
  ROUND(
    COUNT(DISTINCT generate_events.user_id)::numeric /
    NULLIF(COUNT(DISTINCT users.user_id), 0) * 100,
    2
  ) as conversion_rate
FROM users
LEFT JOIN generate_events ON users.user_id = generate_events.user_id;
```

## Alerting

### Recommended Alerts

**1. High Error Rate**:
- Condition: Error rate > 5% for 5 minutes
- Severity: High
- Action: Investigate logs, check dependencies

**2. High Response Time**:
- Condition: p95 response time > 2 seconds for 5 minutes
- Severity: Medium
- Action: Check database performance, Redis, OpenAI API

**3. Rate Limit Violations**:
- Condition: > 100 rate limit violations in 5 minutes
- Severity: Medium
- Action: Check for abuse, adjust limits if needed

**4. Database Connection Issues**:
- Condition: Unable to connect to database
- Severity: Critical
- Action: Check Supabase status, credentials

**5. Redis Connection Issues**:
- Condition: Unable to connect to Redis
- Severity: High
- Action: Check Upstash status, fallback to in-memory

**6. OpenAI API Failures**:
- Condition: Error rate > 50% for OpenAI requests
- Severity: High
- Action: Check OpenAI status page, verify API key

**7. Security Events**:
- Condition: > 10 high severity security events in 5 minutes
- Severity: Critical
- Action: Review security events, block malicious IPs

### Setting Up Alerts

**Cloudflare Email Alerts**:
1. Go to Cloudflare Dashboard
2. Monitoring > Alerts
3. Create alert rules

**Uptime Monitoring**:
- Use UptimeRobot, Pingdom, or similar
- Monitor https://litstatus.com/api/health
- Alert on downtime > 1 minute

## Troubleshooting

### Common Issues

#### 1. Application Not Responding

**Symptoms**: Timeout errors, 503 responses

**Diagnosis**:
```bash
# Check container status
docker ps | grep litstatus

# Check logs
docker logs --tail 100 litstatus-web

# Check health endpoint
curl -v https://litstatus.com/api/health
```

**Solutions**:
- Restart container: `docker restart litstatus-web`
- Check resource usage: `docker stats litstatus-web`
- Scale up if needed
- Check database connectivity

#### 2. High Response Times

**Symptoms**: Slow API responses, timeouts

**Diagnosis**:
```bash
# Check database queries
# In Supabase Dashboard > Database > Reports

# Check Redis response time
# In Upstash Console > Metrics

# Check OpenAI API status
curl https://status.openai.com/api/v2/status.json
```

**Solutions**:
- Optimize slow queries
- Add database indexes
- Increase cache TTL
- Scale database resources
- Implement request queuing

#### 3. Database Connection Errors

**Symptoms**: "Connection refused", "Pool exhausted"

**Diagnosis**:
```bash
# Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# Check connection pool
# In Supabase Dashboard > Database > Metrics
```

**Solutions**:
- Verify credentials
- Check network connectivity
- Increase pool size
- Restart application

#### 4. Redis Connection Errors

**Symptoms**: Rate limiting not working, cache misses

**Diagnosis**:
```bash
# Test Redis connection
curl $UPSTASH_REDIS_REST_URL/ping

# Check Redis status
# In Upstash Console > Metrics
```

**Solutions**:
- Verify credentials
- Check network connectivity
- Application will fallback to in-memory
- Contact Upstash support

#### 5. OpenAI API Errors

**Symptoms**: Generation failures, "API error"

**Diagnosis**:
```bash
# Check OpenAI status
curl https://status.openai.com/api/v2/status.json

# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Solutions**:
- Verify API key is valid
- Check quota limits
- Implement retry logic
- Contact OpenAI support

#### 6. High Memory Usage

**Symptoms**: OOM errors, container restarts

**Diagnosis**:
```bash
# Check memory usage
docker stats litstatus-web

# Check memory leaks
# In application logs
```

**Solutions**:
- Restart container
- Increase memory limit
- Investigate memory leaks
- Optimize caching strategy

#### 7. Security Events Spikes

**Symptoms**: High rate limit violations, suspicious activity

**Diagnosis**:
```sql
-- Check security events
SELECT * FROM litstatus.security_events
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 100;

-- Check rate limit violations
SELECT
  ip,
  user_id,
  COUNT(*) as violations
FROM litstatus.security_events
WHERE event_type = 'rate_limited'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip, user_id
ORDER BY violations DESC
LIMIT 10;
```

**Solutions**:
- Block malicious IPs
- Adjust rate limits
- Implement CAPTCHA
- Contact abuse team

### Debug Mode

Enable debug logging:
```bash
# Via environment variable
DEBUG=litstatus:* npm run dev

# In production (docker-compose.yml)
environment:
  DEBUG: "litstatus:*"
  NODE_ENV: "production"
```

## Maintenance

### Regular Tasks

**Daily**:
- Review error logs
- Check security events
- Monitor key metrics

**Weekly**:
- Review performance metrics
- Check database storage
- Review security events summary
- Test backups

**Monthly**:
- Review and update dependencies
- Analyze cost optimization
- Review user feedback
- Security audit

### Database Maintenance

**Vacuum and Analyze**:
```sql
-- Run in Supabase SQL Editor
VACUUM ANALYZE litstatus.profiles;
VACUUM ANALYZE litstatus.pro_wishlist;
VACUUM ANALYZE litstatus.feedback;
VACUUM ANALYZE litstatus.funnel_events;
VACUUM ANALYZE litstatus.security_events;
```

**Index Maintenance**:
```sql
-- Check for fragmented indexes
REINDEX DATABASE litstatus;

-- Update statistics
ANALYZE litstatus.profiles;
ANALYZE litstatus.pro_wishlist;
ANALYZE litstatus.feedback;
```

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Major version updates
npx npm-check-updates -u
npm install
```

### Log Rotation

**Docker Logs**:
```bash
# Configure in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Backup and Recovery

### Database Backups

**Supabase Automated Backups**:
- Enabled by default
- Retention: 7 days (free tier), 30 days (pro tier)
- Location: Same region as database

**Manual Backup**:
```sql
-- Via Supabase Dashboard
# Database > Backups > Download

-- Via Supabase CLI
supabase db dump -f backup.sql
```

**Restore from Backup**:
```sql
-- Via Supabase Dashboard
# Database > Backups > Restore

-- Via Supabase CLI
supabase db reset --db-url "postgresql://..."
```

### Code Backups

**Git Repository**:
- Push to GitHub regularly
- Tag releases
- Use branches for features

**Recovery**:
```bash
# Clone repository
git clone https://github.com/7and1/litstatus.git

# Checkout specific commit
git checkout <commit-hash>

# Checkout tag
git checkout v0.1.0
```

### Disaster Recovery

**Recovery Steps**:

1. **Assess Damage**:
   - Identify affected systems
   - Determine data loss
   - Estimate recovery time

2. **Restore Database**:
   ```bash
   # Restore from backup
   supabase db reset --db-url "postgresql://..."

   # Run migrations
   supabase db push
   ```

3. **Deploy Code**:
   ```bash
   # Checkout stable version
   git checkout v0.1.0

   # Deploy to production
   ./deploy.sh vps
   ```

4. **Verify Systems**:
   ```bash
   # Health checks
   curl https://litstatus.com/api/health

   # Test key endpoints
   curl https://litstatus.com/api/quota
   ```

## Security Operations

### Security Monitoring

**Daily Security Review**:
```sql
-- High severity events
SELECT * FROM litstatus.security_events
WHERE severity = 'error'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Failed auth attempts
SELECT * FROM litstatus.security_events
WHERE event_type = 'auth_failure'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Suspicious activity
SELECT
  ip,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM litstatus.security_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip
HAVING COUNT(*) > 100
ORDER BY attempts DESC;
```

### Security Hardening

**Regular Security Audits**:
```bash
# Run security audit
npm audit

# Check for secrets in code
git grep "sk-"
git grep "api_key"
git grep "password"

# Review .gitignore
cat .gitignore
```

**Update Dependencies**:
```bash
# Security updates
npm audit fix

# Review major updates
npm outdated
```

### Incident Response

**Security Incident Response**:

1. **Identify**:
   - Detect suspicious activity
   - Confirm security breach
   - Assess impact

2. **Contain**:
   - Block malicious IPs
   - Disable compromised accounts
   - Isolate affected systems

3. **Eradicate**:
   - Remove malicious code
   - Patch vulnerabilities
   - Update credentials

4. **Recover**:
   - Restore from backups
   - Monitor for recurrence
   - Document lessons learned

## Performance Tuning

### Database Optimization

**Query Optimization**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON litstatus.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at
  ON litstatus.funnel_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_severity
  ON litstatus.security_events(severity, created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM litstatus.funnel_events
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Redis Optimization

**Memory Optimization**:
```bash
# Monitor key patterns
# In Upstash Console > Browser > Keys

# Set appropriate TTL
gen:*          # 1 hour
rate-limit:*   # 1 minute
quota:*        # 24 hours
```

### Application Optimization

**Cache Strategy**:
```typescript
// Increase cache hit rate
const CACHE_TTL_SECONDS = 3600; // 1 hour

// Implement cache warming
async function warmCache() {
  const popularQueries = [...];
  for (const query of popularQueries) {
    await generateCaption(query);
  }
}
```

**Rate Limiting**:
```typescript
// Adjust based on capacity
const MAX_INFLIGHT = 25; // Max concurrent requests

// Implement queuing for high load
if (inflight > MAX_INFLIGHT) {
  // Queue request instead of rejecting
  await queue.add(request);
}
```

### Scaling

**Vertical Scaling**:
- Increase container resources
- Scale database
- Scale Redis

**Horizontal Scaling**:
- Deploy multiple instances
- Use load balancer
- Implement distributed caching

## Incident Response

### Incident Severity Levels

**P1 - Critical**:
- Complete service outage
- Data breach
- Revenue impact > $1000/hour

**P2 - High**:
- Major feature broken
- Performance degradation
- Security vulnerability

**P3 - Medium**:
- Minor feature broken
- Intermittent issues
- Non-critical bugs

**P4 - Low**:
- Cosmetic issues
- Documentation errors
- Enhancement requests

### Incident Response Process

1. **Detection**:
   - Automated alerts
   - User reports
   - Monitoring tools

2. **Triage**:
   - Assess severity
   - Determine impact
   - Assign owner

3. **Investigation**:
   - Gather logs
   - Reproduce issue
   - Identify root cause

4. **Resolution**:
   - Implement fix
   - Verify solution
   - Deploy to production

5. **Post-Incident**:
   - Document incident
   - Update procedures
   - Implement preventive measures

### Communication

**Internal Communication**:
- Status page updates
- Slack/Discord notifications
- Email summaries

**External Communication**:
- User notifications
- Status page updates
- Social media updates

## Resources

### Monitoring Tools

- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Upstash Console**: https://app.upstash.com/
- **OpenAI Dashboard**: https://platform.openai.com/

### Status Pages

- **Cloudflare Status**: https://www.cloudflarestatus.com/
- **Supabase Status**: https://status.supabase.com/
- **OpenAI Status**: https://status.openai.com/

### Documentation

- [README.md](/README.md) - Project overview
- [docs/API.md](/docs/API.md) - API documentation
- [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md) - Developer guide
- [SECURITY_README.md](/SECURITY_README.md) - Security documentation

---

**Last Updated**: 2025-01-17
**Version**: 0.1.0
