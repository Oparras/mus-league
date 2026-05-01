"use server";

import { redirect } from "next/navigation";

import {
  ConversationType,
  FriendshipStatus,
  NotificationType,
} from "@/generated/prisma/client";
import { requireCompletedProfile, sanitizeRedirectPath } from "@/lib/auth/session";
import { ensureDirectConversation } from "@/lib/chat/service";
import { getPrismaClient } from "@/lib/db/prisma";
import { getFriendshipPairIds } from "@/lib/friends/queries";
import {
  createNotificationsForUserIds,
  truncateNotificationBody,
} from "@/lib/notifications/service";
import { z } from "zod";

const openDirectConversationSchema = z.object({
  targetUserId: z.string().trim().min(1, "No hemos encontrado a ese jugador."),
});

const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1, "Falta la conversacion."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe un mensaje antes de enviarlo.")
    .max(600, "El mensaje no puede superar los 600 caracteres."),
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
  const returnToValue = formData.get("returnTo");
  const rawValue = typeof returnToValue === "string" ? returnToValue : null;

  return sanitizeRedirectPath(rawValue) ?? fallbackPath;
}

export async function openDirectConversationAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = openDirectConversationSchema.safeParse({
    targetUserId: formData.get("targetUserId"),
  });
  const fallbackPath = resolveReturnTo(formData, "/friends");

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido abrir el chat.",
    );
  }

  if (parsed.data.targetUserId === appUser.id) {
    redirectWithMessage(fallbackPath, "error", "No puedes abrir un chat contigo mismo.");
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(appUser.id, parsed.data.targetUserId);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
    select: {
      status: true,
    },
  });

  if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
    redirectWithMessage(
      fallbackPath,
      "error",
      "Solo puedes abrir chat directo con jugadores que ya son amigos tuyos.",
    );
  }

  const conversation = await prisma.$transaction(async (tx) =>
    ensureDirectConversation(tx, appUser.id, parsed.data.targetUserId),
  );

  redirect(`/chat?conversation=${conversation.id}`);
}

export async function sendConversationMessageAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const fallbackPath = resolveReturnTo(formData, "/chat");
  const parsed = sendMessageSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      fallbackPath,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido enviar el mensaje.",
    );
  }

  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: {
        id: parsed.data.conversationId,
        participants: {
          some: {
            userId: appUser.id,
          },
        },
      },
      select: {
        id: true,
        type: true,
        challenge: {
          select: {
            id: true,
            locationName: true,
            league: {
              select: {
                name: true,
              },
            },
          },
        },
        participants: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      redirectWithMessage(
        fallbackPath,
        "error",
        "No tienes acceso a esta conversacion o ya no existe.",
      );
    }

    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: appUser.id,
        body: parsed.data.body,
      },
    });

    const title =
      conversation.type === ConversationType.DIRECT
        ? `Nuevo mensaje de ${appUser.displayName}`
        : conversation.challenge?.locationName
          ? `Nuevo mensaje en ${conversation.challenge.locationName}`
          : `Nuevo mensaje en ${conversation.challenge?.league.name ?? "tu mesa"}`;

    await createNotificationsForUserIds(tx, {
      recipientUserIds: conversation.participants.map((participant) => participant.userId),
      actorUserId: appUser.id,
      type: NotificationType.CHAT_MESSAGE,
      title,
      body: truncateNotificationBody(parsed.data.body),
      href: `/chat?conversation=${conversation.id}`,
    });
  });

  redirect(fallbackPath);
}
