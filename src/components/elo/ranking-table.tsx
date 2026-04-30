import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RankingProfile } from "@/lib/elo/queries";

function getWinrate(wins: number, matchesPlayed: number) {
  if (matchesPlayed <= 0) {
    return 0;
  }

  return Math.round((wins / matchesPlayed) * 100);
}

export function RankingTable({
  title,
  subtitle,
  players,
  currentUserId,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  players: RankingProfile[];
  currentUserId?: string;
  emptyLabel: string;
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-2">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        {players.length > 0 ? (
          <div className="space-y-3">
            {players.map((player, index) => {
              const highlighted = player.userId === currentUserId;

              return (
                <div
                  key={player.id}
                  className={
                    highlighted
                      ? "rounded-2xl border border-primary/45 bg-primary/10 px-4 py-3"
                      : "rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full border border-border/70 bg-background/70 text-sm font-semibold text-foreground">
                        {index + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          {player.user.displayName}
                          {highlighted ? " (tu)" : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {player.preferredLeague ? (
                            <Link
                              href={`/leagues/${player.preferredLeague.slug}`}
                              className="underline-offset-4 hover:underline"
                            >
                              {player.preferredLeague.name}
                            </Link>
                          ) : (
                            "Sin zona asignada"
                          )}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {player.wins}-{player.losses} / {player.matchesPlayed} partidas /{" "}
                          {getWinrate(player.wins, player.matchesPlayed)}% de victorias
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-3xl font-semibold text-foreground">
                        {player.elo}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        ELO
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
