# LitStatus Security Guide

Comprehensive security documentation for LitStatus.com production deployment.

## Table of Contents

1. [Security Overview](#security-overview)
2. [CSP Configuration](#csp-configuration)
3. [Rate Limiting](#rate-limiting)
4. [Admin API Authentication](#admin-api-authentication)
5. [Input Validation](#input-validation)
6. [Security Monitoring](#security-monitoring)
7. [Incident Response](#incident-response)

---

## Security Overview

### Security Layers

LitStatus implements defense-in-depth with multiple security layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Network Layer              │ Cloudflare DDoS, HTTPS only   │
├─────────────────────────────────────────────────────────────┤
│  Input Validation           │ Zod schemas, length limits     │
├─────────────────────────────────────────────────────────────┤
│  Rate Limiting              │ Redis-backed, distributed      │
├─────────────────────────────────────────────────────────────┤
│  Authentication             │ Supabase JWT, RLS policies     │
├─────────────────────────────────────────────────────────────┤
│  Output Security            │ CSP headers, XSS protection    │
├─────────────────────────────────────────────────────────────┤
│  Audit Logging              │ Security events table          │
└─────────────────────────────────────────────────────────────┘
```

### Security Headers

All API responses include:

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "..."
}
```

---

## CSP Configuration

### Content Security Policy

The application uses strict CSP with nonce-based inline script allowance.

#### Page Routes (with nonce)

```typescript
// src/lib/security.ts
export function getPageCspHeaders(nonce: string): Record<string, string> {
  return {
    "Content-Security-Policy": [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://plausible.io`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https: blob:`,
      `font-src 'self' data:`,
      `connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com https://plausible.io`,
      `frame-src 'none'`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
      `report-uri /api/security/csp-report`,
    ].join("; "),
  };
}
```

#### API Routes (strict)

```typescript
export function getApiCspHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": [
      `default-src 'none'`,
      `script-src 'none'`,
      `style-src 'none'`,
      `img-src 'none'`,
      `font-src 'none'`,
      `connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com`,
      `frame-ancestors 'none'`,
      `base-uri 'none'`,
      `form-action 'none'`,
    ].join("; "),
  };
}
```

### CSP Violation Reporting

Violations are automatically logged to the `security_events` table:

```sql
-- View CSP violations
SELECT * FROM security_events
WHERE event_type = 'csp_violation'
ORDER BY created_at DESC
LIMIT 100;
```

### Updating CSP

To add new domains to CSP:

1. Edit `src/lib/security.ts`
2. Add domain to appropriate directive
3. Test in staging environment
4. Deploy and monitor CSP reports

---

## Rate Limiting

### Configuration

Rate limiting is implemented using Redis with in-memory fallback.

```typescript
// src/lib/security.ts
export async function checkRateLimit(
  identifier: string,
  limit: number = 20,
  windowMs: number = 60 * 1000,
): Promise<RateLimitResult>
```

### Endpoint Limits

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| POST /api/generate | 40 | 60s | user ID or IP |
| GET /api/quota | 60 | 60s | user ID or IP |
| POST /api/wishlist | 10 | 60s | user ID or IP |
| POST /api/feedback | 20 | 60s | user ID or IP |
| POST /api/events | 120 | 60s | IP |
| GET /api/health | 30 | 60s | IP |
| Admin endpoints | 10 | 60s | IP |

### Rate Limit Response Headers

```http
X-RateLimit-Limit: 40
X-RateLimit-Remaining: 35
X-RateLimit-Reset: 1705584000
Retry-After: 10
```

### Redis Key Format

```
ratelimit:{identifier}:{window_timestamp}
```

### Customizing Rate Limits

To change rate limits for an endpoint:

```typescript
// In the API route handler
const rate = await checkRateLimit(
  `custom:${identifier}`,  // Custom key prefix
  100,                       // Custom limit
  60 * 1000                  // Custom window (1 minute)
);
```

---

## Admin API Authentication

Admin endpoints support two authentication methods:

### Method 1: HMAC Signature (Recommended)

More secure as the secret never travels over the network.

#### Server Configuration

Set the signing secret in environment:

```bash
ADMIN_SIGNING_SECRET=your-random-64-character-secret
```

#### Client Implementation

```typescript
import crypto from 'crypto';

function signRequest(
  method: string,
  path: string,
  timestamp: number,
  secret: string
): string {
  const payload = `${timestamp}${method}${path}`;
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Usage
const secret = process.env.ADMIN_SIGNING_SECRET!;
const timestamp = Math.floor(Date.now() / 1000);
const signature = signRequest('GET', '/api/admin/wishlist/export', timestamp, secret);

fetch('https://litstatus.com/api/admin/wishlist/export', {
  headers: {
    'X-Signature': signature,
    'X-Timestamp': timestamp.toString(),
  }
});
```

### Method 2: Bearer Token (Legacy)

Simple but less secure than HMAC.

#### Server Configuration

```bash
ADMIN_EXPORT_TOKEN=your-random-token
```

#### Client Usage

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://litstatus.com/api/admin/wishlist/export?format=csv"
```

Or via query parameter:

```bash
curl "https://litstatus.com/api/admin/wishlist/export?token=YOUR_TOKEN&format=csv"
```

### Security Considerations

1. **Token Generation:**
   ```bash
   # Generate secure token
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Token Rotation:**
   - Rotate tokens quarterly
   - Update both server and clients simultaneously
   - Log all admin access attempts

3. **Audit Logging:**
   All failed authentication attempts are logged to `security_events`:
   ```sql
   SELECT * FROM security_events
   WHERE event_type IN ('admin_token_invalid', 'admin_signature_invalid')
   ORDER BY created_at DESC;
   ```

---

## Input Validation

### Validation Framework

All inputs are validated using Zod schemas (`src/lib/schemas.ts`):

```typescript
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(320, "Email too long")
  .transform((val) => val.trim().toLowerCase());

export const langSchema = z.enum(["en", "zh"], {
  message: "Invalid language",
});
```

### Validation Limits

| Input Type | Max Length | Validation |
|------------|------------|------------|
| Text input | 2000 | `validateTextLength()` |
| Email | 320 | `isValidEmail()` |
| Mode | 20 | Enum check |
| Caption | 1000 | Zod schema |
| Hashtags | 500 | Zod schema |
| Note | 500 | Zod schema |
| Image size | 10MB | `validateImageSize()` |
| Image type | - | MIME + magic byte check |

### Image Validation

Images are validated by both MIME type and magic bytes:

```typescript
// Allowed types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Magic byte verification
async function validateImageContent(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E &&
      bytes[3] === 0x47 && bytes[4] === 0x0D && bytes[5] === 0x0A &&
      bytes[6] === 0x1A && bytes[7] === 0x0A) {
    return true;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 &&
      bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }

  // WebP: RIFF....WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
      bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 &&
      bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }

  return false;
}
```

### Sanitization

All string inputs are sanitized:

```typescript
export function sanitizeString(input: string): string {
  return input
    .replace(/\0/g, "")                    // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")  // Remove control chars
    .trim();
}
```

---

## Security Monitoring

### Security Events Table

All security-related events are logged to `security_events`:

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  user_id UUID,
  ip TEXT,
  path TEXT,
  user_agent TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Event Types

| Event Type | Severity | Description |
|------------|----------|-------------|
| `rate_limited` | warn | Rate limit exceeded |
| `quota_exceeded` | warn | Daily quota exceeded |
| `high_load_reject` | warn | Server load too high |
| `model_invalid_response` | warn | OpenAI returned invalid format |
| `generate_error` | error | Generation failed |
| `admin_token_invalid` | warn | Invalid admin token |
| `admin_signature_invalid` | warn | Invalid admin signature |
| `csp_violation` | warn | CSP violation detected |

### Monitoring Queries

```sql
-- Recent security events by severity
SELECT
  event_type,
  severity,
  COUNT(*) as count,
  MAX(created_at) as last_seen
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY severity DESC, count DESC;

