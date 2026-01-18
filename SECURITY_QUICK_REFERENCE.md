# Security Quick Reference

Quick guide for implementing security in LitStatus.com API routes.

---

## Basic API Route Security

```typescript
import { NextResponse } from "next/server";
import { initSecurityContext, applyRateLimit } from "@/lib/apiSecurity";
import { SECURITY_HEADERS } from "@/lib/security";
import { logSecurityEvent } from "@/lib/securityEvents";

export async function POST(request: Request) {
  // 1. Initialize security context
  const context = await initSecurityContext(request);
  
  // 2. Apply rate limiting
  const { allowed, headers } = await applyRateLimit(
    context,
    40,              // limit
    60 * 1000,       // window (1 minute)
    request
  );
  
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...SECURITY_HEADERS, ...headers } }
    );
  }
  
  // 3. Your business logic
  // ...
  
  // 4. Return response with security headers
  return NextResponse.json(
    { data: "success" },
    { headers: SECURITY_HEADERS }
  );
}
```

---

## Common Security Tasks

### Validate User Input

```typescript
import { sanitizeString, validateTextLength, LIMITS } from "@/lib/security";

const text = sanitizeString(body.text);
if (!validateTextLength(text, LIMITS.MAX_TEXT_LENGTH)) {
  return NextResponse.json(
    { error: "Text too long" },
    { status: 400, headers: SECURITY_HEADERS }
  );
}
```

### Validate Email

```typescript
import { isValidEmail } from "@/lib/security";

if (!isValidEmail(body.email)) {
  return NextResponse.json(
    { error: "Invalid email" },
    { status: 400, headers: SECURITY_HEADERS }
  );
}
```

### Validate Image Upload

```typescript
import { validateImageSize, validateImageContent } from "@/lib/security";

if (!validateImageSize(file)) {
  return NextResponse.json(
    { error: "File too large" },
    { status: 400, headers: SECURITY_HEADERS }
  );
}

if (!(await validateImageContent(file))) {
  await logSecurityEvent({
    event_type: "invalid_image_upload",
    severity: "warn",
    user_id: context.user?.id,
    ip: context.ip,
    path: "/api/upload",
    user_agent: request.headers.get("user-agent"),
    meta: { file_type: file.type }
  });
  
  return NextResponse.json(
    { error: "Invalid image" },
    { status: 400, headers: SECURITY_HEADERS }
  );
}
```

### Check Authentication

```typescript
import { getUserFromRequest } from "@/lib/auth";

const user = await getUserFromRequest(request);
if (!user) {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: SECURITY_HEADERS }
  );
}
```

### Use Device Fingerprint

```typescript
import { generateDeviceFingerprint } from "@/lib/security";

const fingerprint = generateDeviceFingerprint(request);

// Use for quota, rate limiting, etc.
const quotaKey = user?.id || fingerprint;
```

---

## Security Modules Quick Reference

### `/src/lib/security.ts`
Core security utilities
- `sanitizeString(input)` - Remove dangerous characters
- `validateTextLength(text, max)` - Check length
- `validateImageSize(file)` - Check file size
- `validateImageContent(file)` - Check magic bytes
- `isValidEmail(email)` - Validate email format
- `constantTimeEqual(a, b)` - Safe string comparison
- `generateDeviceFingerprint(request)` - Device ID
- `checkRateLimit(id, limit, window)` - Rate limiting
- `SECURITY_HEADERS` - Standard security headers

### `/src/lib/apiSecurity.ts`
API security middleware
- `initSecurityContext(request)` - Get user, IP, fingerprint
- `applyRateLimit(context, limit, window, request)` - Rate limiting
- `withSecurity(request, handler, options)` - Full security wrapper
- `RATE_LIMITS` - Predefined rate limit configs
- `securityErrorResponse(error, status)` - Standard error response

### `/src/lib/csrf.ts`
CSRF protection
- `generateCsrfToken()` - Create token
- `setCsrfCookie()` - Set cookie
- `getCsrfCookie()` - Get cookie value
- `validateCsrfToken(request)` - Validate token

### `/src/lib/database.ts`
Database security
- `validateTableName(name, allowed)` - Check table name
- `sanitizeColumnName(name)` - Clean column name
- `safeQuery(table, query)` - Execute safe query
- `ALLOWED_TABLES` - Whitelist of tables

