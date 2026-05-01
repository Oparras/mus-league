import Link from "next/link";
import { CalendarClock, Sparkles, Swords } from "lucide-react";

import { ChallengeCard } from "@/components/challenges/challenge-card";
import { CreateChallengeForm } from "@/components/challenges/create-challenge-form";
import { MatchHistoryCard } from "@/components/challenges/match-history-card";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getChallengeFeed, getRecentConfirmedMatches } from "@/lib/challenges/queries";
import { getAcceptedFriends } from "@/lib/friends/queries";
import { getLeagueSelectionOptions } from "@/lib/leagues/queries";
import { cn } from "@/lib/utils";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{
    zone?: string;
  }>;
}) {
  const { appUser, profile } = await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const leagueOptions = await getLeagueSelectionOptions();
  const selectedLeagueId = resolvedSearchParams.zone || "";
  const [challenges, recentConfirmedMatches, acceptedFriends] = await Promise.all([
    getChallengeFeed(selectedLeagueId || undefined),
    getRecentConfirmedMatches({
      leagueId: selectedLeagueId || undefined,
      limit: 4,
    }),
    getAcceptedFriends(appUser.id),
  ]);

  const openCount = challenges.filter((challenge) => challenge.status === "OPEN").length;
  const readyLobbies = challenges.filter((challenge) => challenge.participants.length === 4).length;
  const confirmedCount = recentConfirmedMatches.length;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <SectionHeading
            eyebrow="Retos abiertos"
            title="Tu tablon de mesas en juego"
            description="Filtra por zona, abre un reto nuevo y entra a las mesas que ya estan cogiendo forma."
          />
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Pulso del tablon</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Retos abiertos
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {openCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Equipos por cerrar
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {readyLobbies}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Partidas recientes
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {confirmedCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-end gap-3" action="/matches">
          <div className="space-y-2">
            <label htmlFor="zone" className="text-sm font-medium text-foreground">
              Zona
            </label>
            <Select id="zone" name="zone" defaultValue={selectedLeagueId} className="min-w-72">
              <option value="">Todas las zonas</option>
              {leagueOptions.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.pathLabel}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-2xl")}
          >
            Aplicar filtro
          </button>
        </form>

        <Link href="#create-challenge" className={cn(buttonVariants({ size: "lg" }), "rounded-2xl")}>
          Crear reto
        </Link>
      </section>

      <section id="create-challenge">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Crear reto</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateChallengeForm
              defaultLeagueId={selectedLeagueId || profile.preferredLeagueId}
              leagueOptions={leagueOptions}
              friendOptions={acceptedFriends.map((friend) => ({
                userId: friend.userId,
                displayName: friend.displayName,
                preferredLeagueName: friend.preferredLeagueName,
                city: friend.city,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-2xl font-semibold">Retos abiertos</h3>
          <p className="text-sm text-muted-foreground">{challenges.length} retos visibles</p>
        </div>

        {challenges.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Swords className="size-5" />}
            eyebrow="Sin retos"
            title="No hay retos abiertos para este filtro"
            description="Prueba otra zona o abre tu propia mesa para poner en marcha el tablero."
            action={
              <Link
                href="#create-challenge"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
              >
                Crear reto
              </Link>
            }
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-2xl font-semibold">Partidas recientes confirmadas</h3>
          <p className="text-sm text-muted-foreground">{recentConfirmedMatches.length} partidas</p>
        </div>

        {recentConfirmedMatches.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {recentConfirmedMatches.map((match) => (
              <MatchHistoryCard
                key={match.id}
                match={match}
                compact
                viewerUserId={appUser.id}
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<CalendarClock className="size-5" />}
            eyebrow="Sin historial"
            title="Todavia no hay partidas confirmadas aqui"
            description="Cuando una mesa se cierre y el rival confirme el resultado, la veras aparecer con marcador y movimiento de ELO."
            action={
              <Link
                href={profile.preferredLeagueId ? `/matches?zone=${profile.preferredLeagueId}` : "/matches"}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
              >
                Ver mi zona
              </Link>
            }
          />
        )}
      </section>

      {challenges.length === 0 && recentConfirmedMatches.length === 0 ? (
        <EmptyStateCard
          icon={<Sparkles className="size-5" />}
          eyebrow="Todo por abrir"
          title="Todavia no hay movimiento en esta zona"
          description="Puedes ser quien abra la primera mesa y marque el sitio para que el resto se sume."
          compact
        />
      ) : null}
    </div>
  );
}
