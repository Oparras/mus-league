import Link from "next/link";

import type { ChallengeFeedItem } from "@/lib/challenges/queries";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChallengeStatusBadge } from "@/components/challenges/challenge-status-badge";
import { MatchFormatBadge } from "@/components/challenges/match-format-badge";
import {
  formatChallengeProposedAt,
  getChallengeSeatsLabel,
} from "@/lib/challenges/links";

export function ChallengeCard({
  challenge,
  compact = false,
}: {
  challenge: ChallengeFeedItem;
  compact?: boolean;
}) {
  const seatsLabel = getChallengeSeatsLabel(challenge.participants.length);

  return (
    <Link href={`/matches/${challenge.id}`} className="block h-full">
      <Card className="h-full border-border/80 bg-card/95 transition-all hover:-translate-y-0.5 hover:ring-primary/20">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <ChallengeStatusBadge status={challenge.status} />
            <MatchFormatBadge format={challenge.matchFormat} />
          </div>
          <div className="space-y-2">
            <CardTitle className={compact ? "text-lg" : "text-2xl"}>
              {challenge.locationName || `Reto en ${challenge.league.name}`}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {challenge.description || "Mesa abierta para completar 2vs2 y dejar el resultado listo para confirmar."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Zona
              </p>
              <p className="mt-2 font-medium text-foreground">{challenge.league.name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Lugar
              </p>
              <p className="mt-2 font-medium text-foreground">
                {challenge.locationName || "Por concretar"}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Jugadores
              </p>
              <p className="mt-2 font-medium text-foreground">
                {challenge.participants.length}/4
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{seatsLabel}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Hora
              </p>
              <p className="mt-2 font-medium text-foreground">
                {formatChallengeProposedAt(challenge.proposedAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Creador
              </p>
              <p className="text-sm font-medium text-foreground">
                {challenge.creator.displayName}
              </p>
            </div>

            <AvatarGroup>
              {challenge.participants.map((participant) => (
                <Avatar key={participant.id} size="sm">
                  {participant.user.avatarUrl ? (
                    <AvatarImage
                      src={participant.user.avatarUrl}
                      alt={participant.user.displayName}
                    />
                  ) : null}
                  <AvatarFallback>
                    {participant.user.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
