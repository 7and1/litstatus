# LitStatus.com API Documentation

Complete API reference for LitStatus.com endpoints.

## Base URL

- **Production**: `https://litstatus.com`
- **Staging**: `https://litstatus.pages.dev`
- **Development**: `http://localhost:3000`

## Authentication

### Guest Access

- No authentication required
- Identified by IP address
- Subject to rate limiting and quota limits

### User Authentication

- Uses Supabase Authentication
- Bearer token in Authorization header
- Automatically included in requests from authenticated users

### Admin Authentication

- Token-based authentication for admin endpoints
- Pass token as query parameter: `?token=YOUR_TOKEN`
- Configure token via `ADMIN_EXPORT_TOKEN` environment variable

## Response Format

All API responses follow this structure:

### Success Response

```json
{
  "data": { ... },
  "quota": {
    "used": 5,
    "remaining": 15,
    "limit": 20,
    "reset_at": "2024-01-18T00:00:00Z",
    "isPro": false
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "quota": { ... }
}
```

## Security Headers

All API responses include the following security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Rate Limiting

Rate limits are enforced per IP address or user ID:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/generate` | 40 requests | 1 minute |
| `POST /api/wishlist` | 10 requests | 1 minute |
| `POST /api/feedback` | 20 requests | 1 minute |
| `GET /api/quota` | 60 requests | 1 minute |
| `POST /api/events` | 120 requests | 1 minute |
| Admin endpoints | 30 requests | 1 minute |

### Rate Limit Response Headers

When rate limits are enforced, the following headers are included:

```
X-RateLimit-Limit: 40
X-RateLimit-Remaining: 35
X-RateLimit-Reset: 1705545600
Retry-After: 10
```

## Endpoints

### 1. Generate Caption

Generate AI-powered captions and hashtags.

**Endpoint**: `POST /api/generate`

**Content-Type**: `multipart/form-data`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | No* | Input text to generate caption from (max 5000 chars) |
| `image` | File | No* | Image file for analysis (Pro only, max 5MB) |
| `mode` | string | No | Caption mode: "Standard", "Savage", "Rizz" (default: "Standard") |
| `lang` | string | No | Language: "en", "zh" (default: "en") |

*At least one of `text` or `image` must be provided.

#### Request Example (Text)

```bash
curl -X POST https://litstatus.com/api/generate \
  -F "text=Sunny day at the beach" \
  -F "mode=Standard" \
  -F "lang=en"
```

#### Request Example (Image - Pro Only)

```bash
curl -X POST https://litstatus.com/api/generate \
  -F "image=@/path/to/image.jpg" \
  -F "mode=Savage" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```json
{
  "caption": "Sunshine state of mind ☀️ Beach vibes only",
  "hashtags": "#beach #sunny #vibes #summertime",
  "detected_object": "beach scene",
  "affiliate_category": "fashion",
  "affiliate": {
    "name": "Brand Name",
    "url": "https://affiliate-link",
    "discount": "20% off"
  },
  "quota": {
    "used": 5,
    "remaining": 15,
    "limit": 20,
    "reset_at": "2024-01-18T00:00:00Z",
    "isPro": false
  },
  "cached": false
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `caption` | string | Generated caption text |
| `hashtags` | string | Generated hashtags |
| `detected_object` | string? | Detected object in image (vision mode only) |
| `affiliate_category` | string? | Category for affiliate recommendations |
| `affiliate` | object? | Affiliate recommendation details |
| `quota` | object | Current quota status |
| `cached` | boolean | Whether result was served from cache |

#### Affiliate Object

```typescript
{
  name: string;      // Brand name
  url: string;       // Affiliate link
  discount: string;  // Discount code or description
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Please enter text or upload an image."
}
```

**403 Forbidden**
```json
{
  "error": "Vision is available for Pro only.",
  "quota": { ... }
}
```

**429 Rate Limited**
```json
{
  "error": "Too many requests. Please retry."
}
```

**429 Quota Exceeded**
```json
{
  "error": "Daily quota reached.",
  "quota": {
    "used": 20,
    "remaining": 0,
    "limit": 20,
    "reset_at": "2024-01-18T00:00:00Z",
    "isPro": false
  }
}
```

#### Features

- **Caching**: Responses are cached based on input hash (default: 1 hour)
- **Circuit Breaker**: Automatic retry with exponential backoff
- **Inflight Limit**: Max concurrent requests (default: 25)

---

### 2. Get Quota Status

Get current quota status for the user.

**Endpoint**: `GET /api/quota`

#### Request Example

```bash
curl https://litstatus.com/api/quota
```

#### Response Example

```json
{
  "quota": {
    "used": 5,
    "remaining": 15,
    "limit": 20,
    "reset_at": "2024-01-18T00:00:00Z",
    "isPro": false
  }
}
```

#### Quota Fields

| Field | Type | Description |
|-------|------|-------------|
| `used` | number | Number of requests used today |
| `remaining` | number | Number of requests remaining |
| `limit` | number | Daily quota limit (20 for free, unlimited for Pro) |
| `reset_at` | string | ISO timestamp when quota resets |
| `isPro` | boolean | Whether user has Pro access |

#### Quota Rules

- **Guest**: 20 requests/day per IP address
- **User**: 20 requests/day per user
- **Pro**: Unlimited requests
- **Reset**: Daily at midnight UTC

---

### 3. Join Pro Wishlist

Join the waitlist for Pro features.

**Endpoint**: `POST /api/wishlist`

**Content-Type**: `application/json`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email address |
| `note` | string | No | Optional note or feedback |
| `variant` | string | No | A/B test variant |
| `lang` | string | No | Language: "en", "zh" |

#### Request Example

```bash
curl -X POST https://litstatus.com/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "note": "Excited for Pro features!",
    "variant": "a",
    "lang": "en"
  }'
