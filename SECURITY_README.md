# Security Implementation Guide

This document outlines the security measures implemented in LitStatus.com and how to use them.

## Table of Contents
1. [Overview](#overview)
2. [Security Modules](#security-modules)
3. [API Security](#api-security)
4. [Rate Limiting](#rate-limiting)
5. [CSRF Protection](#csrf-protection)
6. [Database Security](#database-security)
7. [Input Validation](#input-validation)
8. [Testing](#testing)
9. [Configuration](#configuration)

---

## Overview

The application implements a defense-in-depth security strategy with multiple layers of protection:

- **Distributed Rate Limiting**: Redis-based with in-memory fallback
- **CSRF Protection**: Double-submit cookie pattern
- **Input Validation**: Comprehensive sanitization and type checking
- **Database Security**: Whitelist-based table/column validation
- **Device Fingerprinting**: Abuse prevention for guest users
- **Security Headers**: HSTS, CSP, Permissions-Policy

---

## Security Modules

### Core Security Library (`/src/lib/security.ts`)

Provides fundamental security utilities:

```typescript
import {
  sanitizeString,
  validateImageType,
  validateImageContent,
  constantTimeEqual,
  generateDeviceFingerprint,
  checkRateLimit,
  SECURITY_HEADERS,
} from "@/lib/security";
```

**Key Functions**:
- `sanitizeString(input: string)`: Remove null bytes and control characters
- `validateImageContent(file: File)`: Check magic bytes to prevent MIME spoofing
- `generateDeviceFingerprint(request: Request)`: Stable device identifier
- `checkRateLimit(identifier: string, limit: number, windowMs: number)`: Distributed rate limiting
- `constantTimeEqual(a: string, b: string)`: Timing-attack safe string comparison

---

## API Security

### Using the Security Middleware (`/src/lib/apiSecurity.ts`)

Centralized security for API routes:

```typescript
import { withSecurity, RATE_LIMITS } from "@/lib/apiSecurity";

export async function POST(request: Request) {
  return withSecurity(
    request,
    async (context) => {
      // Your handler logic
      // context.user, context.ip, context.fingerprint available
      return NextResponse.json({ success: true });
    },
    {
      rateLimit: "generate", // Use predefined rate limit
      requireAuth: false,    // Require authenticated user
    }
  );
}
```

**Predefined Rate Limits**:
- `generate`: 40 req/min
- `events`: 120 req/min
- `wishlist`: 10 req/min
- `feedback`: 20 req/min
- `quota`: 60 req/min
- `admin`: 30 req/min

### Manual Security Implementation

```typescript
import { initSecurityContext, applyRateLimit } from "@/lib/apiSecurity";

export async function POST(request: Request) {
  // Initialize security context
  const context = await initSecurityContext(request);

  // Apply rate limiting
  const { allowed, headers } = await applyRateLimit(
    context,
    40, // limit
    60 * 1000, // window
    request
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { ...SECURITY_HEADERS, ...headers } }
    );
  }

  // Your logic here
}
```

---

## Rate Limiting

### Redis-Based Distributed Rate Limiting

Rate limiting uses Redis for distributed coordination with in-memory fallback:

```typescript
const rate = await checkRateLimit(
  "user-123",        // identifier (user ID, IP, or fingerprint)
  100,               // max requests
  60 * 1000          // time window (ms)
);

if (!rate.allowed) {
  console.log(`Rate limited. Resets at: ${new Date(rate.resetAt)}`);
}
```

### Rate Limit Response Headers

```typescript
import { createRateLimitHeaders } from "@/lib/security";

return NextResponse.json(
  { data },
  { headers: { ...SECURITY_HEADERS, ...createRateLimitHeaders(rate) } }
);
```

Headers included:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## CSRF Protection

### Setting Up CSRF Protection

```typescript
import { setCsrfCookie, validateCsrfToken } from "@/lib/csrf";

// Server-side: Set CSRF cookie (typically on page load)
export async function GET(request: Request) {
  const token = await setCsrfCookie();
  return NextResponse.json({ csrfToken: token });
}

// Server-side: Validate CSRF token (for state-changing operations)
export async function POST(request: Request) {
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }
  // Process request
}
```

### Client-Side CSRF Token Usage

```typescript
// Fetch CSRF token from server
const response = await fetch("/api/csrf-token");
const { csrfToken } = await response.json();

// Include token in subsequent requests
fetch("/api/action", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": csrfToken,
  },
  body: JSON.stringify({ data }),
});
```

---

## Database Security

### Safe Query Execution (`/src/lib/database.ts`)

```typescript
import { validateTableName, sanitizeColumnName, ALLOWED_TABLES } from "@/lib/database";

// Validate table name
if (!validateTableName("profiles", ALLOWED_TABLES)) {
  throw new Error("Invalid table");
}

// Sanitize column name
const safeColumn = sanitizeColumnName(userInput); // Throws if invalid
```

### Allowed Tables Whitelist

```typescript
import { ALLOWED_TABLES } from "@/lib/database";

// These are the only tables that can be queried
console.log(ALLOWED_TABLES);
// ["profiles", "pro_wishlist", "feedback", "funnel_events", "security_events"]
```

---

## Input Validation

### Text Input

```typescript
import { validateTextLength, LIMITS } from "@/lib/security";

if (!validateTextLength(userInput, LIMITS.MAX_TEXT_LENGTH)) {
  return NextResponse.json(
    { error: "Text too long" },
    { status: 400 }
  );
}
```

### Email Validation

```typescript
import { isValidEmail } from "@/lib/security";

if (!isValidEmail(userEmail)) {
  return NextResponse.json(
    { error: "Invalid email" },
    { status: 400 }
  );
}
```

### Image Upload Validation

```typescript
import { validateImageSize, validateImageContent, validateImageType } from "@/lib/security";

// Validate file size
if (!validateImageSize(file)) {
  return NextResponse.json({ error: "File too large" }, { status: 400 });
}

// Validate MIME type
if (!validateImageType(file)) {
  return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
}

// Validate actual content (magic bytes)
if (!(await validateImageContent(file))) {
  return NextResponse.json({ error: "Invalid file content" }, { status: 400 });
}
```

---

## Testing

### Running Security Tests

```bash
# Run security test suite
npm test src/lib/__tests__/security.test.ts

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- sanitizeString
```

### Manual Security Testing

1. **Rate Limiting**:
```bash
# Send rapid requests to test rate limiting
for i in {1..50}; do curl -X POST https://your-api.com/api/generate; done
```

2. **CSRF Protection**:
```bash
# Test without CSRF token (should fail)
curl -X POST https://your-api.com/api/wishlist -d '{"email":"test@test.com"}'

# Test with CSRF token (should succeed)
CSRF_TOKEN=$(curl https://your-api.com/api/csrf-token | jq -r '.csrfToken')
curl -X POST https://your-api.com/api/wishlist \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -d '{"email":"test@test.com"}'
```

3. **Image Upload**:
```bash
# Test with spoofed MIME type
echo "not an image" > fake.jpg
curl -X POST https://your-api.com/api/generate \
  -F "image=@fake.jpg;type=image/jpeg"
# Should reject the file
```

---

## Configuration

### Environment Variables

Required for security features:

```bash
# Redis (for distributed rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Supabase (database & auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (API usage)
OPENAI_API_KEY=your-openai-key

# Admin (for protected endpoints)
ADMIN_EXPORT_TOKEN=your-admin-token

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://litstatus.com
NODE_ENV=production
```

### Security Configuration (`/src/lib/securityConfig.ts`)

Customize security settings:

```typescript
import { SECURITY_CONFIG } from "@/lib/securityConfig";

// Access settings
const maxFileSize = SECURITY_CONFIG.fileUpload.maxFileSize;
const allowedTypes = SECURITY_CONFIG.fileUpload.allowedImageTypes;
```

---

## Best Practices

### 1. Always Use Security Middleware

```typescript
// Good
export async function POST(request: Request) {
  return withSecurity(request, handler, { rateLimit: "generate" });
}

// Avoid
export async function POST(request: Request) {
  // No security middleware!
}
```

### 2. Validate All Inputs

```typescript
// Good
const sanitized = sanitizeString(userInput);
if (!validateTextLength(sanitized, LIMITS.MAX_TEXT_LENGTH)) {
  return error("Too long");
}

// Avoid
const text = userInput; // Untested!
```

### 3. Use Constant-Time Comparison for Secrets

```typescript
// Good
if (constantTimeEqual(providedToken, expectedToken)) {
  // Proceed
}

// Avoid
if (providedToken === expectedToken) {
  // Vulnerable to timing attacks
}
```

### 4. Log Security Events

```typescript
import { logSecurityEvent } from "@/lib/securityEvents";

await logSecurityEvent({
  event_type: "suspicious_activity",
  severity: "warn",
  user_id: user?.id,
  ip: ip,
  path: request.url,
  user_agent: request.headers.get("user-agent"),
  meta: { details },
});
```

### 5. Use Security Headers

```typescript
import { SECURITY_HEADERS } from "@/lib/security";

return NextResponse.json(
  { data },
  { headers: SECURITY_HEADERS }
);
```

---

## Troubleshooting

### Rate Limiting Not Working

1. Check Redis connection:
```bash
curl $UPSTASH_REDIS_REST_URL/ping
```

2. Verify Redis is being used:
```typescript
const redis = getRedisClient();
console.log("Redis available:", !!redis);
```

3. Check rate limit configuration in `SECURITY_CONFIG`

### CSRF Token Validation Failing

1. Ensure cookie is being set:
```typescript
const token = await setCsrfCookie();
console.log("CSRF token:", token);
```

2. Verify header is being sent:
```typescript
const token = request.headers.get("X-CSRF-Token");
console.log("Received token:", token);
```

3. Check SameSite cookie settings in browser dev tools

### Image Upload Rejected

1. Check file size against `LIMITS.MAX_IMAGE_SIZE_BYTES`
2. Verify MIME type in `ALLOWED_IMAGE_TYPES`
3. Test magic byte validation with `validateImageContent()`

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Upstash Redis Security](https://upstash.com/docs/redis/security)

---

## Support

For security concerns or questions, please open an issue or contact the development team.
