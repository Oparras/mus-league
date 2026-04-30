import "server-only";

import { LobbyTeamSlot, MatchFormat, type Prisma } from "@/generated/prisma/client";
import {
  calculateMatchEloDelta,
  calculateTeamAverageElo,
} from "@/lib/elo/rating";

type MatchWithPlayers = Prisma.MatchGetPayload<{
  include: {
    matchPlayers: {
      include: {
        team: true;
        user: {
          include: {
            profile: true;
          };
        };
      };
      orderBy: {
        seatIndex: "asc";
      };
    };
  };
}>;

type MatchPlayerWithProfile = MatchWithPlayers["matchPlayers"][number];

function getTeamPlayers(
  players: MatchPlayerWithProfile[],
  slot: LobbyTeamSlot,
) {
  return players.filter((player) => player.team.slot === slot);
}

function assertMatchReadyForElo(match: MatchWithPlayers) {
  if (!match.format) {
    throw new Error("Cannot apply ELO without a match format.");
  }

  if (!match.winnerTeamSlot) {
    throw new Error("Cannot apply ELO without a winning team.");
  }

  if (match.eloAppliedAt) {
    return false;
  }

  const teamAPlayers = getTeamPlayers(match.matchPlayers, LobbyTeamSlot.TEAM_A);
  const teamBPlayers = getTeamPlayers(match.matchPlayers, LobbyTeamSlot.TEAM_B);

  if (teamAPlayers.length !== 2 || teamBPlayers.length !== 2) {
    throw new Error("El calculo ELO requiere exactamente dos jugadores en Equipo A y Equipo B.");
  }

  for (const player of [...teamAPlayers, ...teamBPlayers]) {
    if (!player.user.profile) {
      throw new Error("All match players need a player profile before ELO can be applied.");
    }
  }

  return true;
}

function buildTeamUpdatePayload(options: {
  players: MatchPlayerWithProfile[];
  delta: number;
  winnerTeamSlot: LobbyTeamSlot;
  slot: LobbyTeamSlot;
}) {
  const won = options.slot === options.winnerTeamSlot;

  return options.players.map((player) => {
    const profile = player.user.profile;

    if (!profile) {
      throw new Error("Missing player profile while building ELO update payload.");
    }

    const eloBefore = profile.elo;
    const eloAfter = Math.round(eloBefore + options.delta);

    return {
      playerProfileId: profile.id,
      matchId: player.matchId,
      eloBefore,
      eloAfter,
      delta: options.delta,
      rating: eloAfter,
      winsIncrement: won ? 1 : 0,
      lossesIncrement: won ? 0 : 1,
    };
  });
}

export async function applyConfirmedMatchElo(
  tx: Prisma.TransactionClient,
  matchId: string,
) {
  const match = await tx.match.findUnique({
    where: {
      id: matchId,
    },
    include: {
      matchPlayers: {
        include: {
          team: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
    },
  });

  if (!match) {
    throw new Error("Cannot apply ELO to a match that does not exist.");
  }

  const shouldApply = assertMatchReadyForElo(match);

  if (!shouldApply) {
    return null;
  }

  const teamAPlayers = getTeamPlayers(match.matchPlayers, LobbyTeamSlot.TEAM_A);
  const teamBPlayers = getTeamPlayers(match.matchPlayers, LobbyTeamSlot.TEAM_B);
  const teamAElo = calculateTeamAverageElo(
    teamAPlayers.map((player) => player.user.profile?.elo ?? 1000),
  );
  const teamBElo = calculateTeamAverageElo(
    teamBPlayers.map((player) => player.user.profile?.elo ?? 1000),
  );
  const ratingChange = calculateMatchEloDelta({
    format: match.format as MatchFormat,
    winnerTeamSlot: match.winnerTeamSlot as LobbyTeamSlot,
    teamAElo,
    teamBElo,
  });
  const updates = [
    ...buildTeamUpdatePayload({
      players: teamAPlayers,
      delta: ratingChange.teamADelta,
      winnerTeamSlot: match.winnerTeamSlot as LobbyTeamSlot,
      slot: LobbyTeamSlot.TEAM_A,
    }),
    ...buildTeamUpdatePayload({
      players: teamBPlayers,
      delta: ratingChange.teamBDelta,
      winnerTeamSlot: match.winnerTeamSlot as LobbyTeamSlot,
      slot: LobbyTeamSlot.TEAM_B,
    }),
  ];

  await Promise.all(
    updates.map((update) =>
      tx.playerProfile.update({
        where: {
          id: update.playerProfileId,
        },
        data: {
          elo: update.eloAfter,
          rating: update.rating,
          matchesPlayed: {
            increment: 1,
          },
          wins: {
            increment: update.winsIncrement,
          },
          losses: {
            increment: update.lossesIncrement,
          },
        },
      }),
    ),
  );

  await tx.eloHistory.createMany({
    data: updates.map((update) => ({
      playerProfileId: update.playerProfileId,
      matchId: update.matchId,
      eloBefore: update.eloBefore,
      eloAfter: update.eloAfter,
      delta: update.delta,
    })),
  });

  const eloAppliedAt = new Date();

  await tx.match.update({
    where: {
      id: match.id,
    },
    data: {
      eloAppliedAt,
    },
  });

  return {
    eloAppliedAt,
    teamAElo,
    teamBElo,
    ...ratingChange,
  };
}
