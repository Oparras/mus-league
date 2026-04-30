import { Trophy } from "lucide-react";

import { EmptyStateCard } from "@/components/common/empty-state-card";
import { RankingTable } from "@/components/elo/ranking-table";
import { SectionHeading } from "@/components/common/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getGlobalRanking, getZoneRanking } from "@/lib/elo/queries";
import { getLeagueSelectionOptions } from "@/lib/leagues/queries";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    zone?: string;
  }>;
}) {
  const { appUser, profile } = await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const leagueOptions = await getLeagueSelectionOptions();
  const selectedLeagueId = resolvedSearchParams.zone || profile.preferredLeagueId || "";
  const selectedLeague = leagueOptions.find((league) => league.id === selectedLeagueId) ?? null;
  const [globalRanking, zoneRanking] = await Promise.all([
    getGlobalRanking(20),
    getZoneRanking({
      leagueId: selectedLeagueId || undefined,
      limit: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <SectionHeading
            eyebrow="Ranking"
            title="La clasificacion que se gana mesa a mesa"
            description="Compara tu posicion global, filtra por zona y sigue quien esta marcando el ritmo en Mus League."
          />
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Filtrar por zona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/rankings" className="space-y-3">
              <label htmlFor="zone" className="text-sm font-medium text-foreground">
                Zona para ranking local
              </label>
              <Select id="zone" name="zone" defaultValue={selectedLeagueId}>
                <option value="">Solo ranking global</option>
                {leagueOptions.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.pathLabel}
                  </option>
                ))}
              </Select>
              <button
                type="submit"
                className="rounded-2xl border border-primary/35 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Aplicar zona
              </button>
            </form>

            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
              <p>
                Tu zona actual:{" "}
                <span className="font-medium text-foreground">
                  {profile.preferredLeague?.name ?? "Sin zona"}
                </span>
              </p>
              <p>
                Vista local:{" "}
                <span className="font-medium text-foreground">
                  {selectedLeague?.name ?? "Solo global"}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Jugadores en ranking</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground">
            {globalRanking.length}
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Mejor ELO global</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground">
            {globalRanking[0]?.elo ?? "--"}
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Jugadores de la zona</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-foreground">
            {selectedLeague ? zoneRanking.length : 0}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <RankingTable
          title="Ranking global"
          subtitle="Los jugadores que mas alto estan ahora mismo en Mus League."
          players={globalRanking}
          currentUserId={appUser.id}
          emptyLabel="Todavia no hay suficientes resultados confirmados para poblar el ranking global."
        />

        <RankingTable
          title={selectedLeague ? `Ranking de ${selectedLeague.name}` : "Ranking por zona"}
          subtitle={
            selectedLeague
              ? "Jugadores de la zona seleccionada ordenados por su ELO actual."
              : "Selecciona una zona para ver como se mueve la clasificacion local."
          }
          players={zoneRanking}
          currentUserId={appUser.id}
          emptyLabel="Selecciona una zona o espera a que empiecen a cerrarse partidas en ese territorio."
        />
      </section>

      {globalRanking.length === 0 && zoneRanking.length === 0 ? (
        <EmptyStateCard
          icon={<Trophy className="size-5" />}
          eyebrow="Sin clasificacion"
          title="Todavia no hay ranking que mover"
          description="En cuanto empiecen a confirmarse partidas, el ELO empezara a ordenar la clasificacion global y la de cada zona."
          compact
        />
      ) : null}
    </div>
  );
}
