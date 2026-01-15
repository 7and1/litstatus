export const QUOTAS = {
  guest: 3,
  user: 20,
} as const;

export const MODES = ["Standard", "Savage", "Rizz"] as const;
export type Mode = (typeof MODES)[number];

export type Plan = "guest" | "user" | "pro";

export type QuotaStatus = {
  plan: Plan;
  limit: number | null;
  remaining: number | null;
  isPro: boolean;
};

// Validation limits
export const LIMITS = {
  MAX_TEXT_LENGTH: 2000,
  MAX_MODE_LENGTH: 20,
  MAX_EMAIL_LENGTH: 254,
  MAX_NOTE_LENGTH: 500,
  MAX_CAPTION_LENGTH: 5000,
  MAX_HASHTAGS_LENGTH: 500,
  MAX_DETECTED_OBJECT_LENGTH: 200,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ],
} as const;

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_INPUT: "INVALID_INPUT",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  FORBIDDEN: "FORBIDDEN",
  SERVICE_ERROR: "SERVICE_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
