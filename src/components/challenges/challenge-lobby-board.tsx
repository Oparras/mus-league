import { LobbyTeamSlot } from "@/generated/prisma/client";

import { SubmitButton } from "@/components/auth/submit-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignParticipantTeamAction, randomizeChallengeTeamsAction, startChallengeMatchAction } from "@/lib/challenges/actions";
import { getLobbyTeamLabel } from "@/lib/challenges/constants";
import { cn } from "@/lib/utils";

type LobbyParticipant = {
  id: string;
  user: {
    displayName: string;
    avatarUrl: string | null;
    profile: {
      city: string;
    } | null;
  };
};

function LobbyParticipantCard({
  challengeId,
  participant,
  editable,
}: {
  challengeId: string;
  participant: LobbyParticipant;
  editable: boolean;
}) {
  const initials = participant.user.displayName.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {participant.user.avatarUrl ? (
            <AvatarImage src={participant.user.avatarUrl} alt={participant.user.displayName} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{participant.user.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {participant.user.profile?.city ?? "Ubicacion habitual pendiente"}
          </p>
        </div>
      </div>

      {editable ? (
        <div className="grid grid-cols-3 gap-2">
          <form action={assignParticipantTeamAction}>
            <input type="hidden" name="challengeId" value={challengeId} />
            <input type="hidden" name="participantId" value={participant.id} />
            <input type="hidden" name="teamSlot" value="TEAM_A" />
            <Button type="submit" variant="outline" className="h-9 w-full rounded-xl text-xs">
              Equipo A
            </Button>
          </form>
          <form action={assignParticipantTeamAction}>
            <input type="hidden" name="challengeId" value={challengeId} />
            <input type="hidden" name="participantId" value={participant.id} />
            <input type="hidden" name="teamSlot" value="UNASSIGNED" />
            <Button type="submit" variant="ghost" className="h-9 w-full rounded-xl text-xs">
              Libre
            </Button>
          </form>
          <form action={assignParticipantTeamAction}>
            <input type="hidden" name="challengeId" value={challengeId} />
            <input type="hidden" name="participantId" value={participant.id} />
            <input type="hidden" name="teamSlot" value="TEAM_B" />
            <Button type="submit" variant="outline" className="h-9 w-full rounded-xl text-xs">
              Equipo B
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function TeamColumn({
  title,
  accentClassName,
  challengeId,
  editable,
  participants,
}: {
  title: string;
  accentClassName: string;
  challengeId: string;
  editable: boolean;
  participants: LobbyParticipant[];
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("size-3 rounded-full", accentClassName)} />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {participants.length > 0 ? (
          participants.map((participant) => (
            <LobbyParticipantCard
              key={participant.id}
              challengeId={challengeId}
              participant={participant}
              editable={editable}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-sm leading-6 text-muted-foreground">
            Todavia no hay jugadores asignados en este bloque.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChallengeLobbyBoard({
  challengeId,
  editable,
  canStart,
  teamA,
  teamB,
  unassigned,
}: {
  challengeId: string;
  editable: boolean;
  canStart: boolean;
  teamA: LobbyParticipant[];
  teamB: LobbyParticipant[];
  unassigned: LobbyParticipant[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <TeamColumn
          title={getLobbyTeamLabel(LobbyTeamSlot.TEAM_A)}
          accentClassName="bg-primary"
          challengeId={challengeId}
          editable={editable}
          participants={teamA}
        />
        <TeamColumn
          title="Jugadores sin equipo"
          accentClassName="bg-border"
          challengeId={challengeId}
          editable={editable}
          participants={unassigned}
        />
        <TeamColumn
          title={getLobbyTeamLabel(LobbyTeamSlot.TEAM_B)}
          accentClassName="bg-primary/60"
          challengeId={challengeId}
          editable={editable}
          participants={teamB}
        />
      </div>

      {editable ? (
        <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-card/80 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <form action={randomizeChallengeTeamsAction}>
            <input type="hidden" name="challengeId" value={challengeId} />
            <SubmitButton
              pendingLabel="Sacando reyes..."
              variant="outline"
              className="h-11 rounded-2xl px-5"
            >
              Aleatorizar equipos
            </SubmitButton>
          </form>
          <form action={startChallengeMatchAction}>
            <input type="hidden" name="challengeId" value={challengeId} />
            <SubmitButton
              pendingLabel="Iniciando partida..."
              className="h-11 rounded-2xl px-5"
              disabled={!canStart}
            >
              Confirmar equipos e iniciar partida
            </SubmitButton>
          </form>
          <p className="text-sm text-muted-foreground">
            {canStart
              ? "Los dos equipos ya estan listos. Al iniciar, la configuracion quedara cerrada."
              : "Necesitas dos jugadores por equipo antes de poner la mesa en juego."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
