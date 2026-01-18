# LitStatus.com Quick Reference

Quick reference guide for common tasks and commands.

## Development Commands

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start development server
npm run dev
```

### Quality Checks

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check

# Run tests
npm test

# Build for production
npm run build

# Build with checks
npm run build:production
```

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to GitHub
git push origin feature/your-feature

# Create pull request via GitHub
```

## API Endpoints

### Public Endpoints

```bash
# Generate caption
curl -X POST https://litstatus.com/api/generate \
  -F "text=Your text here" \
  -F "mode=Standard"

# Check quota
curl https://litstatus.com/api/quota

# Health check
curl https://litstatus.com/api/health

# Submit feedback
curl -X POST https://litstatus.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"rating": 1, "caption": "..."}'

# Join wishlist
curl -X POST https://litstatus.com/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Track event
curl -X POST https://litstatus.com/api/events \
  -H "Content-Type: application/json" \
  -d '{"event": "generate_success"}'
```

### Admin Endpoints

```bash
# Export wishlist data
curl "https://litstatus.com/api/admin/wishlist/export?token=YOUR_TOKEN" \
  -o wishlist.csv

# Get funnel report
curl "https://litstatus.com/api/admin/funnel/report?token=YOUR_TOKEN"
```

## Database Queries

### Check User Quota

```sql
SELECT
  id,
  daily_usage_count,
  is_pro,
  updated_at
FROM litstatus.profiles
WHERE id = 'user-id-here';
```

### Reset User Quota

```sql
UPDATE litstatus.profiles
SET daily_usage_count = 0,
    updated_at = NOW()
WHERE id = 'user-id-here';
```

### Get Recent Security Events

```sql
SELECT
  event_type,
  severity,
  ip,
  user_id,
  created_at
FROM litstatus.security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;
```

### Get Funnel Analytics

```sql
SELECT
  event,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM litstatus.funnel_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event
ORDER BY count DESC;
```

### Get Wishlist Signups

```sql
SELECT
  email,
  lang,
  created_at
FROM litstatus.pro_wishlist
ORDER BY created_at DESC
LIMIT 100;
```

## Deployment Commands

### Deploy to VPS

```bash
# Deploy to VPS only
./deploy.sh vps

# Deploy without tests
./deploy.sh vps --skip-tests

# Force deploy (ignore warnings)
./deploy.sh vps --force
```

### Deploy to Cloudflare

```bash
# Deploy to Cloudflare only
./deploy.sh cloudflare

# Deploy to both
./deploy.sh both

# Show help
./deploy.sh --help
```

### VPS Management

```bash
# SSH into VPS
ssh root@107.174.42.198

# View container logs
ssh root@107.174.42.198 'docker logs -f litstatus-web'

# View container stats
ssh root@107.174.42.198 'docker stats litstatus-web'

# Restart container
ssh root@107.174.42.198 'docker restart litstatus-web'

# Stop container
ssh root@107.174.42.198 'docker stop litstatus-web'

# Start container
ssh root@107.174.42.198 'docker start litstatus-web'
```

## Docker Commands

### Local Development

```bash
# Build and start containers
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f litstatus-web

# Execute command in container
docker-compose exec litstatus-web sh
```

### Container Management

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# View container logs
docker logs -f litstatus-web

# View container stats
docker stats litstatus-web

# Inspect container
docker inspect litstatus-web

# Remove container
docker rm litstatus-web

# Remove image
docker rmi litstatus-litstatus-web
```

## Redis Commands

### Check Redis Connection

```bash
# Via Upstash REST API
curl $UPSTASH_REDIS_REST_URL/ping

# Via local Redis
redis-cli ping
```

### View Redis Keys

```bash
# Via Upstash Console
# Visit: https://app.upstash.com/

# Via local Redis
redis-cli KEYS "*"
```

### Clear Rate Limits

```bash
# Via Upstash Console
# Delete keys matching "rate-limit:*"

# Via local Redis
redis-cli --scan --pattern "rate-limit:*" | xargs redis-cli DEL
```

### View Quota Data

```bash
# Via local Redis
redis-cli GET "quota:127.0.0.1"
```

## Git Commands

### Common Operations

```bash
# Check status
git status

# View changes
git diff

# View commit history
git log --oneline -10

# Create branch
git checkout -b feature/your-feature

# Switch branch
git checkout main

# Merge branch
git merge feature/your-feature

# Delete branch
git branch -d feature/your-feature
```

### Undo Changes

```bash
# Unstage file
git reset HEAD file.txt

# Discard local changes
git checkout -- file.txt

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit
git revert <commit-hash>
```

## Environment Variables

### Required

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Optional

```bash
# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email (Resend)
RESEND_API_KEY=re-...
RESEND_FROM=noreply@yourdomain.com
RESEND_NOTIFY_EMAIL=admin@yourdomain.com

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=litstatus.com
NEXT_PUBLIC_GA_ID=G-...

# Admin
ADMIN_EXPORT_TOKEN=...

# Cache
GEN_CACHE_TTL_SECONDS=3600
GEN_MAX_INFLIGHT=25
```

