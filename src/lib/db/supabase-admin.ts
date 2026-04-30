import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";

const globalForSupabase = globalThis as typeof globalThis & {
  supabaseAdmin?: SupabaseClient;
};

export function getSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase admin credentials are not configured.");
  }

  if (!globalForSupabase.supabaseAdmin) {
    globalForSupabase.supabaseAdmin = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return globalForSupabase.supabaseAdmin;
}
