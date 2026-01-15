import { createSupabaseAdmin } from "./supabaseAdmin";

// Local User type for Edge Runtime compatibility
export type User = {
  id: string;
  email?: string;
};

export type AuthResult =
  | { success: true; user: User }
  | { success: false; user: null; error: "invalid_token" | "missing_token" };

export async function getUserFromRequest(
  request: Request,
): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user as unknown as User;
}

export async function getAuthResult(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return { success: false, user: null, error: "missing_token" };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { success: false, user: null, error: "invalid_token" };
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { success: false, user: null, error: "invalid_token" };
  }

  return { success: true, user: data.user as unknown as User };
}
