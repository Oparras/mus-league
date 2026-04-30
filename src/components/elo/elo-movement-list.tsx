import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EloMovement } from "@/lib/elo/queries";

function formatMovementDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : delta.toString();
}

export function EloMovementList({
  items,
  title = "Ultimos movimientos de ELO",
  emptyLabel = "Todavia no hay movimientos de ELO para este jugador.",
}: {
  items: EloMovement[];
  title?: string;
  emptyLabel?: string;
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.match.challengeId ? `/matches/${item.match.challengeId}` : "/matches"}
                className="block rounded-2xl border border-border/70 bg-background/60 px-4 py-3 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.match.league.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.match.teamAScore !== null && item.match.teamBScore !== null
                        ? `${item.match.teamAScore} - ${item.match.teamBScore}`
                        : "Marcador pendiente"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {formatMovementDate(item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        item.delta >= 0
                          ? "font-heading text-2xl font-semibold text-primary"
                          : "font-heading text-2xl font-semibold text-destructive"
                      }
                    >
                      {formatDelta(item.delta)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.eloBefore} {"->"} {item.eloAfter}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
