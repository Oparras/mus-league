import "server-only";

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { getPrismaClient } from "@/lib/db/prisma";
import type { PlayerProfileInput } from "@/lib/profile/schemas";
import type { Prisma } from "@/generated/prisma/client";
import type { User as AppUser } from "@/generated/prisma/client";

function fallbackDisplayName(email?: string | null) {
  if (!email) {
    return "Jugador";
  }

  return email.split("@")[0]?.replace(/[._-]+/g, " ")?.trim() || "Jugador";
}

function metadataDisplayName(user: SupabaseAuthUser) {
  const rawDisplayName =
    user.user_metadata.display_name ??
    user.user_metadata.full_name ??
    user.user_metadata.name;

  return typeof rawDisplayName === "string" && rawDisplayName.trim().length > 0
    ? rawDisplayName.trim()
    : undefined;
}

function metadataAvatarUrl(user: SupabaseAuthUser) {
  const rawAvatar =
    user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null;

  return typeof rawAvatar === "string" && rawAvatar.trim().length > 0
    ? rawAvatar.trim()
    : null;
}

export async function ensureAppUserFromAuthUser(
  authUser: SupabaseAuthUser,
  overrides?: {
    displayName?: string;
    avatarUrl?: string | null;
  },
) {
  const prisma = getPrismaClient();
  const existingUser = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  const nextDisplayName =
    overrides?.displayName?.trim() ||
    existingUser?.displayName ||
    metadataDisplayName(authUser) ||
    fallbackDisplayName(authUser.email);

  const nextAvatarUrl =
    overrides?.avatarUrl !== undefined
      ? overrides.avatarUrl
      : existingUser?.avatarUrl || metadataAvatarUrl(authUser);

  if (existingUser) {
    return prisma.user.update({
      where: { id: authUser.id },
      data: {
        email: authUser.email ?? existingUser.email,
        displayName: nextDisplayName,
        avatarUrl: nextAvatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      id: authUser.id,
      email: authUser.email ?? `${authUser.id}@pending.local`,
      displayName: nextDisplayName,
      avatarUrl: nextAvatarUrl,
    },
  });
}

export async function getProfileByUserId(userId: string) {
  const prisma = getPrismaClient();

  return prisma.playerProfile.findUnique({
    where: { userId },
  });
}

export async function getProfileWithLeagueByUserId(userId: string) {
  const prisma = getPrismaClient();

  return prisma.playerProfile.findUnique({
    where: { userId },
    include: {
      preferredLeague: true,
    },
  });
}

export async function getAppUserById(userId: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function getAppUserWithProfile(userId: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });
}

export async function getPublicPlayerProfileByUserId(userId: string) {
  const prisma = getPrismaClient();

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          preferredLeague: true,
        },
      },
    },
  });
}

export async function savePlayerProfileForUser(
  userId: string,
  input: PlayerProfileInput,
) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        avatarUrl: input.avatarUrl ?? null,
      },
    });

    const profile = await tx.playerProfile.upsert({
      where: { userId },
      update: {
        bio: input.bio ?? null,
        city: input.city,
        preferredLeagueId: input.preferredLeagueId,
      },
      create: {
        userId,
        bio: input.bio ?? null,
        city: input.city,
        preferredLeagueId: input.preferredLeagueId,
      },
    });

    return { user, profile };
  });
}

export type AuthenticatedAppContext = {
  appUser: AppUser;
  profile: PlayerProfileWithLeague | null;
  authUser: SupabaseAuthUser;
};

export type PlayerProfileWithLeague = Prisma.PlayerProfileGetPayload<{
  include: {
    preferredLeague: true;
  };
}>;
