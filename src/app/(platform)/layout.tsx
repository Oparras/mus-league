import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireCompletedProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { appUser, profile } = await requireCompletedProfile();

  return (
    <AppShell
      currentUser={{
        displayName: appUser.displayName,
        avatarUrl: appUser.avatarUrl,
        preferredZone: profile.preferredLeague?.name ?? "Zona por elegir",
      }}
    >
      {children}
    </AppShell>
  );
}