-- Rate limit violations by IP
SELECT
  ip,
  COUNT(*) as violations,
  MAX(created_at) as last_violation
FROM security_events
WHERE event_type = 'rate_limited'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip
ORDER BY violations DESC;

-- Admin access attempts
SELECT
  event_type,
  ip,
  user_agent,
  created_at
FROM security_events
WHERE event_type IN ('admin_token_invalid', 'admin_signature_invalid')
ORDER BY created_at DESC
LIMIT 50;
```

### Alerting Thresholds

Consider alerting on:

- More than 100 rate limit violations per hour from single IP
- More than 10 failed admin authentication attempts
- More than 50 CSP violations per hour
- Any circuit breaker opening (OpenAI failures)

---

## Incident Response

### Security Incident Categories

1. **DDoS Attack**
2. **Credential Compromise**
3. **Data Breach**
4. **Service Exploitation**

### Response Procedures

#### 1. DDoS Attack

**Indicators:**
- Sudden spike in traffic
- All requests from similar IP ranges
- High rate limit violations

**Response:**
```bash
# Enable Cloudflare Under Attack Mode
# Via dashboard or API

# Block attacking IPs
# Via Cloudflare WAF rules

# Increase rate limits temporarily
# Edit environment variables
RATE_LIMIT_GENERATE=100
```

#### 2. Credential Compromise

**Indicators:**
- Failed admin authentication attempts
- Successful admin access from unusual location
- Unexpected data exports

**Response:**
```sql
-- Revoke compromised tokens
-- 1. Rotate ADMIN_EXPORT_TOKEN
-- 2. Rotate ADMIN_SIGNING_SECRET

