# LitStatus.com

AI-powered caption generator with quota control, Supabase authentication, and Pro features including Vision API and affiliate recommendations.

## Features

### Core Functionality
- **AI Caption Generation**: Generate captions and hashtags using OpenAI GPT-4o-mini
- **Multiple Modes**: Standard, Savage, and Rizz caption styles
- **Vision API**: Image analysis and caption generation (Pro feature)
- **Multi-language**: English and Chinese support with URL-based routing
- **Quota Management**: Rate limiting for guests and authenticated users

### User Management
- **Guest Access**: IP-based quota (3 requests/day via Redis)
- **User Authentication**: Supabase auth (Email, Google)
- **Pro Features**: Unlimited quota, Vision API, affiliate recommendations
- **Wishlist**: Email capture for Pro launch notifications

### Security
- **Rate Limiting**: Redis-based distributed rate limiting with in-memory fallback
- **Input Validation**: Comprehensive sanitization and validation using Zod
- **CSRF Protection**: Token-based CSRF for state-changing operations
- **Security Headers**: HSTS, CSP, Permissions-Policy
- **Device Fingerprinting**: Abuse prevention for guest users
- **Audit Logging**: Security events tracked in database

## Tech Stack

- **Framework**: Next.js 16 (App Router, Edge Runtime compatible)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Cache**: Redis (Upstash or local)
- **AI**: OpenAI GPT-4o-mini
- **Auth**: Supabase Auth
- **Deployment**: Cloudflare Pages (primary), Docker (fallback)
- **Analytics**: Plausible, Google Analytics (optional)

## Quick Start

```bash
# Clone repository
git clone https://github.com/7and1/litstatus.git
cd litstatus.com

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/api/API_REFERENCE.md) | Complete API documentation with examples |
| [OpenAPI Spec](docs/api/OPENAPI_SPEC.md) | OpenAPI 3.0 specification |
| [Deployment Runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md) | Step-by-step deployment guide |
| [Architecture](docs/architecture/ARCHITECTURE.md) | System architecture and design decisions |
| [Security Guide](docs/security/SECURITY_GUIDE.md) | Security features and configuration |
| [i18n Guide](docs/i18n/I18N_GUIDE.md) | Internationalization documentation |
| [Development Guide](docs/development/DEVELOPMENT_GUIDE.md) | Local development and contributing |

## Environment Setup

### Required Environment Variables

Create `.env.local` with the following variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
# OR
REDIS_URL=redis://localhost:6379

# Admin
ADMIN_EXPORT_TOKEN=your-random-token
ADMIN_SIGNING_SECRET=your-signing-secret

# Optional: Email notifications (Resend)
RESEND_API_KEY=re-...
RESEND_FROM=noreply@yourdomain.com
RESEND_NOTIFY_EMAIL=admin@yourdomain.com

# Optional: Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=litstatus.com
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Cache settings
GEN_CACHE_TTL_SECONDS=3600
GEN_MAX_INFLIGHT=25
```

### Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and keys

2. **Run Database Schema**
   ```bash
   # In Supabase Dashboard > SQL Editor
   # Run the contents of supabase/schema.sql
   ```

3. **Enable Auth Providers**
   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google provider (optional)
   - Configure redirect URLs:
     - Allowed URLs: `http://localhost:3000`, `https://litstatus.com`

### Redis Setup

**Option A: Upstash (Recommended for production)**
1. Create account at https://upstash.com
2. Create Redis database
3. Copy REST URL and token
4. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

**Option B: Local Redis**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Set REDIS_URL=redis://localhost:6379
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Building
npm run build            # Production build
npm run build:production # Build with lint and type-check

# Testing & Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm test                 # Run tests (when configured)

# Analysis
npm run analyze          # Bundle analysis with ANALYZE=true next build

# Production
npm start                # Start production server
```

### Project Structure

```
litstatus.com/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── (marketing)/       # Marketing pages
│   │   ├── login/             # Login page
│   │   ├── og/                # OG image generation
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── lib/                   # Utilities and libraries
│   └── hooks/                 # React hooks
├── supabase/
│   └── schema.sql            # Database schema
├── public/                   # Static assets
├── docs/                     # Documentation
└── next.config.ts           # Next.js configuration
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **Imports**: Absolute imports with `@/` prefix
- **Components**: Server components by default
- **Error Handling**: Centralized error handling in `/lib/errors`

## API Documentation

### Authentication

Most endpoints use Supabase authentication:
- **Guest**: Identified by IP address
- **User**: Bearer token from `getUserFromRequest()`
- **Admin**: Token-based or HMAC signature authentication

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate AI caption |
| `/api/quota` | GET | Get quota status |
| `/api/wishlist` | POST | Join Pro wishlist |
| `/api/feedback` | POST | Submit feedback |
| `/api/events` | POST | Track analytics event |
| `/api/health` | GET | Health check |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/wishlist/export` | GET | Export wishlist (CSV) |
| `/api/admin/funnel/report` | GET | Funnel analytics report |

Full API documentation: [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md)

## Deployment

### Cloudflare Pages (Primary)

```bash
# Install Cloudflare adapter
npm install -D @cloudflare/next-on-pages

# Build for Cloudflare
npx @cloudflare/next-on-pages

# Deploy
npx wrangler pages deploy .vercel/output/static
```

### Docker Deployment

```bash
# Build image
docker build -t litstatus:latest .

# Run with docker-compose
docker-compose up -d
```

See [Deployment Runbook](docs/deployment/DEPLOYMENT_RUNBOOK.md) for detailed procedures.

## Security

### Security Features

- **Rate Limiting**: 40 req/min for generate endpoint
- **Input Validation**: All inputs sanitized and validated
- **Image Validation**: Magic byte verification, size limits
- **CSRF Protection**: Token-based CSRF for state-changing operations
- **Security Headers**: HSTS, CSP, XSS protection
- **Device Fingerprinting**: Track and prevent abuse
- **Database Security**: RLS policies, table whitelisting

### Security Best Practices

1. **Never Commit Secrets**:
   - `.env` files in `.gitignore`
   - Use GitHub Secrets for CI/CD
   - Rotate keys regularly

2. **Monitor Security Events**:
   - Check `security_events` table
   - Review rate limit hits
   - Monitor failed auth attempts

3. **Keep Dependencies Updated**:
   ```bash
   npm audit
   npm audit fix
   ```

See [Security Guide](docs/security/SECURITY_GUIDE.md) for comprehensive security documentation.

## Monitoring

### Health Check

```bash
curl https://litstatus.com/api/health
```

Response includes:
- Overall status (healthy/degraded/unhealthy)
- Service status (database, OpenAI, Redis)
- Performance metrics
- Cache statistics

### Key Metrics

- API response time
- Generation success rate
- Cache hit rate
- Error rate
- Active users

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unable to identify request" | Missing IP and auth | Check headers |
| "Daily quota reached" | User exceeded limit | Wait for reset or upgrade |
| "Rate limited" | Too many requests | Implement backoff |
| "Model returned invalid format" | OpenAI error | Check OpenAI status |
| Redis connection errors | Invalid URL/credentials | Verify Redis config |

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run linting and type-check: `npm run lint && npm run type-check`
4. Commit with conventional commits
5. Push and create pull request

See [Development Guide](docs/development/DEVELOPMENT_GUIDE.md) for detailed contribution guidelines.

## License

Proprietary - All rights reserved

## Support

- GitHub Issues: https://github.com/7and1/litstatus/issues
- Email: support@litstatus.com

---

**Version**: 1.0.0 (Production)
**Last Updated**: 2025-01-18
