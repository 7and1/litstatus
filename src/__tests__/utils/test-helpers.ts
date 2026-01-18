/**
 * Test helpers and utilities
 */

import { Request } from "next/server";

/**
 * Create a mock Request with FormData
 */
export function createMockFormDataRequest(
  url: string,
  data: Record<string, string | File | null>
): Request {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== null) {
      formData.append(key, value);
    }
  }

  return new Request(url, {
    method: "POST",
    body: formData,
  });
}

/**
 * Create a mock Request with JSON body
 */
export function createMockJsonRequest(
  url: string,
  data: Record<string, unknown>,
  headers?: Record<string, string>
): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Create a mock authenticated Request
 */
export function createMockAuthRequest(
  url: string,
  token: string,
  data?: Record<string, unknown>
): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Create a mock File object
 */
export function createMockFile(
  name: string,
  type: string,
  size: number = 1024
): File {
  const content = new Uint8Array(size);
  crypto.getRandomValues(content);

  return new File([content], name, { type });
}

/**
 * Create a mock image file
 */
export function createMockImageFile(
  format: "jpeg" | "png" | "webp" = "jpeg",
  size: number = 1024 * 100 // 100KB
): File {
  const mimeType = `image/${format}`;

  // Create appropriate magic bytes for the format
  let magicBytes: Uint8Array;
  switch (format) {
    case "jpeg":
      magicBytes = new Uint8Array([0xFF, 0xD8, 0xFF]);
      break;
    case "png":
      magicBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      break;
    case "webp":
      magicBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);
      break;
  }

  const content = new Uint8Array(size);
  content.set(magicBytes, 0);
  crypto.getRandomValues(content.subarray(magicBytes.length));

  return new File([content], `test.${format}`, { type: mimeType });
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Create a mock user
 */
export function createMockUser(overrides: Partial<{ id: string; email: string }> = {}) {
  return {
    id: overrides.id || "mock-user-id",
    email: overrides.email || "mock@example.com",
  };
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient(
  data?: unknown,
  error?: Error | null
) {
  const { vi } = require("vitest");

  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data, error: error || null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue({ data, error: error || null }),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: error || null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: error || null }),
    limit: vi.fn().mockResolvedValue({ data, error: error || null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: data },
        error,
      }),
    },
  };
}

/**
 * Test data generators
 */
export const testData = {
  email: () => `test-${Date.now()}@example.com`,
  username: () => `user${Date.now()}`,
  text: (length: number = 100) => "A".repeat(length),
  hashtags: () => "#test #hashtag #example",
  caption: () => "Test caption with emojis 🎉✨",
};

/**
 * Assertion helpers
 */
export const assertions = {
  assertRateLimitHeaders: (headers: Headers) => {
    expect(headers.get("X-RateLimit-Limit")).toBeTruthy();
    expect(headers.get("X-RateLimit-Remaining")).toBeTruthy();
    expect(headers.get("X-RateLimit-Reset")).toBeTruthy();
  },

  assertSecurityHeaders: (headers: Headers) => {
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Content-Security-Policy")).toBeTruthy();
  },

  assertQuotaStatus: (quota: {
    plan: string;
    limit: number | null;
    remaining: number | null;
    isPro: boolean;
  }) => {
    expect(quota).toHaveProperty("plan");
    expect(quota).toHaveProperty("limit");
    expect(quota).toHaveProperty("remaining");
    expect(quota).toHaveProperty("isPro");
  },
};