```

#### Response Example

```json
{
  "ok": true
}
```

#### Email Notifications

If Resend is configured:
- Confirmation email sent to user
- Notification sent to admin (if `RESEND_NOTIFY_EMAIL` configured)

---

### 4. Submit Feedback

Submit feedback on generated content.

**Endpoint**: `POST /api/feedback`

**Content-Type**: `application/json`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rating` | number | Yes | Feedback rating: 1 (thumbs up) or -1 (thumbs down) |
| `mode` | string | No | Caption mode used |
| `caption` | string | No | Generated caption text |
| `hashtags` | string | No | Generated hashtags |
| `detected_object` | string | No | Detected object (vision mode) |
| `variant` | string | No | A/B test variant |
| `lang` | string | No | Language: "en", "zh" |

#### Request Example

```bash
curl -X POST https://litstatus.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 1,
    "mode": "Standard",
    "caption": "Amazing caption here",
    "hashtags": "#awesome #great",
    "lang": "en"
  }'
```

#### Response Example

```json
{
  "ok": true
}
```

---

### 5. Track Analytics Event

Track user analytics events.

**Endpoint**: `POST /api/events`

**Content-Type**: `application/json`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `event` | string | Yes | Event name (see valid events below) |
| `props` | object | No | Event properties |

#### Event Properties

| Property | Type | Description |
|----------|------|-------------|
| `session_id` | string | Session identifier |
| `source` | string | Traffic source (e.g., "google", "twitter") |
| `medium` | string | Traffic medium (e.g., "organic", "cpc") |
| `campaign` | string | Campaign name |
| `content` | string | Content identifier |
| `term` | string | Search term |
| `referrer` | string | Referrer URL |
| `current_path` | string | Current page path |
| `landing_path` | string | Landing page path |
| `lang` | string | Language: "en", "zh" |
| `variant` | string | A/B test variant |
| `mode` | string | Caption mode used |
| `has_image` | boolean | Whether image was used |

#### Valid Events

- `generate_success` - Caption generated successfully
- `copy_caption` - Caption copied to clipboard
- `copy_all` - All content copied
- `feedback_up` - Positive feedback submitted
- `feedback_down` - Negative feedback submitted
- `wish_submit` - Wishlist joined

#### Request Example

```bash
curl -X POST https://litstatus.com/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "generate_success",
    "props": {
      "session_id": "session-123",
      "source": "google",
      "medium": "organic",
      "current_path": "/",
      "lang": "en",
      "mode": "Standard",
      "has_image": false
    }
  }'
```

#### Response Example

```json
{
  "ok": true
}
```

---

### 6. Health Check

Check API health status.

**Endpoint**: `GET /api/health`

#### Request Example

```bash
curl https://litstatus.com/api/health
```

#### Response Example