### `/src/lib/securityEvents.ts`
Security logging
- `logSecurityEvent(event)` - Log security event

### `/src/lib/securityConfig.ts`
Security configuration
- `SECURITY_CONFIG` - All security settings
- `getSecuritySettings()` - Get env-specific settings
- `validateSecurityEnv()` - Check env vars

---

## Rate Limit Presets

```typescript
import { RATE_LIMITS } from "@/lib/apiSecurity";

RATE_LIMITS.generate    // 40/min - Content generation
RATE_LIMITS.events      // 120/min - Analytics events
RATE_LIMITS.wishlist    // 10/min - Wishlist signup
RATE_LIMITS.feedback    // 20/min - Feedback submission
RATE_LIMITS.quota       // 60/min - Quota checking
RATE_LIMITS.admin       // 30/min - Admin operations
```

---

## Security Headers

```typescript
import { SECURITY_HEADERS } from "@/lib/security";

// All responses should include these
return NextResponse.json(
  { data },
  { headers: SECURITY_HEADERS }
);

// Headers included:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Referrer-Policy: strict-origin-when-cross-origin
// - Permissions-Policy: geolocation=(), microphone=(), camera=()
// - Strict-Transport-Security: max-age=31536000; includeSubDomains
// - Content-Security-Policy: ...
```

---

## Common Patterns

### Protected Route (Auth + Rate Limit)

```typescript
export async function POST(request: Request) {
  const context = await initSecurityContext(request);
  
  if (!context.user) {
    return securityErrorResponse("Authentication required", 401);
  }
  
  const { allowed } = await applyRateLimit(context, 20, 60000, request);
  if (!allowed) return securityErrorResponse("Rate limited", 429);
  
  // Your logic
}
```

### Public Route (Rate Limit Only)

```typescript
export async function POST(request: Request) {
  const context = await initSecurityContext(request);
  
  const { allowed } = await applyRateLimit(context, 60, 60000, request);
  if (!allowed) return securityErrorResponse("Rate limited", 429);
  
  // Your logic
}
```

### Admin Route (Token + Rate Limit)

```typescript
import { constantTimeEqual } from "@/lib/security";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.ADMIN_EXPORT_TOKEN;
  
  if (!token || !constantTimeEqual(token, expected)) {
    return securityErrorResponse("Unauthorized", 401);
  }
  
  // Your logic
}
```

---

## Testing Security

```bash
# Test rate limiting
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/generate
done

# Test CSRF protection
curl -X POST http://localhost:3000/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Test image validation
echo "not an image" > fake.jpg
curl -X POST http://localhost:3000/api/generate \
  -F "image=@fake.jpg;type=image/jpeg"
```

---

## Environment Variables Checklist

```bash
# Required
UPSTASH_REDIS_REST_URL=          # Redis for rate limiting
UPSTASH_REDIS_REST_TOKEN=        # Redis auth
NEXT_PUBLIC_SUPABASE_URL=        # Database
SUPABASE_SERVICE_ROLE_KEY=       # Database admin
OPENAI_API_KEY=                  # OpenAI API

# Optional but recommended
ADMIN_EXPORT_TOKEN=              # Admin operations
NEXT_PUBLIC_SITE_URL=            # Site URL
NODE_ENV=production              # Environment
```

---

## Troubleshooting

### Rate limiting not working
1. Check Redis connection: `getRedisClient()` returns truthy?
2. Verify rate limit params are correct
3. Check logs for errors

### CSRF validation failing
1. Ensure cookie is set: `await setCsrfCookie()`
2. Check header is sent: `X-CSRF-Token`
3. Verify cookie attributes (httpOnly, sameSite)

### Image upload rejected
1. Check file size < 10MB
2. Verify MIME type in allowed list
3. Test magic bytes: `validateImageContent(file)`

### Security headers missing
1. Import: `import { SECURITY_HEADERS } from "@/lib/security"`
2. Apply: `{ headers: SECURITY_HEADERS }`
3. Check for header conflicts

---

## Further Reading

- `/SECURITY_README.md` - Detailed implementation guide
- `/SECURITY_AUDIT_REPORT.md` - Full audit findings
- `/SECURITY_SUMMARY.md` - Complete security overview
- `/src/lib/__tests__/security.test.ts` - Test examples
