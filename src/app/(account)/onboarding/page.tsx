import { redirect } from "next/navigation";

import { AccountPanel } from "@/components/auth/account-panel";
import { PlayerProfileForm } from "@/components/auth/player-profile-form";
import {
  PROFILE_PATH,
  requireAuthenticatedUser,
  sanitizeRedirectPath,
} from "@/lib/auth/session";
import { getLeagueSelectionOptions } from "@/lib/leagues/queries";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = sanitizeRedirectPath(resolvedSearchParams.redirectTo ?? null);
  const { authUser, appUser, profile } = await requireAuthenticatedUser(redirectTo);
  const leagueOptions = await getLeagueSelectionOptions();

  if (profile?.preferredLeagueId) {
    redirect(redirectTo ?? PROFILE_PATH);
  }

  return (
    <AccountPanel
      title="Completa tu perfil de jugador"
      description="Elige tu zona, indica desde donde sueles jugar y deja lista tu ficha para entrar en la comunidad."
      footer={
        <p>
          Cuenta activa: <span className="font-medium text-foreground">{authUser.email}</span>.
        </p>
      }
    >
      <PlayerProfileForm
        mode="onboarding"
        leagueOptions={leagueOptions}
        initialValues={{
          displayName: appUser.displayName,
          avatarUrl: appUser.avatarUrl,
          bio: profile?.bio ?? "",
          city: profile?.city ?? "",
          preferredLeagueId: profile?.preferredLeagueId ?? "",
          email: authUser.email ?? appUser.email,
        }}
        redirectTo={redirectTo}
      />
    </AccountPanel>
  );
}
