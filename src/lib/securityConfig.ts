/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimiting: {
    enabled: true,
    useRedis: true,
    fallbackToMemory: true,
    defaultWindowMs: 60 * 1000, // 1 minute
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    cookieName: "csrf_token",
    headerName: "X-CSRF-Token",
    tokenExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
    validateMagicBytes: true,
    scanForMalware: false, // Future enhancement
  },

  // Input Validation
  validation: {
    maxTextLength: 2000,
    maxEmailLength: 320,
    maxNoteLength: 500,
    maxCaptionLength: 1000,
    maxHashtagsLength: 500,
    maxVariantLength: 50,
    sanitizeControlChars: true,
  },

  // Security Headers
  headers: {
    hsts: {
      enabled: true,
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
    },
    csp: {
      enabled: true,
      reportOnly: false, // Set to true for testing
      reportUri: "/api/security/csp-report",
    },
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "geolocation=(), microphone=(), camera=()",
  },

  // Authentication
  auth: {
    tokenExpirationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshTokenExpirationMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxFailedAttempts: 5,
    lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  },

  // Quota System
  quota: {
    useRedis: true,
    fallbackToMemory: true,
    guestDailyLimit: 5,
    userDailyLimit: 20,
    proUnlimited: true,
    useDeviceFingerprint: true,
  },

  // Security Events
  logging: {
    enabled: true,
    logToDatabase: true,
    logToConsole: true,
    sanitizeUserInput: true,
    retentionDays: 90,
  },

  // Allowed Origins (for CORS and origin validation)
  allowedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || "https://litstatus.com",
    "http://localhost:3000", // Development
  ],

  // Trusted Proxies (for IP extraction)
  trustedProxies: [
    "cloudflare",
    "vercel",
    "aws",
  ],

  // API Security
  api: {
    maxBodySize: "1mb",
    timeoutMs: 30000, // 30 seconds
    requireHttps: process.env.NODE_ENV === "production",
  },

  // Database Security
  database: {
    allowedTables: [
      "profiles",
      "pro_wishlist",
      "feedback",
      "funnel_events",
      "security_events",
    ],
    maxInClauseValues: 1000,
    validateColumnNames: true,
  },
} as const;

/**
 * Get environment-specific security settings
 */
export function getSecuritySettings() {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    isProduction,
    isDevelopment,
    csrfEnabled: SECURITY_CONFIG.csrf.enabled,
    rateLimitingEnabled: SECURITY_CONFIG.rateLimiting.enabled,
    hstsEnabled: isProduction && SECURITY_CONFIG.headers.hsts.enabled,
    cspEnabled: SECURITY_CONFIG.headers.csp.enabled,
    requireHttps: isProduction && SECURITY_CONFIG.api.requireHttps,
  };
}

/**
 * Validate that required security environment variables are set
 */
export function validateSecurityEnv(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (SECURITY_CONFIG.rateLimiting.useRedis) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      errors.push("UPSTASH_REDIS_REST_URL is required when Redis rate limiting is enabled");
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      errors.push("UPSTASH_REDIS_REST_TOKEN is required when Redis rate limiting is enabled");
    }
  }

  // Check for Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  // Check for OpenAI
  if (!process.env.OPENAI_API_KEY) {
    errors.push("OPENAI_API_KEY is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