## Monitoring

### Health Checks

```bash
# API health
curl https://litstatus.com/api/health

# Check quota endpoint
curl https://litstatus.com/api/quota

# Test generate endpoint
curl -X POST https://litstatus.com/api/generate \
  -F "text=test" \
  -F "mode=Standard"
```

### Log Monitoring

```bash
# View Docker logs
ssh root@107.174.42.198 'docker logs -f litstatus-web'

# View last 100 lines
ssh root@107.174.42.198 'docker logs --tail 100 litstatus-web'

# View logs with timestamps
ssh root@107.174.42.198 'docker logs -t litstatus-web'

# Export logs
ssh root@107.174.42.198 'docker logs litstatus-web' > app.log
```

### Database Monitoring

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'litstatus'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Troubleshooting

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules
npm install

# Rebuild
npm run build
```

### Docker Issues

```bash
# Rebuild container
docker-compose up -d --build --force-recreate

# Remove all containers
docker-compose down -v

# Remove Docker volumes
docker volume rm litstatus_com_node_modules
```

### Database Issues

```bash
# Check Supabase status
curl https://status.supabase.com/api/v2/status.json

# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# In Supabase Dashboard > Database > Metrics
```

### Redis Issues

```bash
# Test Upstash connection
curl $UPSTASH_REDIS_REST_URL/ping

# Test local Redis
redis-cli ping

# Check Redis info
redis-cli INFO
```

## File Paths

### Important Files

```
/Volumes/SSD/dev/new/litstatus.com/
├── README.md                    # Project overview
├── deploy.sh                    # Deployment script
├── docker-compose.yml           # Docker configuration
├── package.json                 # Dependencies
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
├── .env.local                  # Environment variables (local)
├── .env.example                # Environment template
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── DEVELOPER_GUIDE.md      # Developer guide
│   ├── OPERATIONS_GUIDE.md     # Operations guide
│   ├── CONTRIBUTING.md         # Contributing guide
│   └── QUICK_REFERENCE.md      # This file
├── src/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   └── lib/                    # Utilities
└── supabase/
    └── schema.sql              # Database schema
```

### Config Files

```bash
# ESLint config
eslint.config.mjs

# Tailwind config
postcss.config.mjs
tailwind.config.ts

# TypeScript config
tsconfig.json

# Next.js config
next.config.ts

# GitHub Actions
.github/workflows/deploy-cloudflare.yml
```

## Useful Links

### Documentation

- [README.md](/README.md) - Project overview
- [docs/API.md](/docs/API.md) - API documentation
- [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md) - Developer guide
- [docs/OPERATIONS_GUIDE.md](/docs/OPERATIONS_GUIDE.md) - Operations guide
- [docs/CONTRIBUTING.md](/docs/CONTRIBUTING.md) - Contributing guide
- [SECURITY_README.md](/SECURITY_README.md) - Security documentation

### External Services

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Upstash Console](https://app.upstash.com/)
- [OpenAI Dashboard](https://platform.openai.com/)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
- [GitHub Repository](https://github.com/7and1/litstatus)

### Status Pages

- [Cloudflare Status](https://www.cloudflarestatus.com/)
- [Supabase Status](https://status.supabase.com/)
- [OpenAI Status](https://status.openai.com/)

## Keyboard Shortcuts

### VS Code

```
Cmd/Ctrl + P    - Quick file open
Cmd/Ctrl + `    - Toggle terminal
Cmd/Ctrl + B    - Toggle sidebar
Cmd/Ctrl + D    - Select word
Cmd/Ctrl + /    - Toggle comment
Cmd/Ctrl + S    - Save file
Cmd/Ctrl + Shift + F - Find in files
```

### Terminal

```
Ctrl + C        - Cancel command
Ctrl + D        - Exit shell
Ctrl + L        - Clear screen
Ctrl + A        - Beginning of line
Ctrl + E        - End of line
Ctrl + R        - Search history
!!              - Last command
!*              - Last command arguments
```

### Git (in terminal)

```
git st          - git status
git co          - git checkout
git br          - git branch
git ci          - git commit
git unstage     - git reset HEAD
git last        - git log -1 HEAD
```

## Code Snippets

### API Route Template

```typescript
// src/app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Your logic here

    return NextResponse.json(
      { data: result },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
```

### React Component Template

```typescript
'use client';

import { useState } from 'react';

interface ComponentProps {
  title: string;
}

export function MyComponent({ title }: ComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

### Database Query Template

```typescript
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function getUserData(userId: string) {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}
```

---

**Last Updated**: 2025-01-17

For detailed documentation, see:
- [README.md](/README.md) - Getting started
- [docs/API.md](/docs/API.md) - API reference
- [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md) - Development guide
- [docs/OPERATIONS_GUIDE.md](/docs/OPERATIONS_GUIDE.md) - Operations guide
