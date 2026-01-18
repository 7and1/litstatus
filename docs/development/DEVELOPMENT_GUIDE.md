# LitStatus Development Guide

Comprehensive guide for setting up a development environment and contributing to LitStatus.com.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Testing Guide](#testing-guide)
6. [Common Tasks](#common-tasks)
7. [Debugging](#debugging)

---

## Quick Start

### Prerequisites

- **Node.js:** 20.x or later
- **npm:** 10.x or later
- **Git:** Latest version

### Clone and Install

```bash
# Clone repository
git clone https://github.com/7and1/litstatus.git
cd litstatus.com

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### Development Server

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

---

## Development Setup

### Environment Variables

Create `.env.local` in the project root:

```bash
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional (but recommended for development)
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Optional (for admin features)
ADMIN_EXPORT_TOKEN=dev-token
ADMIN_SIGNING_SECRET=dev-signing-secret

# Optional (for email testing)
RESEND_API_KEY=re-...
RESEND_FROM=noreply@localhost
RESEND_NOTIFY_EMAIL=admin@localhost

# Optional (for analytics)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=localhost
NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js
```

### Supabase Setup

1. **Create Project:**
   - Go to https://supabase.com
   - Create new project
   - Save URL and keys

2. **Run Schema:**
   ```bash
   # In Supabase Dashboard > SQL Editor
   # Run contents of supabase/schema.sql
   ```

3. **Configure Auth:**
   - Go to Authentication > Providers
   - Enable Email provider
   - Enable Google (optional)
   - Add redirect URL: `http://localhost:3000`

### Redis Setup (Optional)

**Option A: Upstash (Recommended)**
1. Create account at https://upstash.com
2. Create Redis database
3. Copy REST URL and token
4. Add to `.env.local`

**Option B: Local Redis**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Set in .env.local
REDIS_URL=redis://localhost:6379
```

---

## Project Structure

```
litstatus.com/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── generate/             # POST - Generate captions
│   │   │   ├── quota/                # GET - Quota status
│   │   │   ├── wishlist/             # POST - Pro signup
│   │   │   ├── feedback/             # POST - User feedback
│   │   │   ├── events/               # POST - Analytics events
│   │   │   ├── health/               # GET - Health check
│   │   │   ├── admin/                # Admin endpoints
│   │   │   │   ├── wishlist/         # GET - Export wishlist
│   │   │   │   └── funnel/           # GET - Funnel report
│   │   │   └── security/             # POST - CSP reports
│   │   ├── (marketing)/              # Marketing pages group
│   │   │   ├── page.tsx              # Features page
│   │   │   └── layout.tsx            # Marketing layout
│   │   ├── case-studies/             # Case study pages
│   │   ├── use-cases/                # Use case pages
│   │   ├── pricing/                  # Pricing page
│   │   ├── faq/                      # FAQ page
│   │   ├── examples/                 # Examples page
│   │   ├── login/                    # Login page
│   │   ├── og/                       # OG image generation
│   │   ├── zh/                       # Chinese localized pages
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Home page
│   │   └── sitemap.ts                # Dynamic sitemap
│   ├── components/                   # React components
│   │   ├── ErrorBoundary.tsx         # Error boundary
│   │   ├── AsyncErrorBoundary.tsx    # Async error handling
│   │   ├── HomeClient.tsx            # Home page client logic
│   │   ├── LoginClient.tsx           # Login page client
│   │   ├── MarketingShell.tsx        # Marketing layout wrapper
│   │   ├── Toast.tsx                 # Toast notifications
│   │   ├── CaseStudyDetail.tsx       # Case study display
│   │   └── UseCaseDetail.tsx         # Use case display
│   ├── lib/                          # Core libraries
│   │   ├── auth.ts                   # Authentication helpers
│   │   ├── quota.ts                  # Quota management
│   │   ├── redis.ts                  # Redis client
│   │   ├── openai.ts                 # OpenAI integration
│   │   ├── security.ts               # Security utilities
│   │   ├── prompts.ts                # AI prompts
│   │   ├── i18n.ts                   # i18n client utilities
│   │   ├── i18n.server.ts            # i18n server utilities
│   │   ├── schemas.ts                # Zod validation schemas
│   │   ├── validation.ts             # Validation helpers
│   │   ├── constants.ts              # App constants
│   │   ├── content.ts                # Static content
│   │   ├── affiliateMap.ts           # Affiliate links
│   │   ├── useCases.ts               # Use cases data
│   │   ├── attribution.ts            # Attribution tracking
│   │   ├── analytics.ts              # Analytics helpers
│   │   ├── seo.ts                    # SEO utilities
│   │   ├── types.ts                  # TypeScript types
│   │   ├── ip.ts                     # IP extraction
│   │   ├── langCookie.ts             # Language cookie
│   │   ├── requestContext.ts         # Request context
│   │   ├── requestSigning.ts         # HMAC signing
│   │   ├── supabaseAdmin.ts          # Supabase admin client
│   │   ├── supabaseBrowser.ts        # Supabase browser client
│   │   ├── errors/                   # Error handling module
│   │   │   ├── AppError.ts           # Custom error class
│   │   │   ├── handlers.ts           # Error handlers
│   │   │   ├── api.ts                # API error utilities
│   │   │   ├── apiMiddleware.ts      # Error middleware
│   │   │   ├── retry.ts              # Retry logic
│   │   │   ├── fallbacks.ts          # Fallback strategies
│   │   │   ├── logger.ts             # Logging utilities
│   │   │   ├── globalHandlers.ts     # Global error handlers
│   │   │   └── index.ts              # Error module exports
│   │   ├── cache.ts                  # Caching layer
│   │   ├── circuitBreaker.ts         # Circuit breaker
│   │   ├── performance.ts            # Performance monitoring
│   │   ├── securityEvents.ts         # Security event logging
│   │   ├── securityConfig.ts         # Security configuration
│   │   ├── apiSecurity.ts            # API security utilities
│   │   ├── csrf.ts                   # CSRF protection
│   │   ├── database.ts               # Database utilities
│   │   ├── dbPool.ts                 # Database pool
│   │   ├── ab.ts                     # A/B testing
│   │   └── JsonLd.ts                 # JSON-LD structured data
│   ├── hooks/                        # React hooks
│   │   ├── useQuota.ts               # Quota hook
│   │   └── useToast.ts               # Toast hook
│   ├── styles/                       # Additional styles (if any)
│   └── middleware.ts                 # Next.js middleware (removed)
├── supabase/
│   └── schema.sql                    # Database schema
├── public/                           # Static assets
│   ├── icons/                        # Favicon and icons
│   ├── .well-known/                  # Well-known URIs
│   ├── ads.txt                       # Ads.txt
│   ├── robots.txt                    # Robots.txt
│   └── sitemap-index.xml             # Sitemap index
├── docs/                             # Documentation
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   ├── security/                     # Security documentation
│   ├── architecture/                 # Architecture docs
│   ├── i18n/                         # i18n guide
│   └── development/                  # Development docs
├── .github/                          # GitHub configurations
│   └── workflows/                    # CI/CD workflows
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── README.md                         # Project readme
└── deploy.sh                         # Deployment script
```

---

## Coding Standards

### TypeScript

**Strict Mode Enabled:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

**Type Guidelines:**
- Always define types for exports
- Use `type` for simple types, `interface` for objects
- Avoid `any` - use `unknown` for truly dynamic data
- Use const assertions for literals: `as const`

**Example:**
```typescript
// Good - Explicit types
export interface QuotaStatus {
  plan: "guest" | "user" | "pro";
  limit: number | null;
  remaining: number | null;
  isPro: boolean;
}

// Good - Const assertion
const MODES = ["Standard", "Savage", "Rizz"] as const;
export type Mode = typeof MODES[number];

// Bad - Implicit any
function process(data) { /* ... */ }

// Good - Explicit unknown
function process(data: unknown) {
  if (typeof data === "string") { /* ... */ }
}
```

### ESLint

**Configuration:** Next.js recommended config

**Common Rules:**
- Use `const` over `let` when possible
- Prefer template literals over string concatenation
- Use async/await over promise chains
- Destructure objects and arrays

**Auto-fix:**
```bash
npm run lint:fix
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ErrorBoundary.tsx` |
| Utilities | camelCase | `security.ts` |
| Hooks | camelCase with `use` prefix | `useQuota.ts` |
| Types | camelCase | `types.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_TEXT_LENGTH` |
| API Routes | lowercase | `generate/route.ts` |

### Code Organization

**Export Order:**
1. Types
2. Constants
3. Helper functions
4. Main functions
5. Default exports

**Example:**
```typescript
// 1. Types
export interface User { /* ... */ }
export type AuthResult = /* ... */;

// 2. Constants
const MAX_RETRIES = 3;

// 3. Helper functions
function normalizeInput(input: string): string { /* ... */ }

// 4. Main functions
export async function authenticateUser(
  request: Request
): Promise<AuthResult> { /* ... */ }
```

---

## Testing Guide

### Test Structure

```
src/__tests__/
├── unit/              # Unit tests
│   ├── lib/
│   │   ├── security.test.ts
│   │   ├── i18n.test.ts
│   │   └── quota.test.ts
│   └── utils/
├── integration/       # Integration tests
│   └── api/
│       ├── generate.test.ts
│       └── quota.test.ts
└── e2e/              # E2E tests (Playwright)
    ├── generate.spec.ts
    └── auth.spec.ts
```

### Running Tests

```bash
# All tests
npm test

# Unit tests with coverage
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Writing Unit Tests

```typescript
// src/__tests__/unit/lib/i18n.test.ts
import { describe, it, expect } from "vitest";
import { normalizeLang, detectLangFromHeader } from "@/lib/i18n";

describe("normalizeLang", () => {
  it("should normalize zh-CN to zh", () => {
    expect(normalizeLang("zh-CN")).toBe("zh");
  });

  it("should default to en for unsupported languages", () => {
    expect(normalizeLang("fr")).toBe("en");
  });
});

describe("detectLangFromHeader", () => {
  it("should detect Chinese from Accept-Language", () => {
    expect(detectLangFromHeader("zh-CN,zh;q=0.9,en;q=0.8")).toBe("zh");
  });

  it("should default to English", () => {
    expect(detectLangFromHeader("fr-FR,fr;q=0.9")).toBe("en");
  });
});
```

### Writing E2E Tests

```typescript
// src/__tests__/e2e/generate.spec.ts
import { test, expect } from "@playwright/test";

test("can generate caption", async ({ page }) => {
  await page.goto("/");
  await page.fill('textarea[name="text"]', "Just landed in Tokyo");
  await page.click('button[type="submit"]');

  // Wait for response
  await expect(page.locator("#caption")).toHaveText(/./);
  await expect(page.locator("#hashtags")).toHaveText(/#/);
});
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route file:**
   ```bash
   # src/app/api/my-endpoint/route.ts
   ```

2. **Implement handler:**
   ```typescript
   import { NextResponse } from "next/server";
   import { getSecurityHeaders } from "@/lib/security";
   import { generateRequestId, createResponseHeaders } from "@/lib/requestContext";

   export const runtime = "edge";

   export async function POST(request: Request) {
     const requestId = generateRequestId();
     const securityHeaders = getSecurityHeaders();

     try {
       // Your logic here
       const data = { result: "success" };

       return NextResponse.json(data, {
         headers: createResponseHeaders(requestId, securityHeaders)
       });
     } catch (error) {
       return NextResponse.json(
         { error: "Internal error" },
         { status: 500, headers: createResponseHeaders(requestId, securityHeaders) }
       );
     }
   }
   ```

3. **Add validation (if needed):**
   ```typescript
   import { validateJsonBody } from "@/lib/schemas";
   import { z } from "zod";

   const schema = z.object({
     input: z.string().min(1).max(100)
   });

   const validation = await validateJsonBody(request, schema);
   if (!validation.success) {
     return NextResponse.json(
       { error: validation.error },
       { status: validation.status, headers: createResponseHeaders(requestId, securityHeaders) }
     );
   }
   ```

### Adding a New Page

1. **Create page file:**
   ```bash
   # src/app/my-page/page.tsx
   ```

2. **Implement page:**
   ```typescript
   import { Metadata } from "next";
   import { getLangFromHeaders } from "@/lib/i18n.server";

   export async function generateMetadata(): Promise<Metadata> {
     return {
       title: "My Page | LitStatus",
       description: "Page description",
     };
   }

   export default async function MyPage() {
     const lang = await getLangFromHeaders(null, null);

     return (
       <main>
         <h1>My Page</h1>
       </main>
     );
   }
   ```

### Adding a New Component

1. **Create component file:**
   ```bash
   # src/components/MyComponent.tsx
   ```

2. **Implement component:**
   ```typescript
   interface Props {
     title: string;
     lang: "en" | "zh";
   }

   export function MyComponent({ title, lang }: Props) {
     return (
       <div className="p-4">
         <h2 className="text-xl font-bold">{title}</h2>
       </div>
     );
   }
   ```

### Database Migration

1. **Update schema:**
   ```sql
   -- In supabase/schema.sql
   ALTER TABLE profiles ADD COLUMN new_field TEXT;
   ```

2. **Run in Supabase:**
   - Go to SQL Editor
   - Paste and execute

3. **Update types:**
   ```typescript
   // src/lib/types.ts
   export interface Profile {
     id: string;
     email: string | null;
     new_field?: string; // Add new field
   }
   ```

---

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Debugging Edge Routes

```typescript
// Use console.log (appears in Cloudflare Logs)
console.log("Debug:", { userId, ip, quota });

// Return debug info in development
if (process.env.NODE_ENV === "development") {
  return NextResponse.json({
    debug: { userId, ip, quota }
  });
}
```

### Debugging Database Queries

```typescript
const { data, error } = await supabase
  .from("profiles")
  .select("*");

if (error) {
  console.error("Database error:", error);
  // Log to security_events for production
}

console.log("Query result:", data);
```

### Common Issues

**Issue: Port already in use**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

**Issue: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

**Issue: Type errors after update**
```bash
# Regenerate types
npm run type-check
```

---

## Git Workflow

### Branch Naming

```
feature/add-new-component
fix/rate-limit-bug
hotfix/security-patch
refactor/optimize-queries
docs/update-api-docs
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore

**Examples:**
```
feat(api): add image upload endpoint

Implement multipart/form-data handling for image uploads.
Add validation for file size and type.

Closes #123
```

```
fix(security): patch timing attack vulnerability

Use constant-time comparison for admin tokens.
```

### Pull Request Checklist

- [ ] Code follows project structure
- [ ] TypeScript types defined
- [ ] ESLint passes
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No sensitive data in code
- [ ] Security best practices applied

---

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build

# View report
open .next/analyze/client.html
```

### Optimization Tips

1. **Use dynamic imports for large components:**
   ```typescript
   const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
     loading: () => <p>Loading...</p>
   });
   ```

2. **Use React Server Components by default**
3. **Optimize images with Next.js Image component**
4. **Minimize client-side JavaScript**
5. **Use Edge Runtime for API routes when possible**

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
