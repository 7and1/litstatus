# LitStatus API Reference

Production-ready API documentation for LitStatus.com. All endpoints use standard HTTP status codes and JSON response formats.

## Base URL

```
Production: https://litstatus.com
Development: http://localhost:3000
```

## Authentication

### Guest Access
- Identified by IP address
- Daily quota: 3 requests
- No authentication required

### User Authentication
- Uses Supabase Auth Bearer tokens
- Daily quota: 20 requests
- Include token in Authorization header:
  ```
  Authorization: Bearer <your-supabase-jwt-token>
  ```

### Pro Users
- Unlimited quota
- Access to Vision API (image input)
- Access to Savage and Rizz modes

### Admin Authentication
Admin endpoints use one of two methods:

1. **HMAC Signature (Preferred)**
   ```
   X-Signature: <hmac-sha256-signature>
   X-Timestamp: <unix-timestamp>
   ```
   Signature is computed as: `HMAC-SHA256(SECRET, timestamp + method + path)`

2. **Bearer Token (Legacy)**
   ```
   Authorization: Bearer <admin-export-token>
   ```

## Standard Headers

All API responses include:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-RateLimit-Limit: <limit>
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <unix-timestamp>
X-Request-ID: <unique-request-id>
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/generate | 40 | 60 seconds |
| GET /api/quota | 60 | 60 seconds |
| POST /api/wishlist | 10 | 60 seconds |
| POST /api/feedback | 20 | 60 seconds |
| POST /api/events | 120 | 60 seconds |
| GET /api/health | 30 | 60 seconds |
| Admin endpoints | 10 | 60 seconds |

---

## Endpoints

### 1. Generate Caption

**Endpoint:** `POST /api/generate`

**Runtime:** Edge

**Content-Type:** `multipart/form-data`

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| text | string | No* | Input text for caption generation | Max 2000 characters |
| image | File | No* | Image file for Vision API (Pro only) | Max 10MB, JPEG/PNG/WebP/GIF |
| mode | string | No | Caption generation mode | "Standard", "Savage", "Rizz" |
| lang | string | No | Response language | "en" or "zh" |

*At least one of `text` or `image` must be provided.

**Request Example (curl):**

```bash
# Text-only generation
curl -X POST https://litstatus.com/api/generate \
  -F "text=Just landed in Tokyo" \
  -F "mode=Standard" \
  -F "lang=en"

# With image (Pro only, requires auth)
curl -X POST https://litstatus.com/api/generate \
  -H "Authorization: Bearer <token>" \
  -F "text=My new outfit" \
  -F "image=@photo.jpg" \
  -F "mode=Rizz" \
  -F "lang=en"
```

**Success Response (200 OK):**

```json
{
  "caption": "Tokyo through the lens. Every corner is a frame waiting to happen. 🇯🇵📷",
  "hashtags": "#Tokyo #TravelJapan #StreetPhoto",
  "detected_object": "camera",
  "affiliate_category": "Camera lens filter kit",
  "affiliate": {
    "name": "Brand Name",
    "url": "https://affiliate-link",
    "discount": "20% off"
  },
  "quota": {
    "plan": "user",
    "limit": 20,
    "remaining": 19,
    "isPro": false
  },
  "cached": false
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation error
{
  "error": "Text too long."
}

// 403 Forbidden - Feature not available
{
  "error": "This mode is available for Pro only."
}

// 429 Too Many Requests - Rate limited or quota exceeded
{
  "error": "Daily quota reached.",
  "quota": {
    "plan": "guest",
    "limit": 3,
    "remaining": 0,
    "isPro": false
  }
}

// 500 Internal Server Error
{
  "error": "Service error. Please try again later."
}
```

---

### 2. Get Quota Status

**Endpoint:** `GET /api/quota`

**Runtime:** Edge

**Authentication:** Optional (returns guest quota if not authenticated)

**Request Example:**

```bash
# As guest
curl https://litstatus.com/api/quota

# As authenticated user
curl -H "Authorization: Bearer <token>" \
  https://litstatus.com/api/quota
```

**Success Response (200 OK):**

```json
{
  "quota": {
    "plan": "user",
    "limit": 20,
    "remaining": 15,
    "isPro": false
  }
}
```

**Pro User Response:**

```json
{
  "quota": {
    "plan": "pro",
    "limit": null,
    "remaining": null,
    "isPro": true
  }
}
```

---

### 3. Join Pro Wishlist

**Endpoint:** `POST /api/wishlist`

**Runtime:** Edge

