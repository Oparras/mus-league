import { LobbyTeamSlot, MatchFormat } from "@/generated/prisma/client";

const matchFormatKFactors: Record<MatchFormat, number> = {
  POINTS_30: 24,
  POINTS_40: 28,
  VACA_FIRST_TO_3: 32,
  BEST_OF_3_VACAS: 40,
};

export function getMatchFormatKFactor(format: MatchFormat) {
  return matchFormatKFactors[format];
}

export function calculateExpectedScore(ownElo: number, opponentElo: number) {
  return 1 / (1 + 10 ** ((opponentElo - ownElo) / 400));
}

export function calculateTeamAverageElo(playerElos: number[]) {
  if (playerElos.length === 0) {
    return 0;
  }

  return playerElos.reduce((sum, elo) => sum + elo, 0) / playerElos.length;
}

export function calculateMatchEloDelta(options: {
  format: MatchFormat;
  winnerTeamSlot: LobbyTeamSlot;
  teamAElo: number;
  teamBElo: number;
}) {
  const expectedTeamA = calculateExpectedScore(options.teamAElo, options.teamBElo);
  const expectedTeamB = 1 - expectedTeamA;
  const teamAScore = options.winnerTeamSlot === LobbyTeamSlot.TEAM_A ? 1 : 0;
  const teamBScore = options.winnerTeamSlot === LobbyTeamSlot.TEAM_B ? 1 : 0;
  const kFactor = getMatchFormatKFactor(options.format);
  const teamADelta = Math.round(kFactor * (teamAScore - expectedTeamA));
  const teamBDelta = Math.round(kFactor * (teamBScore - expectedTeamB));

  return {
    kFactor,
    expectedTeamA,
    expectedTeamB,
    teamADelta,
    teamBDelta,
  };
}

