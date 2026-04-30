import "server-only";

import { notFound } from "next/navigation";

import type { League, LeagueType, Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";

export type LeagueListItem = {
  id: string;
  slug: string;
  name: string;
  type: LeagueType;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  parentName: string | null;
  playerCount: number;
  directPlayerCount: number;
  activeChallengeCount: number;
  childCount: number;
  depth: number;
};

export type NearbyPlayer = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  preferredLeagueName: string | null;
  preferredLeagueSlug: string | null;
  bio: string | null;
  relationLabel: string;
};

type LeagueWithRelations = Prisma.LeagueGetPayload<{
  include: {
    parent: true;
    children: {
      where: {
        isActive: true;
      };
      orderBy: {
        name: "asc";
      };
    };
  };
}>;

const leagueTypeOrder: Record<LeagueType, number> = {
  GLOBAL: 0,
  REGION: 1,
  LOCALITY: 2,
  CITY: 3,
};

function buildLeagueMaps(leagues: League[]) {
  const byId = new Map(leagues.map((league) => [league.id, league]));
  const childrenByParentId = new Map<string, League[]>();

  leagues.forEach((league) => {
    if (!league.parentId) {
      return;
    }

    const bucket = childrenByParentId.get(league.parentId) ?? [];
    bucket.push(league);
    childrenByParentId.set(league.parentId, bucket);
  });

  childrenByParentId.forEach((bucket) => {
    bucket.sort((a, b) => {
      const typeOrder = leagueTypeOrder[a.type] - leagueTypeOrder[b.type];
      if (typeOrder !== 0) {
        return typeOrder;
      }

      return a.name.localeCompare(b.name, "es");
    });
  });

  return {
    byId,
    childrenByParentId,
  };
}

function getDescendantIds(
  leagueId: string,
  childrenByParentId: Map<string, League[]>,
): string[] {
  const visited: string[] = [];
  const queue = [leagueId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (!currentId || visited.includes(currentId)) {
      continue;
    }

    visited.push(currentId);

    const children = childrenByParentId.get(currentId) ?? [];
    children.forEach((child) => queue.push(child.id));
  }

  return visited;
}

export async function getLeagueScopeIds(leagueId: string) {
  const prisma = getPrismaClient();
  const leagues = await prisma.league.findMany({
    where: {
      isActive: true,
    },
  });
  const { childrenByParentId } = buildLeagueMaps(leagues);

  return getDescendantIds(leagueId, childrenByParentId);
}

export async function getLeagueNetworkIds(leagueId: string) {
  const prisma = getPrismaClient();
  const leagues = await prisma.league.findMany({
    where: {
      isActive: true,
    },
  });
  const { byId, childrenByParentId } = buildLeagueMaps(leagues);
  const currentLeague = byId.get(leagueId);

  if (!currentLeague) {
    return [];
  }

  const scopeIds = new Set<string>();

  scopeIds.add(currentLeague.id);

  getDescendantIds(currentLeague.id, childrenByParentId).forEach((id) => scopeIds.add(id));

  if (currentLeague.parentId) {
    scopeIds.add(currentLeague.parentId);

    (childrenByParentId.get(currentLeague.parentId) ?? []).forEach((sibling) => {
      scopeIds.add(sibling.id);
    });
  }

  return [...scopeIds];
}

function getLeagueDepth(league: League, byId: Map<string, League>) {
  let depth = 0;
  let currentParentId = league.parentId;

  while (currentParentId) {
    depth += 1;
    currentParentId = byId.get(currentParentId)?.parentId ?? null;
  }

  return depth;
}

export async function getLeagueSelectionOptions() {
  const prisma = getPrismaClient();
  const leagues = await prisma.league.findMany({
    where: {
      isActive: true,
      type: "REGION",
    },
    orderBy: [{ name: "asc" }],
  });

  const { byId } = buildLeagueMaps(leagues);

  return leagues.map((league) => ({
    id: league.id,
    slug: league.slug,
    name: league.name,
    type: league.type,
    depth: getLeagueDepth(league, byId),
    pathLabel: buildLeaguePathLabel(league, byId),
  }));
}

function buildLeaguePathLabel(league: League, byId: Map<string, League>) {
  const segments = [league.name];
  let currentParentId = league.parentId;

  while (currentParentId) {
    const parent = byId.get(currentParentId);

    if (!parent) {
      break;
    }

    segments.unshift(parent.name);
    currentParentId = parent.parentId;
  }

  return segments.join(" / ");
}

