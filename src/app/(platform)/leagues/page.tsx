import Link from "next/link";
import { MapPinned } from "lucide-react";

import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { LeagueTypeBadge } from "@/components/leagues/league-type-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeagueListItems } from "@/lib/leagues/queries";
import { cn } from "@/lib/utils";

export default async function LeaguesPage() {
  const leagues = await getLeagueListItems();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Zonas"
        title="Elige donde se juega tu Mus"
        description="Las zonas amplias organizan la comunidad y hacen mas facil encontrar rivales, retos y ranking cercano."
      />

      {leagues.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {leagues.map((league) => (
            <Link key={league.id} href={`/leagues/${league.slug}`}>
              <Card className="h-full border-border/70 bg-card/95 transition-transform hover:-translate-y-0.5">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeagueTypeBadge type={league.type} />
                    {league.parentName ? <Badge variant="outline">{league.parentName}</Badge> : null}
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{league.name}</CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {league.description ||
                        "Zona activa para encontrar jugadores, retos abiertos y clasificacion local."}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Jugadores
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold">
                      {league.playerCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Retos
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold">
                      {league.activeChallengeCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      Perfiles directos
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold">
                      {league.directPlayerCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={<MapPinned className="size-5" />}
          eyebrow="Sin zonas"
          title="Todavia no hay zonas visibles"
          description="Cuando haya zonas activas, aqui podras recorrer la comunidad y decidir donde te mueves."
          action={
            <Link
              href="/matches"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
            >
              Ver retos
            </Link>
          }
        />
      )}
    </div>
  );
}
