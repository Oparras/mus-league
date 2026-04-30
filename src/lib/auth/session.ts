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

export async function requireAuthenticatedUser() {
  const context = await getAuthenticatedAppContext();

  if (!context) {
    redirect(LOGIN_PATH);
  }

  return context;
}

export async function requireCompletedProfile() {
  const context = await requireAuthenticatedUser();

  if (!context.profile || !context.profile.preferredLeagueId) {
    redirect(ONBOARDING_PATH);
  }

  return context as AuthenticatedAppContext & {
    profile: NonNullable<AuthenticatedAppContext["profile"]>;
  };
}

export async function redirectAuthenticatedUsers() {
  const context = await getAuthenticatedAppContext();

  if (!context) {
    return;
  }

  if (!context.profile || !context.profile.preferredLeagueId) {
    redirect(ONBOARDING_PATH);
  }

  redirect(DASHBOARD_PATH);
}
