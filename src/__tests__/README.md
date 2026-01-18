# Test Suite for LitStatus.com

This directory contains the comprehensive test suite for litstatus.com production deployment.

## Test Structure

```
src/__tests__/
├── setup.ts                 # Global test setup
├── utils/
│   └── test-helpers.ts      # Test utilities and helpers
├── unit/                    # Unit tests
│   └── lib/
│       ├── security.test.ts
│       ├── quota.test.ts
│       ├── validation.test.ts
│       ├── i18n.test.ts
│       ├── openai.test.ts
│       ├── ip.test.ts
│       ├── cache.test.ts
│       ├── performance.test.ts
│       ├── prompts.test.ts
│       └── auth.test.ts
├── integration/             # Integration tests
│   └── api/
│       ├── generate.test.ts
│       ├── quota.test.ts
│       ├── feedback.test.ts
│       ├── wishlist.test.ts
│       ├── events.test.ts
│       └── health.test.ts
├── security/                # Security tests
│   ├── sql-injection.test.ts
│   ├── xss.test.ts
│   ├── csrf-rate-limit.test.ts
│   └── auth-bypass.test.ts
└── e2e/                     # E2E tests (Playwright)
    ├── home.spec.ts
    ├── generate.spec.ts
    ├── login.spec.ts
    ├── wishlist.spec.ts
    ├── quota.spec.ts
    ├── performance.spec.ts
    └── security.spec.ts
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Security Tests
```bash
npm run test:security
```

### All Vitest Tests (Unit + Integration + Security)
```bash
npm run test:all
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

## Test Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Test Frameworks

- **Vitest**: Unit and integration tests
- **Playwright**: End-to-end tests
- **@vitest/coverage-v8**: Code coverage

## Writing New Tests

### Unit Tests
Unit tests should focus on individual functions and modules in isolation.

```typescript
import { describe, it, expect } from "vitest";
import { functionToTest } from "@/lib/module";

describe("module", () => {
  it("should do something", () => {
    const result = functionToTest("input");
    expect(result).toBe("expected");
  });
});
```

### Integration Tests
Integration tests should test API endpoints with mocked dependencies.

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/endpoint/route";

describe("POST /api/endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return expected response", async () => {
    const request = new Request("https://example.com/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ key: "value" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("data");
  });
});
```

### E2E Tests
E2E tests should test user flows through the browser.

```typescript
import { test, expect } from "@playwright/test";

test("user flow description", async ({ page }) => {
  await page.goto("/");

  const button = page.locator("button:has-text('Click me')");
  await button.click();

  await expect(page).toHaveURL(/\/success/);
});
```

## CI/CD Integration

Tests are configured to run in CI/CD pipelines:

```yaml
- run: npm run test:all
- run: npm run test:e2e
```

## Environment Variables for Testing

The test setup automatically mocks required environment variables in `setup.ts`:

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.OPENAI_API_KEY = "test-openai-key";
// etc.
```

## Test Data Helpers

Use the helper functions from `utils/test-helpers.ts`:

```typescript
import {
  createMockJsonRequest,
  createMockUser,
  createMockImageFile,
} from "@/__tests__/utils/test-helpers";

const request = createMockJsonRequest("/api/test", { data: "value" });
const user = createMockUser();
const imageFile = createMockImageFile("jpeg", 1024);
```

## Troubleshooting

### Tests timing out
- Increase timeout in test config or individual tests
- Check for async operations not being properly awaited

### E2E tests failing
- Ensure dev server is running or let Playwright start it
- Check if BASE_URL is correct for production testing

### Coverage not meeting thresholds
- Check which files are excluded in vitest.config.ts
- Add tests for uncovered code paths

## Security Test Categories

1. **SQL Injection**: Tests for SQL injection prevention
2. **XSS**: Tests for cross-site scripting prevention
3. **CSRF**: Tests for CSRF protection
4. **Rate Limiting**: Tests for rate limiting enforcement
5. **Auth Bypass**: Tests for authentication bypass prevention