export async function getLeagueListItems(): Promise<LeagueListItem[]> {
  const prisma = getPrismaClient();
  const [allLeagues, profiles, challenges] = await Promise.all([
    prisma.league.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.playerProfile.findMany({
      where: {
        preferredLeagueId: {
          not: null,
        },
      },
      select: {
        preferredLeagueId: true,
      },
    }),
    prisma.challenge.findMany({
      where: {
        status: {
          in: ["OPEN", "FULL", "TEAMS_EDITING"],
        },
        league: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        leagueId: true,
      },
    }),
  ]);

  const leagues = allLeagues.filter((league) => league.type === "REGION");
  const { byId, childrenByParentId } = buildLeagueMaps(allLeagues);
  const directCounts = new Map<string, number>();
  const challengeCounts = new Map<string, number>();

  profiles.forEach((profile) => {
    if (!profile.preferredLeagueId) {
      return;
    }

    directCounts.set(
      profile.preferredLeagueId,
      (directCounts.get(profile.preferredLeagueId) ?? 0) + 1,
    );
  });

  challenges.forEach((challenge) => {
    challengeCounts.set(
      challenge.leagueId,
      (challengeCounts.get(challenge.leagueId) ?? 0) + 1,
    );
  });

  return leagues.map((league) => {
    const descendantIds = getDescendantIds(league.id, childrenByParentId);
    const playerCount = descendantIds.reduce((sum, id) => {
      return sum + (directCounts.get(id) ?? 0);
    }, 0);
    const activeChallengeCount = descendantIds.reduce((sum, id) => {
      return sum + (challengeCounts.get(id) ?? 0);
    }, 0);

    return {
      id: league.id,
      slug: league.slug,
      name: league.name,
      type: league.type,
      description: league.description,
      isActive: league.isActive,
      parentId: league.parentId,
      parentName: league.parentId ? byId.get(league.parentId)?.name ?? null : null,
      playerCount,
      directPlayerCount: directCounts.get(league.id) ?? 0,
      activeChallengeCount,
      childCount: childrenByParentId.get(league.id)?.length ?? 0,
      depth: getLeagueDepth(league, byId),
    };
  });
}

export async function getLeagueBySlugOrThrow(slug: string): Promise<LeagueWithRelations> {
  const prisma = getPrismaClient();
  const league = await prisma.league.findFirst({
    where: {
      isActive: true,
      slug,
    },
    include: {
      parent: true,
      children: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!league) {
    notFound();
  }

  return league;
}

export async function getPlayersForLeagueScope(leagueId: string) {
  const prisma = getPrismaClient();
  const scopedLeagueIds = await getLeagueScopeIds(leagueId);

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
    orderBy: [{ preferredLeague: { name: "asc" } }, { user: { displayName: "asc" } }],
  });
}

export async function getNearbyPlayers(userId: string, preferredLeagueId?: string | null) {
  if (!preferredLeagueId) {
    return [];
  }

  const prisma = getPrismaClient();
  const leagues = await prisma.league.findMany({
    where: {
      isActive: true,
    },
  });
  const { byId } = buildLeagueMaps(leagues);
  const currentLeague = byId.get(preferredLeagueId);

  if (!currentLeague) {
    return [];
  }
  const scopeIds = await getLeagueNetworkIds(preferredLeagueId);

  const players = await prisma.playerProfile.findMany({
    where: {
      userId: {
        not: userId,
      },
      preferredLeagueId: {
        in: scopeIds,
      },
    },
    include: {
      user: true,
      preferredLeague: true,
    },
    orderBy: [{ user: { displayName: "asc" } }],
    take: 8,
  });

  return players.map((player) => {
    let relationLabel = "Zona cercana";

    if (player.preferredLeagueId === currentLeague.id) {
      relationLabel = "Tu zona";
    } else if (player.preferredLeagueId === currentLeague.parentId) {
      relationLabel = "Global";
    } else if (player.preferredLeague?.parentId === currentLeague.parentId) {
      relationLabel = "Otra zona de Madrid";
    } else if (player.preferredLeague?.parentId === currentLeague.id) {
      relationLabel = "Subzona";
    }

    return {
      id: player.userId,
      displayName: player.user.displayName,
      avatarUrl: player.user.avatarUrl,
      city: player.city,
      preferredLeagueName: player.preferredLeague?.name ?? null,
      preferredLeagueSlug: player.preferredLeague?.slug ?? null,
      bio: player.bio,
      relationLabel,
    } satisfies NearbyPlayer;
  });
}
