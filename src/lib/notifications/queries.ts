import "server-only";

import { type Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  href: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationItem = Prisma.NotificationGetPayload<{
  select: typeof notificationSelect;
}>;

export async function getUnreadNotificationCountForUser(userId: string) {
  const prisma = getPrismaClient();

  return prisma.notification.count({
    where: {
      readAt: null,
      playerProfile: {
        is: {
          userId,
        },
      },
    },
  });
}

export async function getNotificationInboxForUser(options: {
  userId: string;
  limit?: number;
}) {
  const prisma = getPrismaClient();
  const notifications = await prisma.notification.findMany({
    where: {
      playerProfile: {
        is: {
          userId: options.userId,
        },
      },
    },
    select: notificationSelect,
    orderBy: {
      createdAt: "desc",
    },
    take: options.limit ?? 60,
  });

  return {
    unread: notifications.filter((notification) => !notification.readAt),
    read: notifications.filter((notification) => Boolean(notification.readAt)),
  };
}
