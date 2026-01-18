/**
 * Database security utilities
 * Prevents SQL injection and ensures safe database operations
 */

import { createSupabaseAdmin } from "./supabaseAdmin";

/**
 * Sanitize column names to prevent SQL injection
 * Only allows alphanumeric characters and underscores
 */
export function sanitizeColumnName(name: string): string {
  // Remove any character that's not alphanumeric or underscore
  const sanitized = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (sanitized !== name) {
    throw new Error(`Invalid column name: ${name}`);
  }
  return sanitized;
}

/**
 * Validate table name to prevent SQL injection
 */
export function validateTableName(name: string, allowedTables: readonly string[]): boolean {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return false;
  }
  return allowedTables.includes(name);
}

/**
 * Safe IN clause builder for Supabase queries
 * Prevents SQL injection in array operations
 */
export function buildSafeInClause(values: string[]): string {
  // Supabase handles this safely with their query builder
  // This is just a validation wrapper
  if (!Array.isArray(values)) {
    throw new Error("IN clause values must be an array");
  }
  if (values.length > 1000) {
    throw new Error("IN clause cannot exceed 1000 values");
  }
  return values.join(",");
}

/**
 * Validate sort direction to prevent SQL injection
 */
export function validateSortDirection(direction: string): "asc" | "desc" | null {
  const lower = direction.toLowerCase();
  if (lower === "asc" || lower === "ascending") return "asc";
  if (lower === "desc" || "descending") return "desc";
  return null;
}

/**
 * Allowed tables for whitelist validation
 */
export const ALLOWED_TABLES = [
  "profiles",
  "pro_wishlist",
  "feedback",
  "funnel_events",
  "security_events",
] as const;

/**
 * Validate and execute safe query
 */
export async function safeQuery<T = unknown>(
  tableName: string,
  query: (supabase: ReturnType<typeof createSupabaseAdmin>) => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  if (!validateTableName(tableName, ALLOWED_TABLES)) {
    return {
      data: null,
      error: new Error(`Invalid table name: ${tableName}`),
    };
  }

  const supabase = createSupabaseAdmin();
  return query(supabase);
}