```json
{
  "status": "ok",
  "timestamp": "2024-01-17T12:00:00Z"
}
```

---

## Admin Endpoints

### 7. Export Wishlist Data (Admin)

Export wishlist signup data (CSV format).

**Endpoint**: `GET /api/admin/wishlist/export`

**Authentication**: Query parameter `?token=YOUR_TOKEN`

#### Request Example

```bash
curl "https://litstatus.com/api/admin/wishlist/export?token=YOUR_ADMIN_TOKEN" \
  -o wishlist.csv
```

#### Response Format

CSV file with columns:
- `id`, `created_at`, `user_id`, `email`, `note`, `lang`, `variant`

---

### 8. Funnel Report (Admin)

Get funnel analytics data.

**Endpoint**: `GET /api/admin/funnel/report`

**Authentication**: Query parameter `?token=YOUR_TOKEN`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | string | No | Start date (ISO format) |
| `end` | string | No | End date (ISO format) |
| `lang` | string | No | Filter by language |
| `variant` | string | No | Filter by variant |

#### Request Example

```bash
curl "https://litstatus.com/api/admin/funnel/report?token=YOUR_ADMIN_TOKEN&start=2024-01-01&end=2024-01-31"
```

#### Response Example

```json
{
  "data": [
    {
      "event": "generate_success",
      "count": 1500,
      "unique_users": 800
    }
  ],
  "summary": {
    "total_events": 5000,
    "unique_users": 2000,
    "conversion_rate": 0.25
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid input parameters |
| `403` | Forbidden - Feature not available or unauthorized |
| `429` | Rate Limited - Too many requests or quota exceeded |
| `500` | Internal Server Error - Server error |
| `503` | Service Unavailable - High load or maintenance |

## Best Practices

### 1. Rate Limit Handling

Implement exponential backoff when receiving 429 responses:

```javascript
async function generateWithRetry(text, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = (retryAfter ? parseInt(retryAfter) : 10) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}
```

### 2. Quota Management

Always check quota before generating:

```javascript
// Check quota first
const quotaResponse = await fetch('/api/quota');
const { quota } = await quotaResponse.json();

if (quota.remaining === 0) {
  alert(`Quota reset at ${new Date(quota.reset_at).toLocaleString()}`);
  return;
}

// Proceed with generation
// ...
```

### 3. Error Handling

Handle all error states gracefully:

```javascript
try {
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (response.ok) {
    displayCaption(data.caption, data.hashtags);
  } else if (response.status === 403) {
    // Pro feature
    showUpgradePrompt(data.error);
  } else if (response.status === 429) {
    // Rate limited or quota exceeded
    showQuotaExceeded(data.quota);
  } else {
    // Other error
    showError(data.error);
  }
} catch (error) {
  showError('Network error. Please try again.');
}
```

### 4. Session Tracking

Track session data for analytics:

```javascript
// Generate session ID
const sessionId = crypto.randomUUID();

// Track events
async function trackEvent(eventName, props = {}) {
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      props: {
        session_id: sessionId,
        current_path: window.location.pathname,
        landing_path: sessionStorage.getItem('landing_path') || '/',
        lang: navigator.language.startsWith('zh') ? 'zh' : 'en',
        ...props
      }
    })
  });
}
```

---

## Testing

### Local Testing

```bash
# Health check
curl http://localhost:3000/api/health

# Generate caption
curl -X POST http://localhost:3000/api/generate \
  -F "text=Test caption" \
  -F "mode=Standard"

# Check quota
curl http://localhost:3000/api/quota
```

### Production Testing

```bash
# Health check
curl https://litstatus.com/api/health

# Generate caption
curl -X POST https://litstatus.com/api/generate \
  -F "text=Test caption" \
  -F "mode=Standard"

# Check quota
curl https://litstatus.com/api/quota
```

---

## Webhooks

Currently, LitStatus.com does not support webhooks. All responses are synchronous.

---

## Changelog

### Version 0.1.0 (2025-01-17)

- Initial API release
- Generate endpoint with text and image support
- Quota management
- Wishlist signup
- Feedback submission
- Analytics events
- Admin endpoints

---

## Support

For API issues or questions:
- Review this documentation
- Check troubleshooting guide in README.md
- Open GitHub issue with details

---

**Last Updated**: 2025-01-17
**API Version**: 0.1.0
