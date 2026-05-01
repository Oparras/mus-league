"use server";

import { redirect } from "next/navigation";

import { requireCompletedProfile, sanitizeRedirectPath } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/db/prisma";
import { z } from "zod";

const notificationIdSchema = z.object({
  notificationId: z.string().trim().min(1, "No hemos encontrado esa notificacion."),
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

export async function markNotificationAsReadAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/notifications");
  const parsed = notificationIdSchema.safeParse({
    notificationId: formData.get("notificationId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      returnTo,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido actualizar la notificacion.",
    );
  }

  const prisma = getPrismaClient();
  const notification = await prisma.notification.findFirst({
    where: {
      id: parsed.data.notificationId,
      playerProfile: {
        is: {
          userId: appUser.id,
        },
      },
    },
    select: {
      id: true,
      readAt: true,
    },
  });

  if (!notification) {
    redirectWithMessage(returnTo, "error", "Esa notificacion ya no esta disponible.");
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  redirect(returnTo);
}

export async function markAllNotificationsAsReadAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/notifications");
  const prisma = getPrismaClient();

  await prisma.notification.updateMany({
    where: {
      readAt: null,
      playerProfile: {
        is: {
          userId: appUser.id,
        },
      },
    },
    data: {
      readAt: new Date(),
    },
  });

  redirectWithMessage(returnTo, "message", "Todas tus notificaciones quedan marcadas como leidas.");
}

export async function openNotificationAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const returnTo = resolveReturnTo(formData, "/notifications");
  const parsed = notificationIdSchema.safeParse({
    notificationId: formData.get("notificationId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      returnTo,
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido abrir la notificacion.",
    );
  }

  const prisma = getPrismaClient();
  const notification = await prisma.notification.findFirst({
    where: {
      id: parsed.data.notificationId,
      playerProfile: {
        is: {
          userId: appUser.id,
        },
      },
    },
    select: {
      id: true,
      href: true,
      readAt: true,
    },
  });

  if (!notification) {
    redirectWithMessage(returnTo, "error", "Esa notificacion ya no esta disponible.");
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  redirect(sanitizeRedirectPath(notification.href) ?? "/notifications");
}
