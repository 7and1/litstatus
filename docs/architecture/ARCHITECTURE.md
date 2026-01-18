# LitStatus Architecture Documentation

System architecture overview for LitStatus.com production deployment.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Component Design](#component-design)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Design](#scalability-design)
8. [Technology Decisions](#technology-decisions)

---

## System Overview

LitStatus is an AI-powered caption generator built on Next.js 16 with Edge Runtime support. The system uses a serverless-first architecture optimized for global edge deployment while maintaining full Node.js compatibility for admin operations.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Browser (Web PWA)                          Mobile Web Apps     │
│  - Next.js 16 App Router                                       │
│  - React 19 Server Components                                  │
│  - Tailwind CSS 4                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Edge Runtime Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare Workers / Vercel Edge                              │
│  - /api/generate (AI caption generation)                       │
│  - /api/quota (Quota status)                                   │
│  - /api/wishlist (Pro signup)                                  │
│  - /api/feedback (User feedback)                               │
│  - /api/events (Analytics)                                     │
│  - /api/health (Health check)                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐  ┌──────────────┐  ┌─────────────┐
│   OpenAI API     │  │  Supabase    │  │   Redis     │
│  (GPT-4o-mini)   │  │  PostgreSQL  │  │  (Upstash)  │
│                  │  │  + Auth      │  │             │
└──────────────────┘  └──────────────┘  └─────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Runtime Layer                       │
├─────────────────────────────────────────────────────────────────┤
│  Docker / VPS (Admin Operations)                               │
│  - /api/admin/wishlist/export (CSV export)                     │
│  - /api/admin/funnel/report (Analytics report)                 │
│  - /api/security/csp-report (Security logging)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.2 | React framework with App Router |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| web-vitals | ^3.5.2 | Performance monitoring |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 16.1.2 | API endpoints |
| Edge Runtime | - | Serverless execution |
| Node.js Runtime | - | Admin operations |

### External Services

| Service | Purpose |
|---------|---------|
| Supabase | Database (PostgreSQL) + Auth |
| OpenAI | AI generation (GPT-4o-mini) |
| Upstash Redis | Rate limiting + caching |
| Resend | Email notifications |
| Cloudflare Pages | Edge deployment |
| Plausible/GA | Analytics |

### Development Tools

| Tool | Purpose |
|------|---------|
| Vitest | Unit testing |
| Playwright | E2E testing |
| ESLint | Linting |
| TypeScript | Type checking |
| Zod | Runtime validation |

---

## Architecture Diagrams

### Request Flow Diagram

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────▶│  Cloudflare │────▶│  Edge Route  │
│  Browser │     │    CDN      │     │   Handler    │
└──────────┘     └─────────────┘     └──────────────┘
                                             │
                     ┌───────────────────────┼───────────────────────┐
                     ▼                       ▼                       ▼
              ┌─────────────┐       ┌─────────────┐        ┌─────────────┐
              │   OpenAI    │       │  Supabase   │        │   Redis     │
              │     API     │       │  PostgreSQL │        │   Cache     │
              └─────────────┘       └─────────────┘        └─────────────┘
                     │                       │                       │
                     └───────────────────────┼───────────────────────┘
                                             ▼
                                    ┌──────────────┐
                                    │   Response   │
                                    │   Assembly   │
                                    └──────────────┘
```

### Component Architecture

```
litstatus.com/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── generate/             # Edge: Caption generation
│   │   │   ├── quota/                # Edge: Quota management
│   │   │   ├── wishlist/             # Edge: Pro signup
│   │   │   ├── feedback/             # Edge: User feedback
│   │   │   ├── events/               # Edge: Analytics
│   │   │   ├── health/               # Edge: Health check
│   │   │   ├── admin/                # Node.js: Admin endpoints
│   │   │   └── security/             # Node.js: Security logging
│   │   ├── (marketing)/              # Marketing pages
│   │   ├── login/                    # Authentication page
│   │   ├── og/                       # OG image generation
│   │   ├── zh/                       # Chinese localized pages
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/                   # React components
│   │   ├── ErrorBoundary.tsx         # Error boundary
│   │   ├── AsyncErrorBoundary.tsx    # Async error handling
│   │   ├── HomeClient.tsx            # Home page client logic
│   │   ├── LoginClient.tsx           # Login page client
│   │   ├── MarketingShell.tsx        # Marketing layout
│   │   └── ...                       # Other components
│   ├── lib/                          # Core libraries
│   │   ├── auth.ts                   # Authentication
│   │   ├── quota.ts                  # Quota management
│   │   ├── redis.ts                  # Redis client
│   │   ├── openai.ts                 # OpenAI integration
│   │   ├── security.ts               # Security utilities
│   │   ├── prompts.ts                # AI prompts
│   │   ├── i18n.ts                   # Internationalization
│   │   ├── validation.ts             # Input validation
│   │   ├── schemas.ts                # Zod schemas
│   │   ├── errors/                   # Error handling
│   │   │   ├── AppError.ts
│   │   │   ├── handlers.ts
│   │   │   ├── api.ts
│   │   │   └── ...
│   │   ├── cache.ts                  # Caching layer
│   │   ├── circuitBreaker.ts        # Circuit breaker
│   │   ├── performance.ts            # Performance monitoring
│   │   ├── securityEvents.ts         # Security logging
│   │   └── ...
│   └── hooks/                        # React hooks
├── supabase/
│   └── schema.sql                    # Database schema
├── public/                           # Static assets
└── docs/                             # Documentation
```

---

## Component Design

### 1. Caption Generation Flow

```
User Request
     │
     ▼
┌─────────────────┐
│  Input Validation│  - Check text length (max 2000)
│  & Rate Limiting │  - Check image size (max 10MB)
└─────────────────┘  - Rate limit: 40 req/min
     │
     ▼
┌─────────────────┐
│  Quota Check    │  - Guest: 3/day (IP-based)
│                 │  - User: 20/day (auth-based)
└─────────────────┘  - Pro: Unlimited
     │
     ▼
┌─────────────────┐
│  Cache Lookup   │  - Redis key: gen:{lang}:{mode}:{hash}
│                 │  - TTL: 1 hour (configurable)
└─────────────────┘
     │ (cache miss)
     ▼
┌─────────────────┐
│  OpenAI Request │  - GPT-4o-mini
│  with Retry     │  - Circuit breaker
└─────────────────┘  - Exponential backoff
     │
     ▼
┌─────────────────┐
│  Response Cache │  - Store in Redis
│  & Affiliate    │  - Add affiliate link if Pro
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Response       │  - Caption, hashtags
│  Assembly       │  - Detected object (if image)
└─────────────────┘  - Affiliate recommendation
```

### 2. Quota Management

```
┌─────────────────────────────────────────────────────────────┐
│                      Quota Status                           │
├─────────────────────────────────────────────────────────────┤
│  Guest:                                                     │
│    - Identifier: IP address or device fingerprint          │
│    - Storage: Redis (primary), in-memory (fallback)        │
│    - Limit: 3/day                                          │
│    - Reset: Midnight UTC                                   │
├─────────────────────────────────────────────────────────────┤
│  User:                                                      │
│    - Identifier: Supabase user ID                          │
│    - Storage: PostgreSQL profiles table                    │
│    - Limit: 20/day                                         │
│    - Reset: Daily usage count reset                        │
├─────────────────────────────────────────────────────────────┤
│  Pro:                                                       │
│    - Identifier: Supabase user ID with is_pro=true         │
│    - Storage: PostgreSQL profiles table                    │
│    - Limit: Unlimited                                      │
│    - Reset: N/A                                            │
└─────────────────────────────────────────────────────────────┘
```

### 3. Rate Limiting Architecture

```
┌─────────────────┐
│  Request Arrives│
└────────┬────────┘
         ▼
┌─────────────────┐
│  Identify       │  Priority:
│  Requester      │  1. User ID (if authenticated)
└────────┬────────┘  2. Device fingerprint
         │           3. IP address
         ▼
┌─────────────────┐
│  Check Redis    │  Key: ratelimit:{identifier}:{window}
│  Counter        │  Window: 60 seconds (sliding)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌──────┐  ┌──────────┐
│ Allow│  │  Deny    │
└──────┘  │ (429)    │
          └──────────┘
```

---

## Data Flow

### Caption Generation Data Flow

```
1. Client submits form (multipart/form-data)
   │
   ├─ text: "Just landed in Tokyo"
   ├─ mode: "Standard"
   ├─ lang: "en"
   └─ image: (optional File)

2. Edge route handler (POST /api/generate)
   │
   ├─ Parse FormData
   ├─ Validate inputs (Zod)
   ├─ Check rate limit (Redis)
   ├─ Get quota status (Redis/PostgreSQL)
   ├─ Consume quota (Redis/PostgreSQL)
   │
   ├─ Cache lookup (Redis)
   │  └─ Hit: Return cached response
   │  └─ Miss: Continue
   │
   ├─ Prepare OpenAI request
   │  ├─ System prompt (from prompts.ts)
   │  ├─ User prompt (text + image base64)
   │  └─ Response format: JSON
   │
   ├─ Call OpenAI API (with circuit breaker)
   │  └─ Retry on failure (exponential backoff)
   │
   ├─ Parse response (validate JSON schema)
   │
   ├─ Store in cache (Redis, TTL 1hr)
   │
   └─ Assemble response
      ├─ caption
      ├─ hashtags
      ├─ detected_object
      ├─ affiliate_category
      ├─ affiliate (if Pro)
      └─ quota (updated status)

3. Client receives JSON response
```

### Authentication Flow

```
1. User signs in (Supabase Auth)
   │
   ├─ Email/Password OR
   ├─ Google OAuth
   │
   ▼
2. Supabase returns JWT
   │
   ▼
3. Client stores token (cookies/localStorage)
   │
   ▼
4. Client includes token in API requests
   │
   └─ Authorization: Bearer <jwt-token>
       │
       ▼
5. API validates token (getUserFromRequest)
   │
   ├─ Extract token from Authorization header
   ├─ Call Supabase Auth API
   ├─ Validate and decode JWT
   │
   ▼
6. Request proceeds with user context
```

---

## Security Architecture

### Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                                  │
│  - Cloudflare DDoS protection                               │
│  - HTTPS only (TLS 1.3)                                     │
│  - CSP headers (strict)                                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Input Validation                                  │
│  - Zod schema validation                                    │
│  - Text length limits (max 2000)                            │
│  - Image validation (magic bytes)                           │
│  - Email format validation                                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Rate Limiting                                     │
│  - Per-IP rate limits (Redis)                               │
│  - Per-user rate limits (Redis)                             │
│  - Per-endpoint limits                                      │
│  - In-memory fallback                                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Authentication & Authorization                    │
│  - Supabase Auth (JWT)                                     │
│  - Row Level Security (PostgreSQL)                          │
│  - Admin endpoint authentication                            │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Audit Logging                                     │
│  - Security events table                                    │
│  - CSP violation reporting                                  │
│  - Request ID tracing                                       │
└─────────────────────────────────────────────────────────────┘
```

### Security Headers

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'nonce-{nonce}'..."
}
```

---

## Scalability Design

### Horizontal Scalability

The architecture supports horizontal scaling through:

1. **Edge Deployment:**
   - Cloudflare Workers automatically scale globally
   - No cold starts for frequently accessed routes
   - Geographic distribution reduces latency

2. **Stateless Design:**
   - Edge routes are stateless
   - Session data stored in Redis (shared across instances)
   - User state in PostgreSQL (centralized)

3. **Database Pooling:**
   - Supabase provides built-in connection pooling
   - Read replicas can be added for scaling reads

### Vertical Scaling Limits

| Component | Scaling Limit | Mitigation |
|-----------|---------------|------------|
| Edge Routes | Automatic (Cloudflare) | N/A |
| PostgreSQL | Up to Supabase Pro tier | Migrate to dedicated |
| Redis | Up to Upstash Pro tier | Add sharding |
| OpenAI API | 3500 RPM (Tier 3) | Implement queue |

---

## Technology Decisions

### Why Next.js 16 with App Router?

- **Server Components by Default:** Reduced client JavaScript
- **Edge Runtime Support:** Deploy API routes to edge
- **Streaming:** Progressive page rendering
- **Built-in Optimization:** Image optimization, font loading
- **Strong TypeScript Support:** Type safety across stack

### Why Supabase?

- **PostgreSQL:** Full-featured database with RLS
- **Built-in Auth:** OAuth and email/password
- **Real-time:** WebSocket support for future features
- **Edge Functions:** Deploy alongside application
- **Free Tier:** Generous limits for MVP

### Why OpenAI GPT-4o-mini?

- **Cost:** 10x cheaper than GPT-4
- **Speed:** Faster response times
- **Quality:** Sufficient for caption generation
- **Vision Support:** Image understanding

### Why Redis (Upstash)?

- **Rate Limiting:** Distributed counter across edge locations
- **Caching:** Reduce OpenAI API calls
- **Edge Compatible:** Upstash offers global edge Redis
- **Free Tier:** 10K requests/day

### Why Edge Runtime?

- **Global Distribution:** Deploy to 300+ locations
- **Cold Starts:** Minimal (V8 isolate)
- **Cost:** Pay per request, not per server
- **Performance:** Sub-100ms response times globally

---

## Performance Optimizations

1. **Response Caching:**
   - Redis cache for AI responses
   - Configurable TTL (default: 1 hour)
   - Cache key includes content hash

2. **Database Queries:**
   - Indexed columns (see schema.sql)
   - Prepared statements (Supabase)
   - Connection pooling

3. **Image Optimization:**
   - Next.js Image component
   - AVIF/WebP formats
   - Responsive sizes

4. **Code Splitting:**
   - Dynamic imports for admin routes
   - Separate bundles for client/server
   - Route-based splitting

---

## Monitoring & Observability

### Health Check Endpoint

`GET /api/health` returns:

- Overall status (healthy/degraded/unhealthy)
- Service status (database, OpenAI, Redis)
- Performance metrics (latency, success rate)
- Cache statistics

### Logging

- Request ID tracking
- Error logging (structured)
- Security event logging
- Performance monitoring

### Metrics Collection

- Response time percentiles
- Cache hit rate
- OpenAI success rate
- Rate limit violations

---

## Future Architecture Considerations

1. **Queue System:** For long-running AI tasks
2. **WebSocket:** Real-time caption generation updates
3. **Multi-region Database:** Reduce latency for non-US users
4. **CDN Cache:** Cache HTML at edge
5. **Feature Flags:** Launch dark new features
