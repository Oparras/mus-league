export const MAX_CHALLENGE_PARTICIPANTS = 4;

export function getChallengePath(challengeId: string) {
  return `/matches/${challengeId}`;
}

export function getChallengeInvitePath(inviteCode: string) {
  return `/invite?code=${encodeURIComponent(inviteCode)}`;
}

export function getChallengeSeatsLeft(participantCount: number) {
  return Math.max(MAX_CHALLENGE_PARTICIPANTS - participantCount, 0);
}

export function getChallengeSeatsLabel(participantCount: number) {
  const seatsLeft = getChallengeSeatsLeft(participantCount);

  if (seatsLeft <= 0) {
    return "Mesa completa";
  }

  return `Faltan ${seatsLeft} ${seatsLeft === 1 ? "jugador" : "jugadores"}`;
}

export function formatChallengeProposedAt(date: Date | null) {
  if (!date) {
    return "Horario flexible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
