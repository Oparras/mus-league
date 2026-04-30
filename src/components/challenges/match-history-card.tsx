import Link from "next/link";

import { ChallengeStatusBadge } from "@/components/challenges/challenge-status-badge";
import { MatchFormatBadge } from "@/components/challenges/match-format-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchHistoryItem } from "@/lib/challenges/queries";

function formatMatchDate(date: Date | null | undefined) {
  if (!date) {
    return "Pendiente";
  }

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

function getScoreLabel(match: MatchHistoryItem) {
  if (match.teamAScore === null || match.teamBScore === null) {
    return "Sin cerrar";
  }

  return `${match.teamAScore} - ${match.teamBScore}`;
}

function getTeamLine(match: MatchHistoryItem, slot: "TEAM_A" | "TEAM_B") {
  const team = match.matchTeams.find((item) => item.slot === slot);

  if (!team) {
    return slot === "TEAM_A" ? "Equipo A" : "Equipo B";
  }

  const players = team.players.map((player) => player.user.displayName).join(" / ");
  return `${team.name}: ${players}`;
}

function getMatchHref(match: MatchHistoryItem) {
  return match.challengeId ? `/matches/${match.challengeId}` : "/matches";
}

export function MatchHistoryCard({
  match,
  compact = false,
  viewerUserId,
}: {
  match: MatchHistoryItem;
  compact?: boolean;
  viewerUserId?: string;
}) {
  return (
    <Link href={getMatchHref(match)} className="block h-full">
      <Card className="h-full border-border/80 bg-card/95 transition-all hover:-translate-y-0.5 hover:ring-primary/20">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {match.challenge ? <ChallengeStatusBadge status={match.challenge.status} /> : null}
            {match.format ? <MatchFormatBadge format={match.format} /> : null}
          </div>
          <div className="space-y-2">
            <CardTitle className={compact ? "text-lg" : "text-2xl"}>
              {match.challenge?.locationName || match.league.name}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {match.description || "Partida cerrada y validada por ambos equipos."}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Marcador
              </p>
              <p className="mt-2 font-medium text-foreground">{getScoreLabel(match)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Enviado
              </p>
              <p className="mt-2 font-medium text-foreground">
                {formatMatchDate(match.submittedAt)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Confirmado
              </p>
              <p className="mt-2 font-medium text-foreground">
                {formatMatchDate(match.confirmedAt)}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>{getTeamLine(match, "TEAM_A")}</p>
            <p>{getTeamLine(match, "TEAM_B")}</p>
            {match.submittedBy ? (
              <p>
                Resultado enviado por{" "}
                <span className="text-foreground">{match.submittedBy.displayName}</span>
              </p>
            ) : null}
            {match.confirmedBy ? (
              <p>
                Resultado confirmado por{" "}
                <span className="text-foreground">{match.confirmedBy.displayName}</span>
              </p>
            ) : null}
            {match.challenge?.locationName ? (
              <p>
                Lugar: <span className="text-foreground">{match.challenge.locationName}</span>
              </p>
            ) : null}
            {match.disputeReason ? (
              <p>
                Motivo de disputa:{" "}
                <span className="text-foreground">{match.disputeReason}</span>
              </p>
            ) : null}
          </div>

          {match.eloHistory.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Movimiento de ELO
              </p>
              <div className="grid gap-2">
                {match.eloHistory.map((entry) => {
                  const isViewer = entry.playerProfile.userId === viewerUserId;

                  return (
                    <div
                      key={entry.id}
                      className={
                        isViewer
                          ? "flex items-center justify-between rounded-2xl border border-primary/35 bg-primary/10 px-3 py-2"
                          : "flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-3 py-2"
                      }
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.playerProfile.user.displayName}
                          {isViewer ? " (tu)" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.eloBefore} {"->"} {entry.eloAfter}
                        </p>
                      </div>
                      <p
                        className={
                          entry.delta >= 0
                            ? "font-semibold text-primary"
                            : "font-semibold text-destructive"
                        }
                      >
                        {formatDelta(entry.delta)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
