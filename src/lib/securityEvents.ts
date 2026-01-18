import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeString } from "@/lib/security";

type SecurityEventInput = {
  event_type: string;
  severity?: "info" | "warn" | "error";
  user_id?: string | null;
  ip?: string | null;
  path?: string | null;
  user_agent?: string | null;
  meta?: Record<string, unknown> | null;
};

export async function logSecurityEvent(input: SecurityEventInput) {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from("security_events").insert({
      event_type: sanitizeString(input.event_type).slice(0, 120),
      severity: input.severity ?? "info",
      user_id: input.user_id ?? null,
      ip: input.ip ? sanitizeString(input.ip).slice(0, 80) : null,
      path: input.path ? sanitizeString(input.path).slice(0, 200) : null,
      user_agent: input.user_agent
        ? sanitizeString(input.user_agent).slice(0, 200)
        : null,
      meta: input.meta ?? null,
    });
  } catch {
    // swallow errors for logging
  }
}