**Content-Type:** `application/json`

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| email | string | Yes | User email address | Valid email, max 320 chars |
| note | string | No | Optional note | Max 500 characters |
| lang | string | No | User language preference | "en" or "zh" (default: "en") |
| variant | string | No | A/B test variant | Max 50 characters |

**Request Example:**

```bash
curl -X POST https://litstatus.com/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "note": "Interested in Pro features",
    "lang": "en"
  }'
```

**Success Response (200 OK):**

```json
{
  "ok": true
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid email
{
  "error": "Invalid email address"
}

// 429 Too Many Requests
{
  "error": "Too many requests"
}
```

---

### 4. Submit Feedback

**Endpoint:** `POST /api/feedback`

**Runtime:** Edge

**Content-Type:** `application/json`

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| rating | number | Yes | Feedback rating | 1 (up) or -1 (down) |
| mode | string | No | Generation mode used | Max 50 characters |
| caption | string | No | Generated caption | Max 1000 characters |
| hashtags | string | No | Generated hashtags | Max 500 characters |
| detected_object | string | No | Detected object | Max 200 characters |
| lang | string | No | Language | "en" or "zh" (default: "en") |
| variant | string | No | A/B test variant | Max 50 characters |

**Request Example:**

```bash
curl -X POST https://litstatus.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 1,
    "mode": "Standard",
    "caption": "Great caption here",
    "hashtags": "#tag1 #tag2",
    "lang": "en"
  }'
```

**Success Response (200 OK):**

```json
{
  "ok": true
}
```

---

### 5. Track Analytics Event

**Endpoint:** `POST /api/events`

**Runtime:** Edge

**Content-Type:** `application/json`

**Parameters:**

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| event | string | Yes | Event name | See valid events below |
| props | object | No | Event properties | See property schema below |

**Valid Events:**
- `generate_success` - Caption generation completed
- `copy_caption` - User copied caption only
- `copy_all` - User copied caption and hashtags
- `feedback_up` - User submitted positive feedback
- `feedback_down` - User submitted negative feedback
- `wish_submit` - User joined Pro wishlist

**Event Properties:**

| Property | Type | Max Length | Description |
|----------|------|------------|-------------|
| session_id | string | 120 | Unique session identifier |
| source | string | 120 | Traffic source (UTM) |
| medium | string | 120 | Traffic medium (UTM) |
| campaign | string | 120 | Campaign name (UTM) |
| content | string | 120 | Content identifier (UTM) |
| term | string | 120 | Search term (UTM) |
| referrer | string | 200 | Referrer URL |
| current_path | string | 200 | Current page path |
| landing_path | string | 200 | Landing page path |
| lang | string | 10 | Language code |
| variant | string | 80 | A/B test variant |
| mode | string | 20 | Generation mode |
| has_image | boolean | - | Whether image was used |

**Request Example:**

```bash
curl -X POST https://litstatus.com/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "generate_success",
    "props": {
      "session_id": "sess_12345",
      "source": "google",
      "medium": "organic",
      "current_path": "/",
      "lang": "en",
      "variant": "a",
      "mode": "Standard",
      "has_image": false
    }
  }'
```

**Success Response (200 OK):**

```json
{
  "ok": true
}
```

---

### 6. Health Check

**Endpoint:** `GET /api/health`

**Runtime:** Edge

**Authentication:** None

**Request Example:**

```bash
curl https://litstatus.com/api/health
```

**Success Response (200 OK - Healthy):**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "services": {
    "database": {
      "status": "ok",
      "latency": 45
    },
    "openai": {
      "status": "ok",
      "circuitBreaker": {
        "state": "closed",
        "failureCount": 0,
        "lastFailureTime": null
      }
    },
    "redis": {
      "status": "ok",
      "stats": {
        "enabled": true,
        "errorCount": 0
      }
    }
  },
  "performance": {
    "slowOperations": 0,
    "avgOpenaiLatency": 1250,
    "openaiSuccessRate": 0.98,
    "cacheStats": {
      "hits": 450,
      "misses": 120,
      "hitRate": 0.79
    }
  }
}
```

**Degraded Response (200 OK - Degraded):**

```json
{
  "status": "degraded",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "services": {
    "database": { "status": "ok", "latency": 450 },
    "openai": { "status": "degraded", "circuitBreaker": {...} },
    "redis": { "status": "ok", "stats": {...} }
  },
  "performance": {...}
}
```

**Unhealthy Response (503 Service Unavailable):**

```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "services": {
    "database": { "status": "error" },
    ...
  }
}
```

---

### 7. Export Pro Wishlist (Admin)

**Endpoint:** `GET /api/admin/wishlist/export`

**Runtime:** Node.js

**Authentication:** Required (Admin)

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | Yes* | Admin export token (query or header) |
| format | string | No | Response format: "json" or "csv" (default: "json") |

*Or use HMAC signature headers (preferred)

**Request Examples:**

```bash
# Using query token
curl "https://litstatus.com/api/admin/wishlist/export?token=YOUR_TOKEN&format=csv"