-- Audit admin access
SELECT * FROM security_events
WHERE event_type IN ('admin_token_invalid', 'admin_signature_invalid')
  AND created_at > NOW() - INTERVAL '7 days';

-- Check for unauthorized exports
SELECT * FROM security_events
WHERE path LIKE '%admin/export%'
  OR path LIKE '%admin/funnel%'
ORDER BY created_at DESC;
```

#### 3. Data Breach

**Indicators:**
- Unusual database access patterns
- Data exfiltration attempts
- Unexpected quota consumption

**Response:**
```bash
# 1. Enable maintenance mode
# 2. Rotate all secrets
# 3. Audit database access logs
# 4. Notify affected users
# 5. Document breach report
```

#### 4. Service Exploitation

**Indicators:**
- Bypassed rate limits
- Unexpected API usage patterns
- Validation bypass attempts

**Response:**
```bash
# 1. Review logs for exploit pattern
# 2. Patch vulnerability
# 3. Deploy hotfix
# 4. Monitor for recurrence
```

### Emergency Contacts

| Role | Contact |
|------|---------|
| Security Lead | security@litstatus.com |
| DevOps Lead | devops@litstatus.com |
| CTO | cto@litstatus.com |

---

## Security Best Practices

### Development

1. **Never commit secrets:**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use environment-specific configs:**
   ```bash
   .env.local       # Local development
   .env.production  # Production (never commit)
   ```

3. **Review security headers:**
   - Use securityheaders.com to scan
   - Aim for A+ rating

4. **Keep dependencies updated:**
   ```bash
   npm audit
   npm audit fix
   ```

### Production

1. **Enable all security headers**
2. **Use HTTPS only** (redirect HTTP to HTTPS)
3. **Implement CSP monitoring**
4. **Log all admin access**
5. **Regular security reviews** (quarterly)

### Access Control

1. **Principle of least privilege:**
   - Admin tokens only for admin users
   - Service role key only server-side
   - Anon key for client operations

2. **Token rotation schedule:**
   - Admin tokens: Quarterly
   - API keys: Bi-annual
   - Database credentials: Annual

---

## Compliance

### Data Privacy

1. **User Data:**
   - Email addresses stored only for wishlist
   - No personal data in logs
   - IP addresses for security only

2. **Cookie Policy:**
   - Essential cookies only (auth, language)
   - Analytics require consent
   - Clear cookie disclosure

3. **Data Retention:**
   - Security events: 90 days
   - Funnel events: 180 days
   - Feedback: Indefinite (anonymized)

### GDPR Considerations

- Users can request data export
- Users can request account deletion
- Cookie consent for analytics
- Data processing agreement with Supabase

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] CSP headers configured and tested
- [ ] Rate limits configured for all endpoints
- [ ] Input validation on all inputs
- [ ] Admin authentication configured
- [ ] Security events table created
- [ ] HTTPS enforced
- [ ] Security headers verified (securityheaders.com)

### Post-Deployment

- [ ] CSP violations monitored
- [ ] Rate limit violations reviewed
- [ ] Admin access audited
- [ ] Security events reviewed daily
- [ ] Dependencies scanned for vulnerabilities
- [ ] Backup and recovery tested
