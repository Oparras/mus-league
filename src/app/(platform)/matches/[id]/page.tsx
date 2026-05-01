import Link from "next/link";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { ChallengeLobbyBoard } from "@/components/challenges/challenge-lobby-board";
import { ChallengeStatusBadge } from "@/components/challenges/challenge-status-badge";
import { MatchFormatBadge } from "@/components/challenges/match-format-badge";
import { ShareLinkActions } from "@/components/common/share-link-actions";
import { MatchResultForm } from "@/components/challenges/match-result-form";
import { SectionHeading } from "@/components/common/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireCompletedProfile } from "@/lib/auth/session";
import {
  confirmMatchResultAction,
  disputeMatchResultAction,
  joinChallengeAction,
  leaveChallengeAction,
} from "@/lib/challenges/actions";
import {
  formatChallengeProposedAt,
  getChallengeInvitePath,
  getChallengePath,
  getChallengeSeatsLabel,
} from "@/lib/challenges/links";
import {
  getChallengeByIdOrThrow,
  groupParticipantsByTeam,
  isChallengeJoinable,
  isChallengeLobbyEditable,
} from "@/lib/challenges/queries";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { appUser } = await requireCompletedProfile();
  const { id } = await params;
  const challenge = await getChallengeByIdOrThrow(id);

  const viewerIsParticipant = challenge.participants.some(
    (participant) => participant.userId === appUser.id,
  );
  const participantCount = challenge.participants.length;
  const canJoin =
    !viewerIsParticipant &&
    participantCount < 4 &&
    isChallengeJoinable(challenge.status);
  const canLeave =
    viewerIsParticipant &&
    !challenge.teamsLockedAt &&
    challenge.status !== "IN_PROGRESS" &&
    challenge.status !== "TEAMS_LOCKED";
  const canEditLobby =
    viewerIsParticipant &&
    participantCount === 4 &&
    isChallengeLobbyEditable(challenge.status);
  const groupedParticipants = groupParticipantsByTeam(challenge.participants);
  const canStart =
    groupedParticipants.teamA.length === 2 &&
    groupedParticipants.teamB.length === 2 &&
    groupedParticipants.unassigned.length === 0;
  const showLobby = participantCount === 4 && viewerIsParticipant;
  const seatsLabel = getChallengeSeatsLabel(participantCount);
  const hasInviteCode = Boolean(challenge.inviteCode);
  const invitePath = challenge.inviteCode
    ? getChallengeInvitePath(challenge.inviteCode)
    : getChallengePath(challenge.id);
  const viewerTeamSlot =
    challenge.participants.find((participant) => participant.userId === appUser.id)?.teamSlot ??
    null;
  const submittedByTeamSlot = challenge.match?.submittedById
    ? challenge.participants.find(
        (participant) => participant.userId === challenge.match?.submittedById,
      )?.teamSlot ?? null
    : null;
  const viewerCanReviewResult =
    challenge.status === "RESULT_SUBMITTED" &&
    viewerIsParticipant &&
    challenge.match?.submittedById !== appUser.id &&
    viewerTeamSlot !== null &&
    submittedByTeamSlot !== null &&
    viewerTeamSlot !== submittedByTeamSlot;
  const showResultForm =
    challenge.status === "IN_PROGRESS" && viewerIsParticipant && Boolean(challenge.match);
  const showResultSummary =
    Boolean(challenge.match) &&
    (challenge.status === "RESULT_SUBMITTED" ||
      challenge.status === "CONFIRMED" ||
      challenge.status === "DISPUTED");

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/80 bg-card/95 p-8 shadow-sm">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ChallengeStatusBadge status={challenge.status} />
              <MatchFormatBadge format={challenge.matchFormat} />
              <Link
                href={`/leagues/${challenge.league.slug}`}
                className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {challenge.league.name}
              </Link>
            </div>
            <SectionHeading
              eyebrow="Detalle del reto"
              title={challenge.locationName || `Reto en ${challenge.league.name}`}
              description={
                challenge.description ||
                "Mesa abierta para completar equipos, jugar y dejar el resultado cerrado entre ambos equipos."
              }
            />
          </div>
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Estado de la mesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Creador</p>
              <p className="mt-1 font-medium text-foreground">{challenge.creator.displayName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Zona</p>
              <p className="mt-1 font-medium text-foreground">{challenge.league.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Lugar propuesto</p>
              <p className="mt-1 font-medium text-foreground">
                {challenge.locationName || "Por concretar"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Fecha y hora</p>
              <p className="mt-1 font-medium text-foreground">
                {formatChallengeProposedAt(challenge.proposedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Plazas</p>
              <p className="mt-1 font-medium text-foreground">
                {participantCount}/4
              </p>
              <p>{seatsLabel}</p>
            </div>

            {canJoin ? (
              <form action={joinChallengeAction}>
                <input type="hidden" name="challengeId" value={challenge.id} />
                <SubmitButton pendingLabel="Uniendote..." className="h-11 rounded-2xl px-5">
                  Unirse
                </SubmitButton>
              </form>
            ) : null}

            {canLeave ? (
              <form action={leaveChallengeAction}>
                <input type="hidden" name="challengeId" value={challenge.id} />
                <SubmitButton
                  pendingLabel="Saliendo..."
                  variant="outline"
                  className="h-11 rounded-2xl px-5"
                >
                  Abandonar
                </SubmitButton>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-2xl font-semibold">Jugadores apuntados</h3>
            <p className="text-sm text-muted-foreground">{participantCount} de 4 plazas</p>
          </div>

          {participantCount > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {challenge.participants.map((participant) => (
                <Card key={participant.id} className="border-border/80 bg-card/95">
                  <CardContent className="flex items-center gap-4 pt-4">
                    <Avatar size="lg">
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
                    <div className="min-w-0">
                      <Link
                        href={
                          participant.userId === appUser.id
                            ? "/profile"
                            : `/players/${participant.userId}`
                        }
                        className="truncate font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {participant.user.displayName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {participant.user.profile?.city ?? "Ubicacion habitual pendiente"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-primary">
                        Asiento {participant.seatIndex}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/80 bg-card/95">
              <CardContent className="pt-4 text-sm leading-6 text-muted-foreground">
                Este reto todavia no tiene jugadores apuntados.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Invitar amigos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Comparte este enlace con tus amigos para completar la mesa mas rapido.</p>
              <p className="font-medium text-foreground">{seatsLabel}</p>
              <ShareLinkActions
                primaryPath={invitePath}
                primaryLabel={hasInviteCode ? "Copiar invitacion" : "Copiar enlace del reto"}
                secondaryPath={hasInviteCode ? getChallengePath(challenge.id) : undefined}
                secondaryLabel={hasInviteCode ? "Copiar enlace del reto" : undefined}
                whatsappPath={invitePath}
                whatsappText={`Te invito a una mesa de Mus League en ${challenge.league.name}.`}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Como funciona esta mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>La mesa admite un maximo de cuatro jugadores.</p>
              <p>Solo quienes participan pueden configurar equipos y mover el lobby.</p>
              <p>Cuando empieza la partida, los equipos quedan bloqueados.</p>
              <p>El resultado tiene que confirmarlo el otro equipo para entrar en historial.</p>
            </CardContent>
          </Card>

          {showResultSummary && challenge.match ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Resumen del resultado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Marcador:{" "}
                  <span className="font-medium text-foreground">
                    {challenge.match.teamAScore} - {challenge.match.teamBScore}
                  </span>
                </p>
                <p>
                  Ganador:{" "}
                  <span className="font-medium text-foreground">
                    {challenge.match.winnerTeamSlot === "TEAM_A" ? "Equipo A" : "Equipo B"}
                  </span>
                </p>
                {challenge.match.submittedBy ? (
                  <p>
                    Resultado enviado por{" "}
                    <span className="text-foreground">{challenge.match.submittedBy.displayName}</span>
                  </p>
                ) : null}
                {challenge.match.confirmedBy ? (
                  <p>
                    Resultado confirmado por{" "}
                    <span className="text-foreground">{challenge.match.confirmedBy.displayName}</span>
                  </p>
                ) : null}
                {challenge.match.disputeReason ? (
                  <p>
                    Motivo de disputa:{" "}
                    <span className="text-foreground">{challenge.match.disputeReason}</span>
                  </p>
                ) : null}
                {challenge.match.eloHistory.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">
                      Movimiento de ELO
                    </p>
                    {challenge.match.eloHistory.map((entry) => (
                      <p key={entry.id}>
                        <span className="text-foreground">
                          {entry.playerProfile.user.displayName}
                        </span>{" "}
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta} (
                        {entry.eloBefore} -&gt; {entry.eloAfter})
                      </p>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {showResultForm && challenge.match ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Registrar resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <MatchResultForm
                  challengeId={challenge.id}
                  format={challenge.match.format ?? challenge.matchFormat}
                />
              </CardContent>
            </Card>
          ) : null}

          {viewerCanReviewResult ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Revision del rival</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={confirmMatchResultAction}>
                  <input type="hidden" name="challengeId" value={challenge.id} />
                  <SubmitButton pendingLabel="Confirmando..." className="h-11 rounded-2xl px-5">
                    Confirmar resultado
                  </SubmitButton>
                </form>

                <form action={disputeMatchResultAction} className="space-y-3">
                  <input type="hidden" name="challengeId" value={challenge.id} />
                  <label htmlFor="disputeReason" className="text-sm font-medium text-foreground">
                    Motivo de disputa
                  </label>
                  <Textarea
                    id="disputeReason"
                    name="disputeReason"
                    placeholder="Explica brevemente por que el marcador no coincide con lo que ocurrio en la mesa."
                    className="min-h-24"
                  />
                  <SubmitButton
                    pendingLabel="Enviando disputa..."
                    variant="outline"
                    className="h-11 rounded-2xl px-5"
                  >
                    Disputar resultado
                  </SubmitButton>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {challenge.status === "CONFIRMED" ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Partida confirmada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>El resultado ya esta confirmado y forma parte del historial de la mesa.</p>
                <p>El ELO y las estadisticas de los cuatro jugadores ya se han actualizado.</p>
              </CardContent>
            </Card>
          ) : null}

          {challenge.status === "DISPUTED" ? (
            <Card className="border-border/80 bg-card/95">
              <CardHeader>
                <CardTitle>Resultado en disputa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>La mesa ha quedado marcada en disputa y no entra en el historial confirmado.</p>
                <p>Hasta que se resuelva, el marcador quedara apartado y no movera el ELO.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      {participantCount === 4 ? (
        showLobby ? (
          <section className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Configurar equipos
              </p>
              <h3 className="font-heading text-2xl font-semibold">
                Lobby 2vs2 antes de empezar
              </h3>
            </div>
            <ChallengeLobbyBoard
              challengeId={challenge.id}
              editable={canEditLobby}
              canStart={canStart}
              teamA={groupedParticipants.teamA}
              teamB={groupedParticipants.teamB}
              unassigned={groupedParticipants.unassigned}
            />
          </section>
        ) : (
          <Card className="border-border/80 bg-card/95">
            <CardContent className="pt-4 text-sm leading-6 text-muted-foreground">
              El lobby solo es visible para quienes participan en este reto.
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Lobby pendiente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Cuando el reto llegue a cuatro jugadores, aqui aparecera la zona para
            configurar equipos y poner la partida en curso.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
