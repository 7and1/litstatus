import { vi } from "vitest";
import { webcrypto as crypto } from "node:crypto";

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "test-redis-token";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

// Set up Web Crypto API globally using Object.defineProperty
Object.defineProperty(global, "crypto", {
  value: crypto,
  writable: false,
  configurable: true,
});

// Suppress console output during tests unless needed
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (args[0]?.toString?.().includes("Warning:")) return;
    originalError(...args);
  };
  console.warn = (...args) => {
    if (args[0]?.toString?.().includes("Warning:")) return;
    originalWarn(...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  vi.clearAllMocks();
});
