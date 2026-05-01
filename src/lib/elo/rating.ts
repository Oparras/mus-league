import { LobbyTeamSlot, MatchFormat } from "@/generated/prisma/client";

const matchFormatKFactors: Record<MatchFormat, number> = {
  POINTS_30: 24,
  POINTS_40: 28,
  VACA_FIRST_TO_3: 32,
  BEST_OF_3_VACAS: 40,
};

const MIN_PLAYER_DELTA_ABS = 1;
const MAX_PLAYER_DELTA_ABS = 60;

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

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getWeightedDeltaTargetTotal(playerCount: number, rawTeamDelta: number) {
  if (playerCount === 0 || rawTeamDelta === 0) {
    return 0;
  }

  const roundedBaseMagnitude = Math.round(Math.abs(rawTeamDelta));

  return clamp(
    Math.max(playerCount * MIN_PLAYER_DELTA_ABS, roundedBaseMagnitude * playerCount),
    playerCount * MIN_PLAYER_DELTA_ABS,
    playerCount * MAX_PLAYER_DELTA_ABS,
  );
}

function getRoundedBaseDelta(rawTeamDelta: number) {
  const roundedMagnitude = Math.round(Math.abs(rawTeamDelta));

  if (roundedMagnitude === 0) {
    return 0;
  }

  return rawTeamDelta > 0 ? roundedMagnitude : -roundedMagnitude;
}

function buildDistributionWeights(playerElos: number[], teamAverageElo: number, teamWon: boolean) {
  const safeTeamAverage = Math.max(teamAverageElo, 1);

  return playerElos.map((playerElo) => {
    const safePlayerElo = Math.max(playerElo, 1);

    return teamWon ? safeTeamAverage / safePlayerElo : safePlayerElo / safeTeamAverage;
  });
}

function normalizeWeights(weights: number[]) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight <= 0) {
    return weights.map(() => 1 / Math.max(weights.length, 1));
  }

  return weights.map((weight) => weight / totalWeight);
}

function allocateWeightedIntegerDeltas(options: {
  playerElos: number[];
  teamAverageElo: number;
  rawTeamDelta: number;
}) {
  if (options.playerElos.length === 0 || options.rawTeamDelta === 0) {
    return [];
  }

  const teamWon = options.rawTeamDelta > 0;
  const sign = teamWon ? 1 : -1;
  const targetTotalAbs = getWeightedDeltaTargetTotal(
    options.playerElos.length,
    options.rawTeamDelta,
  );

  if (targetTotalAbs === 0) {
    return options.playerElos.map(() => 0);
  }

  const weights = normalizeWeights(
    buildDistributionWeights(
      options.playerElos,
      options.teamAverageElo,
      teamWon,
    ),
  );
  const idealAbsDeltas = weights.map((weight) => weight * targetTotalAbs);
  const fractionalParts = idealAbsDeltas.map((idealDelta, index) => ({
    index,
    fractional: idealDelta - Math.floor(idealDelta),
    weight: weights[index] ?? 0,
  }));

  const allocatedAbsDeltas = idealAbsDeltas.map((idealDelta) =>
    clamp(
      Math.floor(idealDelta),
      MIN_PLAYER_DELTA_ABS,
      MAX_PLAYER_DELTA_ABS,
    ),
  );
  let allocatedTotal = allocatedAbsDeltas.reduce((sum, delta) => sum + delta, 0);

  while (allocatedTotal < targetTotalAbs) {
    const candidates = [...fractionalParts]
      .filter(({ index }) => (allocatedAbsDeltas[index] ?? 0) < MAX_PLAYER_DELTA_ABS)
      .sort((left, right) => {
        if (right.fractional !== left.fractional) {
          return right.fractional - left.fractional;
        }

        return right.weight - left.weight;
      });

    if (candidates.length === 0) {
      break;
    }

    for (const candidate of candidates) {
      if (allocatedTotal >= targetTotalAbs) {
        break;
      }

      if ((allocatedAbsDeltas[candidate.index] ?? 0) >= MAX_PLAYER_DELTA_ABS) {
        continue;
      }

      allocatedAbsDeltas[candidate.index] = (allocatedAbsDeltas[candidate.index] ?? 0) + 1;
      allocatedTotal += 1;
    }
  }

  while (allocatedTotal > targetTotalAbs) {
    const candidates = [...fractionalParts]
      .filter(({ index }) => (allocatedAbsDeltas[index] ?? 0) > MIN_PLAYER_DELTA_ABS)
      .sort((left, right) => {
        if (left.fractional !== right.fractional) {
          return left.fractional - right.fractional;
        }

        return left.weight - right.weight;
      });

    if (candidates.length === 0) {
      break;
    }

    for (const candidate of candidates) {
      if (allocatedTotal <= targetTotalAbs) {
        break;
      }

      if ((allocatedAbsDeltas[candidate.index] ?? 0) <= MIN_PLAYER_DELTA_ABS) {
        continue;
      }

      allocatedAbsDeltas[candidate.index] = (allocatedAbsDeltas[candidate.index] ?? 0) - 1;
      allocatedTotal -= 1;
    }
  }

  return allocatedAbsDeltas.map((delta) => delta * sign);
}

/**
 * Mantiene el expected score por pareja, pero reparte el impacto individualmente.
 *
 * Ejemplo conceptual:
 * - Ganan 2000 + 500 contra 2000 + 2000
 * - La pareja ganadora recibe un budget comun basado en el delta del equipo
 * - El jugador de 500 absorbe una parte mayor del premio
 * - El jugador de 2000 del mismo equipo se lleva una parte menor
 */
export function calculateMatchEloDelta(options: {
  format: MatchFormat;
  winnerTeamSlot: LobbyTeamSlot;
  teamAPlayerElos: number[];
  teamBPlayerElos: number[];
}) {
  const teamAElo = calculateTeamAverageElo(options.teamAPlayerElos);
  const teamBElo = calculateTeamAverageElo(options.teamBPlayerElos);
  const expectedTeamA = calculateExpectedScore(teamAElo, teamBElo);
  const expectedTeamB = 1 - expectedTeamA;
  const teamAScore = options.winnerTeamSlot === LobbyTeamSlot.TEAM_A ? 1 : 0;
  const teamBScore = options.winnerTeamSlot === LobbyTeamSlot.TEAM_B ? 1 : 0;
  const kFactor = getMatchFormatKFactor(options.format);
  const rawTeamADelta = kFactor * (teamAScore - expectedTeamA);
  const rawTeamBDelta = kFactor * (teamBScore - expectedTeamB);
  const teamABaseDelta = getRoundedBaseDelta(rawTeamADelta);
  const teamBBaseDelta = getRoundedBaseDelta(rawTeamBDelta);
  const teamAPlayerDeltas = allocateWeightedIntegerDeltas({
    playerElos: options.teamAPlayerElos,
    teamAverageElo: teamAElo,
    rawTeamDelta: rawTeamADelta,
  });
  const teamBPlayerDeltas = allocateWeightedIntegerDeltas({
    playerElos: options.teamBPlayerElos,
    teamAverageElo: teamBElo,
    rawTeamDelta: rawTeamBDelta,
  });

  return {
    kFactor,
    expectedTeamA,
    expectedTeamB,
    teamAElo,
    teamBElo,
    rawTeamADelta,
    rawTeamBDelta,
    teamABaseDelta,
    teamBBaseDelta,
    teamAPlayerDeltas,
    teamBPlayerDeltas,
  };
}
