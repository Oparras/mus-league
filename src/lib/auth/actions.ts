"use server";

import { redirect } from "next/navigation";

import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  ONBOARDING_PATH,
  PROFILE_PATH,
  sanitizeRedirectPath,
  withRedirectTo,
} from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/auth/schemas";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";
import {
  ensureAppUserFromAuthUser,
  getProfileByUserId,
  savePlayerProfileForUser,
} from "@/lib/profile/profile";
import { playerProfileSchema } from "@/lib/profile/schemas";

function redirectWithMessage(
  path: string,
  kind: "error" | "message",
  message: string,
): never {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(kind, message);

  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

export async function loginAction(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(
    typeof formData.get("redirectTo") === "string"
      ? formData.get("redirectTo") as string
      : null,
  );
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      withRedirectTo(LOGIN_PATH, redirectTo),
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido iniciar sesion.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  const authUser = data.user;

  if (error || !authUser) {
    redirectWithMessage(
      withRedirectTo(LOGIN_PATH, redirectTo),
      "error",
      error?.message ?? "No hemos podido iniciar sesion con esas credenciales.",
    );
  }

  const appUser = await ensureAppUserFromAuthUser(authUser);
  const profile = await getProfileByUserId(appUser.id);

  if (!profile) {
    redirect(withRedirectTo(ONBOARDING_PATH, redirectTo));
  }

  redirect(redirectTo ?? DASHBOARD_PATH);
}

export async function registerAction(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(
    typeof formData.get("redirectTo") === "string"
      ? formData.get("redirectTo") as string
      : null,
  );
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      withRedirectTo("/register", redirectTo),
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido crear tu cuenta.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    redirectWithMessage(withRedirectTo("/register", redirectTo), "error", error.message);
  }

  const authUser = data.user;

  if (authUser) {
    await ensureAppUserFromAuthUser(authUser, {
      displayName: parsed.data.displayName,
    });
  }

  if (!data.session) {
    redirectWithMessage(
      withRedirectTo(LOGIN_PATH, redirectTo),
      "message",
      "Cuenta creada. Si necesitas confirmar el correo, revisa tu bandeja y despues inicia sesion para entrar en la mesa.",
    );
  }

  redirect(withRedirectTo(ONBOARDING_PATH, redirectTo));
}

async function saveProfile(formData: FormData, nextPath: string) {
  const parsed = playerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    avatarUrl: formData.get("avatarUrl"),
    bio: formData.get("bio"),
    city: formData.get("city"),
    preferredLeagueId: formData.get("preferredLeagueId"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      nextPath,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido guardar tu perfil.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(LOGIN_PATH);
  }

  await ensureAppUserFromAuthUser(authUser, {
    displayName: parsed.data.displayName,
    avatarUrl: parsed.data.avatarUrl ?? null,
  });
  await savePlayerProfileForUser(authUser.id, parsed.data);
}

export async function completeProfileAction(formData: FormData) {
  const redirectTo = sanitizeRedirectPath(
    typeof formData.get("redirectTo") === "string"
      ? formData.get("redirectTo") as string
      : null,
  );
  await saveProfile(formData, ONBOARDING_PATH);
  redirectWithMessage(
    redirectTo ?? PROFILE_PATH,
    "message",
    "Perfil listo. Ya puedes empezar a jugar.",
  );
}

export async function updateProfileAction(formData: FormData) {
  await saveProfile(formData, PROFILE_PATH);
  redirectWithMessage(PROFILE_PATH, "message", "Perfil actualizado correctamente.");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirectWithMessage(LOGIN_PATH, "message", "Has cerrado sesion.");
}
