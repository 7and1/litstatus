# Contributing to LitStatus.com

Thank you for your interest in contributing to LitStatus.com! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Community Guidelines](#community-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- **Resful**: Treat others with respect and professionalism
- **Inclusive**: Welcome diverse perspectives and backgrounds
- **Collaborative**: Work together to solve problems
- **Constructive**: Provide helpful feedback and accept feedback graciously

### Reporting Issues

If you encounter inappropriate behavior, please contact the project maintainers directly.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 20+ installed
- Git installed and configured
- GitHub account
- Familiarity with TypeScript and React
- Basic understanding of Next.js

### Initial Setup

```bash
# 1. Fork the repository
# Click "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/litstatus.git
cd litstatus.com

# 3. Add upstream remote
git remote add upstream https://github.com/7and1/litstatus.git

# 4. Install dependencies
npm install

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 6. Start development server
npm run dev

# 7. Open browser
open http://localhost:3000
```

### Understanding the Codebase

Read these documents first:

1. [README.md](/README.md) - Project overview
2. [docs/DEVELOPER_GUIDE.md](/docs/DEVELOPER_GUIDE.md) - Developer guide
3. [docs/API.md](/docs/API.md) - API documentation

## Development Workflow

### 1. Choose an Issue

- Look for issues labeled `good first issue` for beginners
- Check issues labeled `help wanted` for any skill level
- Comment on the issue to claim it
- Wait for assignee confirmation

### 2. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write code following [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Commit frequently with clear messages

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test

# Build production version
npm run build

# Test locally
npm run dev
```

### 5. Commit Changes

Use conventional commit format:

```bash
# Feature
git commit -m "feat: add user profile page"

# Bug fix
git commit -m "fix: resolve auth token expiration issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: simplify quota calculation logic"

# Performance
git commit -m "perf: optimize database query performance"

# Tests
git commit -m "test: add unit tests for rate limiter"
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
# Visit: https://github.com/7and1/litstatus/compare
```

## Coding Standards

### TypeScript

**Use Type Annotations**:
```typescript
// Good
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
function calculateTotal(items: any): any {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**Avoid `any` Type**:
```typescript
// Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User | null {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

**Use Types for Simple Objects**:
```typescript
// Good
type Config = {
  apiUrl: string;
  timeout: number;
  retries: number;
};

// Use interface for object shapes
interface IConfigService {
  getConfig(): Config;
  updateConfig(config: Partial<Config>): void;
}
```

### React Components

**Functional Components**:
```typescript
// Prefer functional components
export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}

// Avoid class components (unless necessary)
export class MyComponent extends React.Component {
  // ...
}
```

**Props Interface**:
```typescript
// Define props interface
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
  children?: React.ReactNode;
}

export function MyComponent({ title, onSubmit, children }: MyComponentProps) {
  // ...
}
```

**Server vs Client Components**:
```typescript
// Server component (default)
export function ServerComponent() {
  return <div>Hello</div>;
}

// Client component (add 'use client')
'use client';
export function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Naming Conventions

**Files and Directories**:
- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `camelCase.ts` (e.g., `authHelper.ts`)
- Constants: `camelCase.ts` (e.g., `apiEndpoints.ts`)
- Types: `PascalCase.ts` (e.g., `UserTypes.ts`)

**Variables and Functions**:
```typescript
// camelCase for variables and functions
const userName = 'John';
function getUserData() { }

// PascalCase for types, interfaces, classes
type UserType = { };
interface UserService { }
class DatabaseConnection { }

// UPPER_CASE for constants
const MAX_RETRIES = 3;
const API_URL = 'https://api.example.com';
```

### Error Handling

**Always Handle Errors**:
```typescript
// Good
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// Bad
async function fetchData() {
  const response = await fetch('/api/data');
  return await response.json();
}
```

**Use Custom Error Types**:
```typescript
// Good
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

throw new ApiError(404, 'User not found');

// Bad
throw new Error('User not found');
```

### Security

**Never Commit Secrets**:
```typescript
// Bad - hardcoded secret
const apiKey = 'sk-1234567890abcdef';

// Good - environment variable
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is required');
}
```

**Sanitize User Input**:
```typescript
import { sanitizeString, validateTextLength } from '@/lib/security';

// Good
const sanitized = sanitizeString(userInput);
if (!validateTextLength(sanitized, MAX_LENGTH)) {
  throw new Error('Input too long');
}

// Bad
const text = userInput; // Untested!
```

