import "server-only";

import {
  type NotificationType,
  type Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

type NotificationDbClient = Prisma.TransactionClient | PrismaClient;

type CreateNotificationsInput = {
  recipientUserIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  actorUserId?: string | null;
};

export function truncateNotificationBody(value: string, maxLength = 140) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export async function createNotificationsForUserIds(
  db: NotificationDbClient,
  input: CreateNotificationsInput,
) {
  const recipientUserIds = [...new Set(input.recipientUserIds)]
    .map((userId) => userId.trim())
    .filter(Boolean)
    .filter((userId) => userId !== input.actorUserId);

  if (recipientUserIds.length === 0) {
    return 0;
  }

  const profiles = await db.playerProfile.findMany({
    where: {
      userId: {
        in: recipientUserIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (profiles.length === 0) {
    return 0;
  }

  await db.notification.createMany({
    data: profiles.map((profile) => ({
      playerProfileId: profile.id,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })),
  });

  return profiles.length;
}
