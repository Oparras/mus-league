import type {
  ChallengeStatus,
  LobbyTeamSlot,
  MatchFormat,
} from "@/generated/prisma/client";

export const challengeStatusLabels: Record<ChallengeStatus, string> = {
  OPEN: "Abierto",
  FULL: "Mesa completa",
  TEAMS_EDITING: "Configurar equipos",
  TEAMS_LOCKED: "Equipos bloqueados",
  IN_PROGRESS: "Partida en curso",
  RESULT_SUBMITTED: "Resultado pendiente",
  CONFIRMED: "Resultado confirmado",
  DISPUTED: "En disputa",
  CANCELLED: "Cancelado",
};

export const matchFormatLabels: Record<MatchFormat, string> = {
  POINTS_30: "A 30 puntos",
  POINTS_40: "A 40 puntos",
  VACA_FIRST_TO_3: "Primera a 3 vacas",
  BEST_OF_3_VACAS: "Mejor de 3 vacas",
};

export const matchFormatScoreGuides: Record<
  MatchFormat,
  {
    maxWinnerScore: number;
    maxLoserScore: number;
    helperText: string;
  }
> = {
  POINTS_30: {
    maxWinnerScore: 30,
    maxLoserScore: 29,
    helperText: "El equipo ganador debe llegar a 30. El rival se queda por debajo de 30.",
  },
  POINTS_40: {
    maxWinnerScore: 40,
    maxLoserScore: 39,
    helperText: "El equipo ganador debe llegar a 40. El rival se queda por debajo de 40.",
  },
  VACA_FIRST_TO_3: {
    maxWinnerScore: 3,
    maxLoserScore: 2,
    helperText: "La primera pareja que llegue a 3 vacas gana la mesa.",
  },
  BEST_OF_3_VACAS: {
    maxWinnerScore: 2,
    maxLoserScore: 1,
    helperText: "El mejor de 3 vacas termina cuando una pareja alcanza 2.",
  },
};

export const lobbyTeamLabels: Record<LobbyTeamSlot, string> = {
  TEAM_A: "Equipo A",
  TEAM_B: "Equipo B",
};

export function getChallengeStatusLabel(status: ChallengeStatus) {
  return challengeStatusLabels[status];
}

export function getMatchFormatLabel(format: MatchFormat) {
  return matchFormatLabels[format];
}

export function getLobbyTeamLabel(slot: LobbyTeamSlot) {
  return lobbyTeamLabels[slot];
}

export function getMatchFormatOptions() {
  return (Object.entries(matchFormatLabels) as [MatchFormat, string][])
    .map(([value, label]) => ({
      value,
      label,
    }));
}

export function getMatchFormatScoreGuide(format: MatchFormat) {
  return matchFormatScoreGuides[format];
}

export const discoverableChallengeStatuses = [
  "OPEN",
  "FULL",
  "TEAMS_EDITING",
] as const satisfies readonly ChallengeStatus[];

export const editableChallengeStatuses = [
  "FULL",
  "TEAMS_EDITING",
] as const satisfies readonly ChallengeStatus[];

export const joinableChallengeStatuses = [
  "OPEN",
  "FULL",
  "TEAMS_EDITING",
] as const satisfies readonly ChallengeStatus[];
