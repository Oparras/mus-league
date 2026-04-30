import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { getLeagueScopeIds } from "@/lib/leagues/queries";

export type RankingProfile = Prisma.PlayerProfileGetPayload<{
  include: {
    user: true;
    preferredLeague: true;
  };
}>;

export type EloMovement = Prisma.EloHistoryGetPayload<{
  include: {
    match: {
      include: {
        league: true;
        challenge: true;
      };
    };
    playerProfile: {
      include: {
        user: true;
        preferredLeague: true;
      };
    };
  };
}>;

const rankingOrder: Prisma.PlayerProfileOrderByWithRelationInput[] = [
  {
    elo: "desc",
  },
  {
    wins: "desc",
  },
  {
    matchesPlayed: "desc",
  },
  {
    user: {
      displayName: "asc",
    },
  },
];

export function calculateWinrate(wins: number, matchesPlayed: number) {
  if (matchesPlayed <= 0) {
    return 0;
  }

  return Math.round((wins / matchesPlayed) * 100);
}

export async function getLatestEloMovementsForUser(options: {
  userId: string;
  limit?: number;
}) {
  const prisma = getPrismaClient();

  return prisma.eloHistory.findMany({
    where: {
      playerProfile: {
        userId: options.userId,
      },
    },
    include: {
      match: {
        include: {
          league: true,
          challenge: true,
        },
      },
      playerProfile: {
        include: {
          user: true,
          preferredLeague: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: options.limit ?? 6,
  });
}

export async function getGlobalRanking(limit = 25) {
  const prisma = getPrismaClient();

  return prisma.playerProfile.findMany({
    include: {
      user: true,
      preferredLeague: true,
    },
    orderBy: rankingOrder,
    take: limit,
  });
}

export async function getZoneRanking(options: {
  leagueId?: string | null;
  limit?: number;
}) {
  if (!options.leagueId) {
    return [];
  }

  const prisma = getPrismaClient();
  const scopedLeagueIds = await getLeagueScopeIds(options.leagueId);

  return prisma.playerProfile.findMany({
    where: {
      preferredLeagueId: {
        in: scopedLeagueIds,
      },
    },
    include: {
      user: true,
      preferredLeague: true,
    },
    orderBy: rankingOrder,
    take: options.limit ?? 25,
  });
}

export async function getApproximateGlobalRank(userId: string) {
  const prisma = getPrismaClient();
  const profile = await prisma.playerProfile.findUnique({
    where: {
      userId,
    },
    select: {
      elo: true,
    },
  });

  if (!profile) {
    return null;
  }

  const higherCount = await prisma.playerProfile.count({
    where: {
      elo: {
        gt: profile.elo,
      },
    },
  });

  return higherCount + 1;
}

export async function getApproximateZoneRank(options: {
  userId: string;
  leagueId?: string | null;
}) {
  if (!options.leagueId) {
    return null;
  }

  const prisma = getPrismaClient();
  const profile = await prisma.playerProfile.findUnique({
    where: {
      userId: options.userId,
    },
    select: {
      elo: true,
    },
  });

  if (!profile) {
    return null;
  }

  const scopedLeagueIds = await getLeagueScopeIds(options.leagueId);
  const higherCount = await prisma.playerProfile.count({
    where: {
      preferredLeagueId: {
        in: scopedLeagueIds,
      },
      elo: {
        gt: profile.elo,
      },
    },
  });

  return higherCount + 1;
}

