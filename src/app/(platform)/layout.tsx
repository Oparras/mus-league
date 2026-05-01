import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getUnreadNotificationCountForUser } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { appUser, profile } = await requireCompletedProfile();
  const unreadNotificationCount = await getUnreadNotificationCountForUser(appUser.id);

  return (
    <AppShell
      currentUser={{
        displayName: appUser.displayName,
        avatarUrl: appUser.avatarUrl,
        preferredZone: profile.preferredLeague?.name ?? "Zona por elegir",
      }}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
