import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  ensureAppUserFromAuthUser,
  getProfileWithLeagueByUserId,
  type AuthenticatedAppContext,
} from "@/lib/profile/profile";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";
export const ONBOARDING_PATH = "/onboarding";
export const DASHBOARD_PATH = "/dashboard";
export const PROFILE_PATH = "/profile";

function appendSearchParam(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function sanitizeRedirectPath(redirectTo?: string | null) {
  if (!redirectTo) {
    return null;
  }

  const trimmed = redirectTo.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.startsWith(LOGIN_PATH) || trimmed.startsWith(REGISTER_PATH)) {
    return null;
  }

  return trimmed;
}

export function withRedirectTo(path: string, redirectTo?: string | null) {
  const safeRedirectPath = sanitizeRedirectPath(redirectTo);

  if (!safeRedirectPath) {
    return path;
  }

  return appendSearchParam(path, "redirectTo", safeRedirectPath);
}

export async function getAuthenticatedAppContext(): Promise<AuthenticatedAppContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const appUser = await ensureAppUserFromAuthUser(authUser);
  const profile = await getProfileWithLeagueByUserId(appUser.id);

  return {
    authUser,
    appUser,
    profile,
  };
}

export async function requireAuthenticatedUser(redirectTo?: string | null) {
  const context = await getAuthenticatedAppContext();

  if (!context) {
    redirect(withRedirectTo(LOGIN_PATH, redirectTo));
  }

  return context;
}

export async function requireCompletedProfile(redirectTo?: string | null) {
  const context = await requireAuthenticatedUser(redirectTo);

  if (!context.profile || !context.profile.preferredLeagueId) {
    redirect(withRedirectTo(ONBOARDING_PATH, redirectTo));
  }

  return context as AuthenticatedAppContext & {
    profile: NonNullable<AuthenticatedAppContext["profile"]>;
  };
}

export async function redirectAuthenticatedUsers(redirectTo?: string | null) {
  const context = await getAuthenticatedAppContext();
  const safeRedirectPath = sanitizeRedirectPath(redirectTo);

  if (!context) {
    return;
  }

  if (!context.profile || !context.profile.preferredLeagueId) {
    redirect(withRedirectTo(ONBOARDING_PATH, safeRedirectPath));
  }

  redirect(safeRedirectPath ?? DASHBOARD_PATH);
}