# Using Bearer header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://litstatus.com/api/admin/wishlist/export?format=csv"

# Using HMAC signature (preferred)
curl -H "X-Signature: <signature>" \
  -H "X-Timestamp: <timestamp>" \
  "https://litstatus.com/api/admin/wishlist/export?format=csv"
```

**CSV Response (200 OK):**

```
id,user_id,email,note,lang,variant,created_at
uuid-1,user-uuid@example.com,user@example.com,Optional note,en,a,2025-01-18T10:00:00.000Z
...
```

**Error Responses:**

```json
// 401 Unauthorized
{ "error": "Unauthorized" }

// 429 Too Many Requests
{ "error": "Too many requests" }

// 500 Internal Server Error
{ "error": "Export failed" }
```

---

### 8. Funnel Report (Admin)

**Endpoint:** `GET /api/admin/funnel/report`

**Runtime:** Node.js

**Authentication:** Required (Admin)

**Parameters:**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| token | string | Yes* | Admin export token (query or header) | - |
| format | string | No | Response format: "json" or "csv" | Default: "json" |
| days | number | No | Number of days to report | 1-180, default: 30 |
| source | string | No | Filter by traffic source | Max 120 chars |

*Or use HMAC signature headers (preferred)

**Request Example:**

```bash
curl "https://litstatus.com/api/admin/funnel/report?token=YOUR_TOKEN&days=7&format=json"
```

**JSON Response (200 OK):**

```json
{
  "summary": {
    "window_days": 7,
    "from": "2025-01-11T00:00:00.000Z",
    "to": "2025-01-18T00:00:00.000Z",
    "sessions": {
      "generate": 1250,
      "copy": 890,
      "feedback": 340,
      "wishlist": 120
    },
    "events": {
      "generate": 1250,
      "copy": 1450,
      "feedback": 340,
      "wishlist": 120
    },
    "rates": {
      "copy_rate": 71.2,
      "feedback_rate": 27.2,
      "wishlist_rate": 9.6
    }
  },
  "sources": [
    {
      "source": "google",
      "sessions": {
        "generate": 650,
        "copy": 480,
        "feedback": 180,
        "wishlist": 65
      },
      "events": {...},
      "rates": {
        "copy_rate": 73.85,
        "feedback_rate": 27.69,
        "wishlist_rate": 10
      }
    },
    {
      "source": "direct",
      ...
    }
  ]
}
```

**CSV Response:**

```
source,generate_sessions,copy_sessions,feedback_sessions,wishlist_sessions,copy_rate,feedback_rate,wishlist_rate
google,650,480,180,65,73.85,27.69,10.00
direct,400,280,90,35,70.00,22.50,8.75
...
```

---

### 9. CSP Violation Report

**Endpoint:** `POST /api/security/csp-report`

**Runtime:** Node.js

**Authentication:** None

**Description:** Receives Content Security Policy violation reports from browsers. Automatically logged to security_events table and optionally sent via email.

**Request:** Browser sends automatically when CSP violation occurs

**Response (200 OK):**

```json
{
  "ok": true
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_INPUT | Request validation failed |
| 401 | UNAUTHORIZED | Authentication required or failed |
| 403 | FORBIDDEN | Feature not available for current plan |
| 429 | RATE_LIMITED | Rate limit or quota exceeded |
| 500 | SERVICE_ERROR | Internal server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Webhook Events

LitStatus does not currently support outbound webhooks. Use the events endpoint for client-side analytics tracking.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Generate caption
const formData = new FormData();
formData.append('text', 'Just landed in Tokyo');
formData.append('mode', 'Standard');
formData.append('lang', 'en');

const response = await fetch('https://litstatus.com/api/generate', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log(data.caption);
console.log(data.hashtags);
```

### Python

```python
import requests

# Generate caption
response = requests.post(
    'https://litstatus.com/api/generate',
    files={'image': open('photo.jpg', 'rb')},
    data={
        'text': 'My new outfit',
        'mode': 'Rizz',
        'lang': 'en'
    },
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)

data = response.json()
print(data['caption'])
```

---

## Versioning

The API is currently at version 1.0.0. Breaking changes will be announced with advance notice.

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/7and1/litstatus/issues
- Email: support@litstatus.com
