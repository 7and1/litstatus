/**
 * Zod validation schemas for API routes
 * P0 Security: Type-safe request validation with proper error messages
 */

import { z } from "zod";

/**
 * Common validation patterns
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(320, "Email too long")
  .transform((val) => val.trim().toLowerCase());

export const langSchema = z.enum(["en", "zh"], {
  message: "Invalid language",
});

export const modeSchema = z.enum(["Standard", "Creative", "Professional"], {
  message: "Invalid mode",
});

export const ratingSchema = z.union([z.literal(1), z.literal(-1)], {
  message: "Rating must be 1 or -1",
});

/**
 * /api/generate schema
 */
export const generateInputSchema = z.object({
  text: z
    .string()
    .max(2000, "Text too long (max 2000 characters)")
    .optional(),
  mode: z
    .enum(["standard", "creative", "professional"])
    .optional()
    .default("standard")
    .transform((val) => val.charAt(0).toUpperCase() + val.slice(1)),
  lang: langSchema.optional().default("en"),
});

/**
 * /api/feedback schema
 */
export const feedbackInputSchema = z.object({
  rating: ratingSchema,
  mode: z.string().max(50).optional(),
  caption: z.string().max(1000).optional(),
  hashtags: z.string().max(500).optional(),
  detected_object: z.string().max(200).optional(),
  lang: langSchema.optional().default("en"),
  variant: z.string().max(50).optional(),
});

/**
 * /api/wishlist schema
 */
export const wishlistInputSchema = z.object({
  email: emailSchema,
  note: z
    .string()
    .max(500, "Note too long (max 500 characters)")
    .optional(),
  lang: langSchema.optional().default("en"),
  variant: z
    .string()
    .max(50, "Variant too long")
    .optional(),
});

/**
 * /api/events schema
 */
export const eventInputSchema = z.object({
  event: z.enum([
    "generate_success",
    "copy_caption",
    "copy_all",
    "feedback_up",
    "feedback_down",
    "wish_submit",
  ], { message: "Invalid event type" }),
  props: z.object({
    session_id: z.string().max(120).optional(),
    source: z.string().max(120).optional(),
    medium: z.string().max(120).optional(),
    campaign: z.string().max(120).optional(),
    content: z.string().max(120).optional(),
    term: z.string().max(120).optional(),
    referrer: z.string().max(200).optional(),
    current_path: z.string().max(200).optional(),
    landing_path: z.string().max(200).optional(),
    lang: z.string().max(10).optional(),
    variant: z.string().max(80).optional(),
    mode: z.string().max(20).optional(),
    has_image: z.boolean().optional(),
  }).optional().default({}),
});

/**
 * /api/quota query schema
 */
export const quotaQuerySchema = z.object({
  check: z.string().optional(),
});

/**
 * Admin export query schema
 */
export const exportQuerySchema = z.object({
  token: z.string().min(1, "Token required").max(500),
  format: z.enum(["json", "csv"]).optional().default("json"),
  days: z.coerce
    .number()
    .min(1, "Days must be at least 1")
    .max(180, "Days must be at most 180")
    .optional()
    .default(30),
  source: z.string().max(120).optional(),
});

/**
 * Helper to validate request body and return proper error response
 */
export async function validateJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const rawBody = await request.json();
    const result = schema.safeParse(rawBody);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Validation failed",
        status: 400,
      };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Invalid JSON body", status: 400 };
  }
}

/**
 * Helper to validate query parameters
 */
export function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string; status: number } {
  const params = Object.fromEntries(url.searchParams);
  const result = schema.safeParse(params);

  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Invalid query parameters",
      status: 400,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Helper to validate form data (for multipart/form-data)
 */
export async function validateFormData<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T; files: Record<string, File> } | { success: false; error: string; status: number }> {
  try {
    const formData = await request.formData();
    const data: Record<string, string | File> = {};
    const files: Record<string, File> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value;
        // For schema validation, use empty string for files
        data[key] = "";
      } else {
        data[key] = value.toString();
      }
    }

    const result = schema.safeParse(data);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Validation failed",
        status: 400,
      };
    }

    return { success: true, data: result.data, files };
  } catch {
    return { success: false, error: "Invalid form data", status: 400 };
  }
}
