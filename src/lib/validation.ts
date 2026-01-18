import { NextResponse } from "next/server";
import { SECURITY_HEADERS } from "./security";
import { withTiming } from "./performance";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  status?: number;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  enum?: string[];
  validate?: (value: unknown) => boolean;
}

export async function validateRequest(
  body: Record<string, unknown>,
  rules: ValidationRule[],
  t: (en: string, zh: string) => (s: string) => string = (en) => (s) => s
): Promise<ValidationResult> {
  return withTiming("validation.validateRequest", async () => {
    for (const rule of rules) {
      const value = body[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === "")) {
        return {
          valid: false,
          error: t("Missing required field", "缺少必填字段")(`Field: ${rule.field}`),
          status: 400,
        };
      }

      // Skip validation if field is optional and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type checks
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        return {
          valid: false,
          error: t("Invalid field type", "字段类型无效")(`Field: ${rule.field}`),
          status: 400,
        };
      }

      const strValue = String(value);

      // Length checks
      if (rule.minLength && strValue.length < rule.minLength) {
        return {
          valid: false,
          error: t(
            "Field too short",
            "字段过短"
          )(`Field: ${rule.field}, Min: ${rule.minLength}`),
          status: 400,
        };
      }

      if (rule.maxLength && strValue.length > rule.maxLength) {
        return {
          valid: false,
          error: t(
            "Field too long",
            "字段过长"
          )(`Field: ${rule.field}, Max: ${rule.maxLength}`),
          status: 400,
        };
      }

      // Pattern checks
      if (rule.pattern && !rule.pattern.test(strValue)) {
        return {
          valid: false,
          error: t("Invalid field format", "字段格式无效")(`Field: ${rule.field}`),
          status: 400,
        };
      }

      // Enum checks
      if (rule.enum && !rule.enum.includes(strValue)) {
        return {
          valid: false,
          error: t("Invalid field value", "字段值无效")(`Field: ${rule.field}`),
          status: 400,
        };
      }

      // Custom validation
      if (rule.validate && !rule.validate(value)) {
        return {
          valid: false,
          error: t("Field validation failed", "字段验证失败")(`Field: ${rule.field}`),
          status: 400,
        };
      }
    }

    return { valid: true };
  });
}

// Common validation rules
export const COMMON_VALIDATION_RULES = {
  email: {
    field: "email",
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
  } as ValidationRule,

  rating: {
    field: "rating",
    required: true,
    enum: ["1", "-1"],
  } as ValidationRule,

  mode: {
    field: "mode",
    required: false,
    enum: ["Standard", "Creative", "Professional"],
  } as ValidationRule,

  lang: {
    field: "lang",
    required: false,
    enum: ["en", "zh"],
  } as ValidationRule,
};

// Validation middleware wrapper
export function withValidation<T>(
  rules: ValidationRule[],
  handler: (body: T) => Promise<NextResponse>,
  t?: (en: string, zh: string) => (s: string) => string
) {
  return async (request: Request): Promise<NextResponse> => {
    try {
      const body = await request.json().catch(() => ({}));

      const translator = t || ((en) => (zh) => en);
      const validation = await validateRequest(body, rules, translator);

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Validation failed" },
          {
            status: validation.status || 400,
            headers: SECURITY_HEADERS,
          }
        );
      }

      return await handler(body as T);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        {
          status: 400,
          headers: SECURITY_HEADERS,
        }
      );
    }
  };
}
