import Link from "next/link";
import { History, Sparkles } from "lucide-react";

import { PlayerProfileForm } from "@/components/auth/player-profile-form";
import { MatchHistoryCard } from "@/components/challenges/match-history-card";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { EloMovementList } from "@/components/elo/elo-movement-list";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getPlayerMatchHistory } from "@/lib/challenges/queries";
import { calculateWinrate, getLatestEloMovementsForUser } from "@/lib/elo/queries";
import { getLeagueSelectionOptions } from "@/lib/leagues/queries";
import { cn } from "@/lib/utils";

export default async function ProfilePage() {
  const { authUser, appUser, profile } = await requireCompletedProfile();
  const [leagueOptions, matchHistory, eloMovements] = await Promise.all([
    getLeagueSelectionOptions(),
    getPlayerMatchHistory({
      userId: appUser.id,
      limit: 8,
    }),
    getLatestEloMovementsForUser({
      userId: appUser.id,
      limit: 6,
    }),
  ]);
  const winrate = calculateWinrate(profile.wins, profile.matchesPlayed);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Perfil de jugador"
        title="Tu ficha en Mus League"
        description="Aqui ajustas tu identidad, tu zona principal y todo lo que ya has construido alrededor de tu ELO."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle>Editar perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerProfileForm
              mode="profile"
              leagueOptions={leagueOptions}
              initialValues={{
                displayName: appUser.displayName,
                avatarUrl: appUser.avatarUrl,
                bio: profile.bio,
                city: profile.city,
                preferredLeagueId: profile.preferredLeagueId,
                email: authUser.email ?? appUser.email,
              }}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Resumen actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">{appUser.displayName}</p>
                <p>{authUser.email ?? appUser.email}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    ELO
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                    {profile.elo}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Winrate
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                    {winrate}%
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Partidas
                  </p>
                  <p className="mt-1 font-medium text-foreground">{profile.matchesPlayed}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Victorias
                  </p>
                  <p className="mt-1 font-medium text-foreground">{profile.wins}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Derrotas
                  </p>
                  <p className="mt-1 font-medium text-foreground">{profile.losses}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Ubicacion habitual
                </p>
                <p>{profile.city}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Zona principal
                </p>
                <p>{profile.preferredLeague?.name ?? "Todavia no has elegido zona."}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Bio
                </p>
                <p>{profile.bio || "Aun no has escrito nada sobre tu estilo de juego."}</p>
              </div>
            </CardContent>
          </Card>

          <EloMovementList
            items={eloMovements}
            title="Ultimos movimientos de ELO"
            emptyLabel="Todavia no has movido tu ELO. Cuando cierres mesas confirmadas, lo veras reflejado aqui."
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-2xl font-semibold">Historial de partidas</h3>
          <p className="text-sm text-muted-foreground">{matchHistory.length} partidas visibles</p>
        </div>

        {matchHistory.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {matchHistory.map((match) => (
              <MatchHistoryCard key={match.id} match={match} viewerUserId={appUser.id} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<History className="size-5" />}
            eyebrow="Sin historial"
            title="Todavia no hay partidas en tu perfil"
            description="Cuando cierres una mesa confirmada, veras aqui los equipos, el marcador y como se movio tu ELO."
            action={
              <Link href="/matches" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
                Ir a retos
              </Link>
            }
          />
        )}
      </section>

      {matchHistory.length === 0 && eloMovements.length === 0 ? (
        <EmptyStateCard
          icon={<Sparkles className="size-5" />}
          eyebrow="Todo por jugar"
          title="Tu ficha esta lista para empezar"
          description="A partir de tu primera partida confirmada empezaran a crecer tu historial, tus estadisticas y tu ranking."
          compact
        />
      ) : null}
    </div>
  );
}
