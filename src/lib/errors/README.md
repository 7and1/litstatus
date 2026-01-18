# Error Handling System

Production-level error handling for the LitStatus application.

## Features

- **Centralized Error Logging**: All errors logged with context and severity levels
- **React Error Boundaries**: Catch and handle component errors gracefully
- **Retry Logic**: Automatic retry for failed requests with exponential backoff
- **Fallback Values**: Graceful degradation when services fail
- **Type-Safe Errors**: Strongly typed error codes and contexts
- **Client & Server Support**: Works in both browser and Node.js environments

## Usage

### Basic Error Logging

```typescript
import { logError, logWarn, logInfo } from "@/lib/errors";

// Log an error with context
logError(error, {
  userId: user.id,
  action: "generate_caption",
  mode: "Standard"
});
```

### Creating Errors

```typescript
import { createAppError } from "@/lib/errors";

const error = createAppError("VALIDATION_ERROR", "Invalid input", {
  statusCode: 400,
  userMessage: "Please check your input",
  recoverable: true,
  context: { field: "email" }
});
```

### API Error Handling

```typescript
import { safeFetch } from "@/lib/errors";

const response = await safeFetch("/api/generate", {
  method: "POST",
  body: formData,
  timeout: 30000,
  retries: 2,
});
```

### Retry Logic

```typescript
import { withRetry } from "@/lib/errors";

const result = await withRetry(
  () => fetchFromAPI(),
  {
    maxAttempts: 3,
    baseDelay: 300,
    shouldRetry: (error) => error.statusCode >= 500
  }
);
```

### Fallback Values

```typescript
import { withFallback } from "@/lib/errors";

const data = await withFallback(
  () => fetchExpensiveData(),
  defaultData,
  "user-profile"
);
```

### React Error Boundary

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

<ErrorBoundary fallback={CustomErrorFallback}>
  <MyComponent />
</ErrorBoundary>
```

### Toast Notifications

```tsx
import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const { success, error, warning, info, ToastComponent } = useToast();

  const handleAction = async () => {
    try {
      await doSomething();
      success("Action completed!");
    } catch (err) {
      error("Something went wrong");
    }
  };

  return (
    <>
      <button onClick={handleAction}>Click me</button>
      <ToastComponent />
    </>
  );
}
```

## Error Codes

- `UNKNOWN_ERROR` - Unexpected error
- `NETWORK_ERROR` - Network request failed
- `VALIDATION_ERROR` - Invalid input
- `AUTHENTICATION_ERROR` - Not authenticated
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `RATE_LIMIT_ERROR` - Too many requests
- `QUOTA_EXCEEDED` - Quota limit reached
- `SERVICE_UNAVAILABLE` - Service down
- `TIMEOUT_ERROR` - Request timeout
- `PARSE_ERROR` - Failed to parse data
- `STORAGE_ERROR` - Storage operation failed
- `CACHE_ERROR` - Cache operation failed
- `EXTERNAL_SERVICE_ERROR` - Third-party service error
- `INVALID_INPUT` - Invalid user input

## Best Practices

1. **Always log errors with context**: Include userId, action, and relevant metadata
2. **Use appropriate error codes**: Choose the most specific code for the error
3. **Provide user-friendly messages**: Use `userMessage` for end-user communication
4. **Mark recoverable errors**: Set `recoverable: true` if the user can retry
5. **Use fallbacks for non-critical data**: Show defaults instead of failing
6. **Implement retry for external services**: Use automatic retry for API calls
7. **Wrap async operations**: Use error boundaries for async components

## File Structure

```
src/lib/errors/
├── types.ts           # Type definitions
├── AppError.ts        # Error creation utilities
├── logger.ts          # Centralized logging
├── handlers.ts        # Error handlers
├── retry.ts           # Retry logic
├── fallbacks.ts       # Fallback utilities
├── api.ts             # API error handling
├── apiMiddleware.ts   # API route middleware
├── globalHandlers.ts  # Global error handlers
├── index.ts           # Barrel export
└── README.md          # This file

src/components/
├── ErrorBoundary.tsx          # React error boundary
├── AsyncErrorBoundary.tsx     # Async error boundary
└── Toast.tsx                  # Toast notifications

src/hooks/
└── useToast.ts                # Toast management hook
```

## Monitoring

Errors are automatically logged to:
- Console (development)
- `/api/events` endpoint (production)

Configure logging levels and destinations in `logger.ts`.