**Use Security Middleware**:
```typescript
import { withSecurity } from '@/lib/apiSecurity';

export async function POST(request: Request) {
  return withSecurity(request, async (context) => {
    // Your logic here
  }, { rateLimit: 'generate' });
}
```

## Testing Guidelines

### Unit Tests

```typescript
// src/lib/__tests__/your-function.test.ts
import { describe, it, expect } from '@jest/globals';
import { yourFunction } from '../your-library';

describe('yourFunction', () => {
  it('should process valid input', () => {
    const input = { value: 'test' };
    const result = yourFunction(input);
    expect(result).toBeDefined();
    expect(result.value).toBe('test');
  });

  it('should throw on invalid input', () => {
    expect(() => yourFunction(null)).toThrow('Invalid input');
  });

  it('should handle edge cases', () => {
    const result = yourFunction({ value: '' });
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('API Integration', () => {
  it('should generate caption', async () => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.caption).toBeDefined();
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Test critical paths thoroughly
- Test edge cases and error conditions
- Use mocks for external dependencies

## Documentation

### Code Comments

**When to Comment**:
- Complex algorithms
- Non-obvious business logic
- Workarounds for known issues
- Public API documentation

```typescript
/**
 * Calculates user quota based on subscription tier
 * @param user - User object with subscription info
 * @returns Quota status with limits and usage
 *
 * @example
 * const quota = calculateQuota(user);
 * console.log(quota.remaining); // 15
 */
export function calculateQuota(user: User): QuotaStatus {
  // Free tier: 20/day, Pro: unlimited
  if (user.isPro) {
    return { remaining: null, limit: null, isPro: true };
  }

  // Calculate based on daily usage
  const used = user.dailyUsageCount || 0;
  return {
    remaining: Math.max(0, 20 - used),
    limit: 20,
    isPro: false
  };
}
```

### API Documentation

Document new endpoints in `/docs/API.md`:

```markdown
### POST /api/your-endpoint

Description of what this endpoint does.

**Request**: `application/json`
```json
{
  "param1": "value1",
  "param2": "value2"
}
```

**Response**:
```json
{
  "data": {...},
  "success": true
}
```

**Rate Limit**: 60 requests/minute
```

### README Updates

Update README.md for:
- New features
- Configuration changes
- Breaking changes
- New environment variables

## Pull Request Process

### PR Title Format

Use conventional commit format in PR title:

```
feat: add user profile page
fix: resolve auth token expiration
docs: update deployment guide
refactor: simplify quota calculation
test: add integration tests for API
```

### PR Description Template

```markdown
## Summary
Brief description of changes (2-3 sentences).

## Changes
- Bullet point list of changes
- Include file paths if relevant
- Note any breaking changes

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Browser testing completed

## Screenshots (if applicable)
![Screenshot](url)

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No console.log statements
- [ ] No sensitive data committed
- [ ] PR title follows convention
```

### Review Process

1. **Automated Checks**:
   - CI/CD pipeline runs tests
   - Lint checks pass
   - Type checks pass
   - Build succeeds

2. **Code Review**:
   - Maintainer reviews code
   - Requests changes if needed
   - Approves when ready

3. **Merge**:
   - Squash and merge to main
   - Delete feature branch
   - Deploy to staging

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address reviewer feedback"

# Push to branch
git push origin feature/your-feature

# PR updates automatically
```

## Community Guidelines

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **Pull Requests**: Code contributions
- **Discussions**: Questions, ideas

### Asking Questions

1. **Search First**: Check existing issues and documentation
2. **Be Specific**: Provide details and context
3. **Be Patient**: Maintainers volunteer their time
4. **Be Constructive**: Focus on solutions, not problems

### Reporting Bugs

Use bug report template:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. 20.10.0]

## Additional Context
Screenshots, logs, etc.
```

### Suggesting Features

Use feature request template:

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives
What alternatives did you consider?

## Additional Context
Examples, mockups, etc.
```

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in significant features

## License

By contributing, you agree that your contributions will be licensed under the project's license.

## Questions?

- Check [Documentation](/docs/)
- [Open an Issue](https://github.com/7and1/litstatus/issues)
- [Start a Discussion](https://github.com/7and1/litstatus/discussions)

---

Thank you for contributing to LitStatus.com! Your contributions help make this project better for everyone.

**Last Updated**: 2025-01-17
