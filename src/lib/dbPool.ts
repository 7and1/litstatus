import { createClient } from "@supabase/supabase-js";
import { withTiming } from "./performance";

// Database connection pool configuration
const DB_CONFIG = {
  maxRetries: 2,
  retryDelay: 500,
  connectionTimeout: 10000, // 10 seconds
};

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export function createSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }

    supabaseAdminInstance = createClient(url, key, {
      global: {
        headers: {
          "x-app-name": "litstatus-api",
        },
      },
    });
  }

  return supabaseAdminInstance;
}

// Execute database query with timing and retry logic
export async function dbQuery<T>(
  operation: string,
  fn: (client: ReturnType<typeof createClient>) => Promise<T>
): Promise<T> {
  return withTiming(`db.${operation}`, async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= DB_CONFIG.maxRetries; attempt++) {
      try {
        const client = createSupabaseAdmin();
        return await fn(client);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.message.includes("duplicate key") ||
            error.message.includes("foreign key") ||
            error.message.includes("not null"))
        ) {
          throw error;
        }

        // Wait before retrying
        if (attempt < DB_CONFIG.maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, DB_CONFIG.retryDelay * (attempt + 1))
          );
        }
      }
    }

    throw lastError || new Error("Database query failed");
  });
}

// Batch insert helper
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  batchSize = 100
): Promise<void> {
  const client = createSupabaseAdmin();

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await client.from(table).insert(batch as any);

    if (error) {
      console.error(`Batch insert failed for ${table}:`, error);
      throw error;
    }
  }
}
