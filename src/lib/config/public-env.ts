import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

let cachedPublicEnv: z.infer<typeof publicEnvSchema> | null = null;

function normalizeOptionalEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getPublicEnv() {
  if (!cachedPublicEnv) {
    cachedPublicEnv = publicEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: normalizeOptionalEnv(process.env.NEXT_PUBLIC_APP_URL),
      NEXT_PUBLIC_SUPABASE_URL: normalizeOptionalEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: normalizeOptionalEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    });
  }

  return cachedPublicEnv;
}

export function getAppUrl() {
  return getPublicEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function hasSupabaseBrowserConfig() {
  const env = getPublicEnv();

  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
