import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;

function normalizeOptionalEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getServerEnv() {
  if (!cachedServerEnv) {
    cachedServerEnv = serverEnvSchema.parse({
      DATABASE_URL: normalizeOptionalEnv(process.env.DATABASE_URL),
      DIRECT_URL: normalizeOptionalEnv(process.env.DIRECT_URL),
      NEXT_PUBLIC_SUPABASE_URL: normalizeOptionalEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeOptionalEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: normalizeOptionalEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  }

  return cachedServerEnv;
}

export function getRuntimeStatus() {
  const env = getServerEnv();

  return {
    database: Boolean(env.DATABASE_URL),
    directDatabase: Boolean(env.DIRECT_URL),
    supabaseBrowser: Boolean(
      env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseAdmin: Boolean(
      env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };
}
