import Link from "next/link";
import { History, MapPinned, Trophy, Users } from "lucide-react";

import { MatchHistoryCard } from "@/components/challenges/match-history-card";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { RankingTable } from "@/components/elo/ranking-table";
import { LeagueTypeBadge } from "@/components/leagues/league-type-badge";
import { PlayerCard } from "@/components/leagues/player-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getRecentConfirmedMatches } from "@/lib/challenges/queries";
import { getZoneRanking } from "@/lib/elo/queries";
import {
  getLeagueBySlugOrThrow,
  getPlayersForLeagueScope,
} from "@/lib/leagues/queries";

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { appUser } = await requireCompletedProfile();
  const { slug } = await params;
  const league = await getLeagueBySlugOrThrow(slug);
  const [players, zoneRanking, recentMatches] = await Promise.all([
    getPlayersForLeagueScope(league.id),
    getZoneRanking({
      leagueId: league.id,
      limit: 8,
    }),
    getRecentConfirmedMatches({
      scopeLeagueId: league.id,
      limit: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <LeagueTypeBadge type={league.type} />
              {league.parent ? (
                <Link href={`/leagues/${league.parent.slug}`}>
                  <Badge variant="outline">{league.parent.name}</Badge>
                </Link>
              ) : null}
            </div>
            <SectionHeading
              eyebrow="Zona de juego"
              title={league.name}
              description={
                league.description ||
                "Aqui se cruzan jugadores, retos activos, partidas recientes y el ranking de la zona."
              }
            />
          </div>
        </div>

        <Card className="h-full border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Resumen de la zona</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Jugadores
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold">{players.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Ranking visible
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {zoneRanking.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Partidas recientes
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {recentMatches.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold">Jugadores de la zona</h2>
            <Badge variant="secondary">{players.length} perfiles visibles</Badge>
          </div>

          {players.length > 0 ? (
            <div className="grid gap-4">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  displayName={player.user.displayName}
                  avatarUrl={player.user.avatarUrl}
                  city={player.city}
                  zoneName={player.preferredLeague?.name}
                  zoneSlug={player.preferredLeague?.slug}
                  bio={player.bio}
                />
              ))}
            </div>
          ) : (
            <EmptyStateCard
              icon={<Users className="size-5" />}
              eyebrow="Sin jugadores"
              title="Todavia no hay jugadores en esta zona"
              description="En cuanto mas perfiles la usen como base, empezaras a ver aqui a tus proximos rivales."
              compact
            />
          )}
        </div>

        <div className="grid gap-4">
          <RankingTable
            title="Ranking de la zona"
            subtitle="La clasificacion local ordenada por ELO y resultados confirmados."
            players={zoneRanking}
            currentUserId={appUser.id}
            emptyLabel="Todavia no hay suficientes partidas confirmadas para ordenar esta zona."
          />

          {recentMatches.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" />
                <h3 className="font-heading text-xl font-semibold">Partidas recientes</h3>
              </div>
              <div className="grid gap-4">
                {recentMatches.map((match) => (
                  <MatchHistoryCard
                    key={match.id}
                    match={match}
                    compact
                    viewerUserId={appUser.id}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyStateCard
              icon={<Trophy className="size-5" />}
              eyebrow="Sin historial"
              title="Aun no hay partidas confirmadas en esta zona"
              description="Cuando las mesas empiecen a cerrarse, veras aqui resultados, parejas y cambios de ELO."
              compact
            />
          )}

          {league.children.length > 0 ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Subzonas activas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {league.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/leagues/${child.slug}`}
                    className="block rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-secondary/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-foreground">{child.name}</span>
                      <LeagueTypeBadge type={child.type} />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : (
            <EmptyStateCard
              icon={<MapPinned className="size-5" />}
              eyebrow="Zona principal"
              title="Esta zona funciona como base amplia de juego"
              description="Los retos pueden concretar municipio, bar o punto de encuentro sin dejar de contar dentro de esta zona."
              compact
            />
          )}
        </div>
      </section>
    </div>
  );
}
