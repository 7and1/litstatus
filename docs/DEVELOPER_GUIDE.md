# LitStatus.com Developer Guide

Comprehensive guide for developers working on LitStatus.com.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Code Structure](#code-structure)
- [Development Workflow](#development-workflow)
- [Adding Features](#adding-features)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance](#performance)
- [Style Guide](#style-guide)
- [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Supabase account
- Redis (Upstash or local)
- OpenAI API key

### Initial Setup

```bash
# Clone repository
git clone https://github.com/7and1/litstatus.git
cd litstatus.com

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### IDE Setup

**VS Code Extensions** (recommended):
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Error Lens

**VS Code Settings** (.vscode/settings.json):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Project Architecture

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Node.js (default), Edge Runtime (API routes)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (Upstash or local)
- **AI**: OpenAI GPT-4o-mini
- **Auth**: Supabase Auth

### Architecture Patterns

**Server Components by Default**:
```typescript
// Default: Server Component
export default function Page() {
  return <div>Hello</div>;
}

// Client Component (add 'use client')
'use client';
export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**API Routes**:
```typescript
// src/app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  // Process request
  return NextResponse.json({ ok: true });
}
```

**Middleware**:
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Modify request/response
  return NextResponse.next();
}
```

### Data Flow

```
User Request
    ↓
Next.js Middleware (auth, i18n)
    ↓
API Route / Page Component
    ↓
Security Layer (rate limiting, validation)
    ↓
Business Logic (quota, OpenAI, etc.)
    ↓
Data Layer (Supabase, Redis)
    ↓
Response
```

## Code Structure

### Directory Layout

```
litstatus.com/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (marketing)/          # Marketing pages group
│   │   │   ├── page.tsx         # Homepage
│   │   │   ├── pricing/         # Pricing page
│   │   │   ├── examples/        # Examples page
│   │   │   └── faq/             # FAQ page
│   │   ├── api/                 # API routes
│   │   │   ├── generate/        # Caption generation
│   │   │   ├── quota/           # Quota management
│   │   │   ├── wishlist/        # Pro wishlist
│   │   │   ├── feedback/        # User feedback
│   │   │   ├── events/          # Analytics events
│   │   │   ├── admin/           # Admin endpoints
│   │   │   ├── health/          # Health check
│   │   │   └── security/        # Security endpoints
│   │   ├── login/               # Login page
│   │   ├── og/                  # OG image generation
│   │   ├── zh/                  # Chinese pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Homepage redirect
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── MarketingShell.tsx   # Marketing layout
│   │   ├── HomeClient.tsx       # Homepage client logic
│   │   ├── LoginClient.tsx      # Login client logic
│   │   ├── CaseStudyDetail.tsx  # Case study component
│   │   ├── UseCaseDetail.tsx    # Use case component
│   │   └── JsonLd.tsx           # SEO structured data
│   ├── lib/                     # Utilities and libraries
│   │   ├── auth.ts              # Authentication helpers
│   │   ├── quota.ts             # Quota management
│   │   ├── redis.ts             # Redis client
│   │   ├── openai.ts            # OpenAI client
│   │   ├── security.ts          # Security utilities
│   │   ├── prompts.ts           # AI prompts
│   │   ├── i18n.ts              # Internationalization
│   │   ├── content.ts           # Content constants
│   │   ├── analytics.ts         # Analytics helpers
│   │   ├── attribution.ts       # Attribution tracking
│   │   ├── errors.ts            # Error handling
│   │   ├── types.ts             # TypeScript types
│   │   ├── constants.ts         # App constants
│   │   └── __tests__/           # Unit tests
│   └── middleware.ts            # Next.js middleware
├── supabase/
│   └── schema.sql               # Database schema
├── public/                      # Static assets
│   ├── images/                  # Images
│   └── icons/                   # Icons
├── docs/                        # Documentation
│   ├── API.md                   # API documentation
│   └── DEVELOPER_GUIDE.md       # This file
├── .github/
│   └── workflows/               # CI/CD workflows
│       └── deploy-cloudflare.yml
├── docker-compose.yml           # Docker configuration
├── deploy.sh                    # Deployment script
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind configuration
├── package.json                # Dependencies
└── README.md                   # Project overview
```

### Key Files Explained

**src/app/layout.tsx**: Root layout component
- Sets up HTML structure
- Configures metadata
- Initializes providers
- Applies global styles

**src/middleware.ts**: Request middleware
- Authentication checks
- i18n routing
- Path redirects

**src/lib/**: Business logic utilities
- Reusable across components
- No UI code
- Pure functions when possible

**supabase/schema.sql**: Database schema
- Table definitions
- RLS policies
- Initial data

## Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes
# ... work on your feature ...

# 3. Run quality checks
npm run lint
npm run type-check

# 4. Commit changes
git add .
git commit -m "feat: add your feature"

# 5. Push branch
git push origin feature/your-feature

# 6. Create pull request
# Via GitHub interface
```

### Conventional Commits

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(api): add image upload support
fix(auth): resolve session expiration issue
docs(readme): update deployment instructions
style: format code with prettier
refactor(quota): simplify quota calculation
test(security): add rate limit tests
chore: update dependencies
```

### Code Review Process

1. **Self-Review**:
   - Run lint and type-check
   - Test your changes
   - Review diff

2. **Create Pull Request**:
   - Clear title and description
   - Link to related issues
   - Add screenshots if UI changes

3. **Review Checklist**:
   - [ ] Code follows project structure
   - [ ] Security best practices applied
   - [ ] Error handling implemented
   - [ ] TypeScript types defined
   - [ ] No console.log statements
   - [ ] No sensitive data
   - [ ] Tests added/updated

## Adding Features

### Adding a New Page

```bash
# 1. Create page file
touch src/app/your-page/page.tsx

# 2. Implement page component
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}

# 3. Add metadata
export const metadata = {
  title: 'Your Page - LitStatus',
  description: 'Page description',
};

# 4. Test locally
npm run dev
# Visit http://localhost:3000/your-page
```

### Adding a New API Endpoint

```typescript
// src/app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { SECURITY_HEADERS } from '@/lib/security';

export async function POST(request: Request) {
  try {
    // 1. Get user
    const user = await getUserFromRequest(request);

    // 2. Parse request
    const body = await request.json();

    // 3. Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 4. Process business logic
    const result = await processYourLogic(body);

    // 5. Return response
    return NextResponse.json(
      { data: result },
      { headers: SECURITY_HEADERS }
    );
  } catch (error) {
    // 6. Handle errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
```

### Adding a New Library Function

```typescript
// src/lib/your-library.ts
import { type YourType } from '@/lib/types';

/**
 * Your function description
 * @param input - Input parameter
 * @returns Processed result
 */
export function yourFunction(input: YourType): YourResult {
  // Validate input
  if (!input) {
    throw new Error('Invalid input');
  }

  // Process logic
  const result = processLogic(input);

  return result;
}

// Helper functions
function processLogic(input: YourType): YourResult {
  // Implementation
  return input;
}
```

### Database Changes

```sql
-- 1. Update supabase/schema.sql

CREATE TABLE IF NOT EXISTS your_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  -- Add columns
);

-- 2. Add RLS policies
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON your_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Run in Supabase SQL Editor
```

### Adding Environment Variables

```bash
# 1. Add to .env.example
NEW_VAR_NAME=your_value

# 2. Add to .env.local
NEW_VAR_NAME=your_value

# 3. Use in code
const value = process.env.NEW_VAR_NAME;

# 4. Validate presence
if (!process.env.NEW_VAR_NAME) {
  throw new Error('NEW_VAR_NAME is required');
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test src/lib/__tests__/security.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Writing Tests

```typescript
// src/lib/__tests__/your-function.test.ts
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../your-library';

describe('yourFunction', () => {
  it('should process valid input', () => {
    const input = { value: 'test' };
    const result = yourFunction(input);
    expect(result).toBeDefined();
  });

  it('should throw on invalid input', () => {
    expect(() => yourFunction(null)).toThrow('Invalid input');
  });
});
```

### Manual Testing

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# Test with authentication
curl -X POST http://localhost:3000/api/your-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

## Debugging

### VS Code Debugger

**.vscode/launch.json**:
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

### Console Logging

```typescript
// Debug logging
console.log('Debug info:', data);

// Error logging
console.error('Error:', error);

// Warning logging
console.warn('Warning:', warning);
```

**Remove before committing!**

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Enable specific debug namespace
DEBUG=litstatus:* npm run dev
```

### Common Issues

**Build Errors**:
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install

# Rebuild
npm run build
```

**TypeScript Errors**:
```bash
# Check types
npm run type-check

# Fix issues automatically
npm run lint:fix
```

## Performance

### Code Splitting

```typescript
// Dynamic imports for client components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false
  }
);
```

### Image Optimization

```typescript
import Image from 'next/image';

// Use Next.js Image component
<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
/>
```

### Caching Strategies

```typescript
// Redis caching
const cacheKey = `cache:${id}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await expensiveOperation();
await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
return result;
```

### Performance Monitoring

```typescript
// Measure execution time
const start = Date.now();
await operation();
const duration = Date.now() - start;
console.log(`Operation took ${duration}ms`);
```

## Style Guide

### TypeScript

**Use types over interfaces** (usually):
```typescript
// Good
type User = {
  id: string;
  name: string;
};

// Use interface for object shapes
interface IUserRepository {
  findById(id: string): Promise<User>;
}
```

**Strict typing**:
```typescript
// Good
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Avoid
function calculateTotal(items: any): any {
  // ...
}
```

### React Components

**Naming Conventions**:
```typescript
// File name: PascalCase
YourComponent.tsx

// Component name: PascalCase
export function YourComponent() {}

// Props interface: ComponentNameProps
interface YourComponentProps {
  title: string;
  onSubmit: () => void;
}
```

**Component Structure**:
```typescript
'use client';

import { useState } from 'react';
import type { YourComponentProps } from './types';

export function YourComponent({ title, onSubmit }: YourComponentProps) {
  // 1. State
  const [value, setValue] = useState('');

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 3. Event handlers
  const handleClick = () => {
    onSubmit();
  };

  // 4. Render
  return (
    <div onClick={handleClick}>
      {title}
    </div>
  );
}
```

### CSS/Tailwind

**Utility Classes**:
```typescript
// Good: Use Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg">

// Avoid: Custom CSS
<div style={{ display: 'flex', padding: '16px' }}>
```

**Responsive Design**:
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### File Organization

**Imports Order**:
```typescript
// 1. React imports
import { useState } from 'react';

// 2. Third-party imports
import { NextResponse } from 'next/server';

// 3. Local imports (absolute)
import { getUserFromRequest } from '@/lib/auth';
import { MyComponent } from '@/components/MyComponent';

// 4. Relative imports
import { localHelper } from '../utils';

// 5. Types (if separate)
import type { MyType } from './types';
```

## Best Practices

### Security

1. **Never expose secrets**:
```typescript
// Bad
const apiKey = 'sk-...';  // Hardcoded secret

// Good
const apiKey = process.env.API_KEY;
```

2. **Validate all inputs**:
```typescript
import { sanitizeString, validateTextLength } from '@/lib/security';

const sanitized = sanitizeString(userInput);
if (!validateTextLength(sanitized, MAX_LENGTH)) {
  throw new Error('Input too long');
}
```

3. **Use security middleware**:
```typescript
import { withSecurity } from '@/lib/apiSecurity';

export async function POST(request: Request) {
  return withSecurity(request, async (context) => {
    // Your logic here
  }, { rateLimit: 'generate' });
}
```

### Error Handling

1. **Try-catch async operations**:
```typescript
try {
  const result = await riskyOperation();
  return NextResponse.json({ data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

2. **Use centralized error handling**:
```typescript
import { logError, createAppError } from '@/lib/errors';

logError(error, {
  userId,
  path: request.url,
  context: 'generate'
});

throw createAppError('Failed to generate', 500);
```

### Performance

1. **Optimize database queries**:
```typescript
// Bad: N+1 queries
for (const user of users) {
  const profile = await getProfile(user.id);
}

// Good: Single query with joins
const profiles = await getProfiles(users.map(u => u.id));
```

2. **Use caching**:
```typescript
const cached = await redis.get(`user:${id}`);
if (cached) return JSON.parse(cached);

const data = await fetchUser(id);
await redis.set(`user:${id}`, JSON.stringify(data), { ex: 3600 });
return data;
```

3. **Minimize bundle size**:
```typescript
import dynamic from 'next/dynamic';

const HeavyLibrary = dynamic(() => import('heavy-library'), {
  ssr: false
});
```

### Accessibility

1. **Semantic HTML**:
```typescript
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

2. **ARIA labels**:
```typescript
<button aria-label="Close dialog" onClick={onClose}>
  ×
</button>
```

3. **Keyboard navigation**:
```typescript
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action
</button>
```

## Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Upstash Console](https://app.upstash.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### Community

- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/next.js)

---

**Last Updated**: 2025-01-17
**Version**: 0.1.0
