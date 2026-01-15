import { createServerClient } from "@supabase/ssr";

const ADMIN_CACHE_TTL = 60000; // 1 minute cache
let cachedClient: ReturnType<typeof createServerClient> | null = null;
let cacheTime = 0;

export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  // Cache the admin client for performance (service client is stateless)
  const now = Date.now();
  if (cachedClient && now - cacheTime < ADMIN_CACHE_TTL) {
    return cachedClient;
  }

  const client = createServerClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });

  cachedClient = client;
  cacheTime = now;
  return client;
}
