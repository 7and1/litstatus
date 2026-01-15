# litstatus.com

LitStatus MVP (P2) — caption generator with quota control, Supabase auth, and Pro Vision + affiliate hooks.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase

- Run `supabase/schema.sql` in your Supabase SQL editor.
- Enable Email/Google auth providers.
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

## Quota

- Guest: IP-based (Upstash Redis, 24h TTL)
- Guest (alt): `REDIS_URL` to local Redis if Upstash not used
- User: `profiles.daily_usage_count` reset daily (20/day)
- Pro: unlimited + Vision + affiliate (wish list)

## API

- `POST /api/generate` (multipart/form-data)
  - `text` (optional)
  - `image` (optional, Pro only)
  - `mode` (Standard | Savage | Rizz)
- `GET /api/quota`
- `POST /api/wishlist`
- `POST /api/feedback`
- `GET /api/admin/wishlist/export?token=...`

## Analytics

Set one or both:

- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (+ optional `NEXT_PUBLIC_PLAUSIBLE_SRC`)
- `NEXT_PUBLIC_GA_ID`

## Docker (Prod)

- Build/run: `docker-compose up -d --build`
- Default port mapping: `3023 -> 3000`
