import { createServerClient } from "@supabase/ssr";

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(
    url,
    {
      // Empty cookies for admin client (Edge Runtime compatible)
      getAll: () => [],
      setAll: () => {},
    },
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    },
  );
}
