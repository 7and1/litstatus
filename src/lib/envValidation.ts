/**
 * Environment Validation Module
 *
 * Validates all required environment variables at startup
 * Provides clear error messages for missing configuration
 */

interface EnvVarSpec {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

const ENV_SPECS: EnvVarSpec[] = [
  // Application
  { name: "NODE_ENV", required: false, description: "Node environment (development/production)", defaultValue: "production" },
  { name: "PORT", required: false, description: "Server port", defaultValue: "3000" },

  // OpenAI
  {
    name: "OPENAI_API_KEY",
    required: true,
    description: "OpenAI API key for text/image generation",
    validator: (v) => v.startsWith("sk-"),
  },
  { name: "OPENAI_BASE_URL", required: false, description: "Custom OpenAI base URL" },
  { name: "OPENAI_TEXT_MODEL", required: false, description: "OpenAI model for text", defaultValue: "gpt-4o-mini" },
  { name: "OPENAI_VISION_MODEL", required: false, description: "OpenAI model for vision", defaultValue: "gpt-4o-mini" },

  // Supabase
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    description: "Supabase project URL",
    validator: (v) => v.includes("supabase.co"),
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anonymous key",
    validator: (v) => v.length > 50,
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    description: "Supabase service role key (server-side)",
  },

  // Site Configuration
  {
    name: "NEXT_PUBLIC_SITE_URL",
    required: true,
    description: "Primary site URL",
    defaultValue: "https://litstatus.com",
  },

  // Analytics
  { name: "NEXT_PUBLIC_PLAUSIBLE_DOMAIN", required: false, description: "Plausible analytics domain" },
  { name: "NEXT_PUBLIC_PLAUSIBLE_SRC", required: false, description: "Plausible analytics script URL" },
  { name: "NEXT_PUBLIC_GA_ID", required: false, description: "Google Analytics ID" },

  // Redis/Upstash
  { name: "UPSTASH_REDIS_REST_URL", required: false, description: "Upstash Redis URL" },
  { name: "UPSTASH_REDIS_REST_TOKEN", required: false, description: "Upstash Redis token" },
  { name: "REDIS_URL", required: false, description: "Traditional Redis URL" },

  // Email
  { name: "RESEND_API_KEY", required: false, description: "Resend API key for emails" },
  { name: "RESEND_FROM", required: false, description: "Resend from email address" },
  { name: "RESEND_NOTIFY_EMAIL", required: false, description: "Admin notification email" },

  // Admin
  { name: "ADMIN_EXPORT_TOKEN", required: false, description: "Token for admin exports" },

  // Monitoring
  { name: "METRICS_ACCESS_TOKEN", required: false, description: "Token for metrics endpoint access" },
  { name: "SENTRY_DSN", required: false, description: "Sentry DSN for error tracking" },

  // Security
  { name: "CORS_ALLOWED_ORIGINS", required: false, description: "Allowed CORS origins" },
  { name: "CSRF_SECRET", required: false, description: "CSRF protection secret" },

  // Application metadata
  { name: "APP_VERSION", required: false, description: "Application version", defaultValue: "0.1.0" },
  { name: "BUILD_TIME", required: false, description: "Build timestamp" },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
  };

  for (const spec of ENV_SPECS) {
    const value = process.env[spec.name];

    if (!value || value.trim() === "") {
      if (spec.required) {
        result.valid = false;
        result.missing.push(spec.name);
        result.errors.push(`Required environment variable "${spec.name}" is missing: ${spec.description}`);
      } else {
        // Set default value if available
        if (spec.defaultValue !== undefined) {
          process.env[spec.name] = spec.defaultValue;
        }
      }
      continue;
    }

    // Run custom validator
    if (spec.validator && !spec.validator(value)) {
      result.valid = false;
      result.errors.push(`Environment variable "${spec.name}" has invalid value: ${spec.description}`);
    }
  }

  // Check for optional but recommended variables
  const recommended: string[] = ["UPSTASH_REDIS_REST_URL", "METRICS_ACCESS_TOKEN"];
  for (const name of recommended) {
    if (!process.env[name]) {
      result.warnings.push(`Recommended environment variable "${name}" is not set`);
    }
  }

  // Check for potential security issues
  if (process.env.NODE_ENV === "production") {
    const dangerousValues = ["password", "secret", "123456", "admin"];
    for (const key of Object.keys(process.env)) {
      if (key.includes("SECRET") || key.includes("PASSWORD") || key.includes("KEY")) {
        const value = process.env[key];
        if (value && dangerousValues.some((dv) => value.toLowerCase().includes(dv))) {
          result.warnings.push(`Potentially insecure value for "${key}" - looks like a default value`);
        }
      }
    }
  }

  return result;
}

export function getPublicEnvVars(): Record<string, string> {
  const publicVars: Record<string, string> = {};

  for (const spec of ENV_SPECS) {
    if (spec.name.startsWith("NEXT_PUBLIC_") && process.env[spec.name]) {
      publicVars[spec.name] = process.env[spec.name]!;
    }
  }

  return publicVars;
}

export function printEnvironmentStatus(): void {
  const result = validateEnvironment();

  console.log("\n=== Environment Status ===");

  if (result.valid) {
    console.log("Status: OK");
  } else {
    console.log("Status: ERRORS FOUND");
  }

  if (result.missing.length > 0) {
    console.log("\nMissing Required Variables:");
    result.missing.forEach((name) => console.log(`  - ${name}`));
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  console.log("\nConfigured Services:");
  console.log(`  OpenAI: ${process.env.OPENAI_API_KEY ? "Yes" : "No"}`);
  console.log(`  Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "Yes" : "No"}`);
  console.log(`  Redis: ${process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL ? "Yes" : "No"}`);
  console.log(`  Email: ${process.env.RESEND_API_KEY ? "Yes" : "No"}`);
  console.log(`  Monitoring: ${process.env.METRICS_ACCESS_TOKEN || process.env.SENTRY_DSN ? "Yes" : "No"}`);

  console.log("========================\n");
}

// Validate on import (can be disabled for testing)
if (typeof window === "undefined" && process.env.SKIP_ENV_VALIDATION !== "true") {
  const result = validateEnvironment();
  if (!result.valid) {
    console.error("Environment validation failed:");
    result.errors.forEach((err) => console.error(`  - ${err}`));
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration");
    }
  }
}

export default validateEnvironment;
