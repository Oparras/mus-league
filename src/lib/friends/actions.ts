"use server";

import { redirect } from "next/navigation";

import { FriendshipStatus } from "@/generated/prisma/client";
import { requireCompletedProfile, sanitizeRedirectPath } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/db/prisma";
import { getFriendshipPairIds } from "@/lib/friends/queries";
import { z } from "zod";

const friendshipActionSchema = z.object({
  targetUserId: z.string().trim().min(1, "No hemos encontrado a ese jugador."),
  returnTo: z.string().trim().optional(),
});

function redirectWithMessage(
  path: string,
  kind: "error" | "message",
  message: string,
): never {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(kind, message);

  redirect(`${url.pathname}?${url.searchParams.toString()}`);
}

function resolveReturnTo(formData: FormData, fallbackPath: string) {
  const rawValue = typeof formData.get("returnTo") === "string" ? formData.get("returnTo") : null;

  return sanitizeRedirectPath(rawValue) ?? fallbackPath;
}

export async function sendFriendRequestAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/friends");
  const parsed = friendshipActionSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      returnTo,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido enviar la solicitud.",
    );
  }

  if (parsed.data.targetUserId === appUser.id) {
    redirectWithMessage(returnTo, "error", "No puedes enviarte una solicitud a ti mismo.");
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(appUser.id, parsed.data.targetUserId);
  const targetUser = await prisma.user.findUnique({
    where: {
      id: parsed.data.targetUserId,
    },
    select: {
      id: true,
      displayName: true,
    },
  });

  if (!targetUser) {
    redirectWithMessage(returnTo, "error", "Ese jugador ya no esta disponible.");
  }

  const existingFriendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
    select: {
      id: true,
      status: true,
      requesterId: true,
      addresseeId: true,
    },
  });

  if (existingFriendship?.status === FriendshipStatus.ACCEPTED) {
    redirectWithMessage(returnTo, "message", "Ya formabais parte de la misma lista de amigos.");
  }

  if (existingFriendship?.status === FriendshipStatus.PENDING) {
    if (existingFriendship.requesterId === appUser.id) {
      redirectWithMessage(returnTo, "message", "La solicitud ya esta enviada.");
    }

    redirectWithMessage(
      returnTo,
      "message",
      "Tienes una solicitud pendiente de este jugador. Puedes aceptarla desde Amigos.",
    );
  }

  if (existingFriendship) {
    await prisma.friendship.update({
      where: {
        id: existingFriendship.id,
      },
      data: {
        requesterId: appUser.id,
        addresseeId: parsed.data.targetUserId,
        blockerId: null,
        status: FriendshipStatus.PENDING,
        respondedAt: null,
      },
    });
  } else {
    await prisma.friendship.create({
      data: {
        ...pair,
        requesterId: appUser.id,
        addresseeId: parsed.data.targetUserId,
        status: FriendshipStatus.PENDING,
      },
    });
  }

  redirectWithMessage(
    returnTo,
    "message",
    `Solicitud enviada a ${targetUser.displayName}.`,
  );
}

export async function acceptFriendRequestAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/friends");
  const parsed = friendshipActionSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(returnTo, "error", "No hemos podido aceptar la solicitud.");
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(appUser.id, parsed.data.targetUserId);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
    include: {
      requester: {
        select: {
          displayName: true,
        },
      },
    },
  });

  if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
    redirectWithMessage(returnTo, "error", "Esa solicitud ya no esta pendiente.");
  }

  if (friendship.addresseeId !== appUser.id) {
    redirectWithMessage(returnTo, "error", "No puedes responder a esta solicitud.");
  }

  await prisma.friendship.update({
    where: {
      id: friendship.id,
    },
    data: {
      status: FriendshipStatus.ACCEPTED,
      respondedAt: new Date(),
      blockerId: null,
    },
  });

  redirectWithMessage(
    returnTo,
    "message",
    `${friendship.requester.displayName} ya forma parte de tus amigos.`,
  );
}

export async function rejectFriendRequestAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/friends");
  const parsed = friendshipActionSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(returnTo, "error", "No hemos podido rechazar la solicitud.");
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(appUser.id, parsed.data.targetUserId);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
  });

  if (!friendship || friendship.status !== FriendshipStatus.PENDING) {
    redirectWithMessage(returnTo, "error", "Esa solicitud ya no esta pendiente.");
  }

  if (friendship.addresseeId !== appUser.id) {
    redirectWithMessage(returnTo, "error", "No puedes rechazar esta solicitud.");
  }

  await prisma.friendship.update({
    where: {
      id: friendship.id,
    },
    data: {
      status: FriendshipStatus.REJECTED,
      respondedAt: new Date(),
    },
  });

  redirectWithMessage(returnTo, "message", "Solicitud rechazada.");
}

export async function removeFriendAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/friends");
  const parsed = friendshipActionSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(returnTo, "error", "No hemos podido actualizar tu lista de amigos.");
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(appUser.id, parsed.data.targetUserId);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
  });

  if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
    redirectWithMessage(returnTo, "error", "Ese jugador ya no estaba en tu lista de amigos.");
  }

  await prisma.friendship.delete({
    where: {
      id: friendship.id,
    },
  });

  redirectWithMessage(returnTo, "message", "Amistad eliminada.");
}
