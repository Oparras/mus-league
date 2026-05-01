import "server-only";

import {
  FriendshipStatus,
  type Prisma,
} from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";

export type FriendshipDirection = "INCOMING" | "OUTGOING" | "NONE";

export type FriendshipState = {
  status: FriendshipStatus | null;
  direction: FriendshipDirection;
  isFriend: boolean;
  isPendingIncoming: boolean;
  isPendingOutgoing: boolean;
  canSendRequest: boolean;
};

export type FriendPlayer = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  bio: string | null;
  elo: number | null;
  preferredLeagueId: string | null;
  preferredLeagueName: string | null;
  preferredLeagueSlug: string | null;
  friendshipStatus?: FriendshipStatus | null;
  friendshipDirection?: FriendshipDirection;
};

type FriendshipWithUsers = Prisma.FriendshipGetPayload<{
  include: {
    userLow: {
      include: {
        profile: {
          include: {
            preferredLeague: true;
          };
        };
      };
    };
    userHigh: {
      include: {
        profile: {
          include: {
            preferredLeague: true;
          };
        };
      };
    };
  };
}>;

type PlayerProfileWithUser = Prisma.PlayerProfileGetPayload<{
  include: {
    user: true;
    preferredLeague: true;
  };
}>;

export function getFriendshipPairIds(userAId: string, userBId: string) {
  return userAId < userBId
    ? {
        userLowId: userAId,
        userHighId: userBId,
      }
    : {
        userLowId: userBId,
        userHighId: userAId,
      };
}

function mapProfileToFriendPlayer(profile: PlayerProfileWithUser): FriendPlayer {
  return {
    userId: profile.userId,
    displayName: profile.user.displayName,
    avatarUrl: profile.user.avatarUrl,
    city: profile.city,
    bio: profile.bio,
    elo: profile.elo,
    preferredLeagueId: profile.preferredLeagueId,
    preferredLeagueName: profile.preferredLeague?.name ?? null,
    preferredLeagueSlug: profile.preferredLeague?.slug ?? null,
  };
}

function mapCounterpart(friendship: FriendshipWithUsers, viewerUserId: string): FriendPlayer {
  const counterpart =
    friendship.userLowId === viewerUserId ? friendship.userHigh : friendship.userLow;
  const direction: FriendshipDirection =
    friendship.status === FriendshipStatus.PENDING
      ? friendship.requesterId === viewerUserId
        ? "OUTGOING"
        : "INCOMING"
      : "NONE";

  return {
    userId: counterpart.id,
    displayName: counterpart.displayName,
    avatarUrl: counterpart.avatarUrl,
    city: counterpart.profile?.city ?? null,
    bio: counterpart.profile?.bio ?? null,
    elo: counterpart.profile?.elo ?? null,
    preferredLeagueId: counterpart.profile?.preferredLeagueId ?? null,
    preferredLeagueName: counterpart.profile?.preferredLeague?.name ?? null,
    preferredLeagueSlug: counterpart.profile?.preferredLeague?.slug ?? null,
    friendshipStatus: friendship.status,
    friendshipDirection: direction,
  };
}

export function getFriendshipStateFromRecord(
  viewerUserId: string,
  friendship:
    | {
        status: FriendshipStatus;
        requesterId: string;
      }
    | null,
): FriendshipState {
  if (!friendship) {
    return {
      status: null,
      direction: "NONE",
      isFriend: false,
      isPendingIncoming: false,
      isPendingOutgoing: false,
      canSendRequest: true,
    };
  }

  const direction =
    friendship.status === FriendshipStatus.PENDING
      ? friendship.requesterId === viewerUserId
        ? "OUTGOING"
        : "INCOMING"
      : "NONE";

  return {
    status: friendship.status,
    direction,
    isFriend: friendship.status === FriendshipStatus.ACCEPTED,
    isPendingIncoming:
      friendship.status === FriendshipStatus.PENDING && direction === "INCOMING",
    isPendingOutgoing:
      friendship.status === FriendshipStatus.PENDING && direction === "OUTGOING",
    canSendRequest:
      friendship.status === FriendshipStatus.REJECTED ||
      friendship.status === FriendshipStatus.BLOCKED,
  };
}

export async function getFriendshipState(viewerUserId: string, targetUserId: string) {
  if (viewerUserId === targetUserId) {
    return getFriendshipStateFromRecord(viewerUserId, null);
  }

  const prisma = getPrismaClient();
  const pair = getFriendshipPairIds(viewerUserId, targetUserId);
  const friendship = await prisma.friendship.findUnique({
    where: {
      userLowId_userHighId: pair,
    },
    select: {
      status: true,
      requesterId: true,
    },
  });

  return getFriendshipStateFromRecord(viewerUserId, friendship);
}

export async function getAcceptedFriends(viewerUserId: string) {
  const prisma = getPrismaClient();
  const friendships = await prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ userLowId: viewerUserId }, { userHighId: viewerUserId }],
    },
    include: {
      userLow: {
        include: {
          profile: {
            include: {
              preferredLeague: true,
            },
          },
        },
      },
      userHigh: {
        include: {
          profile: {
            include: {
              preferredLeague: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return friendships.map((friendship) => mapCounterpart(friendship, viewerUserId));
}

export async function getPendingFriendRequests(viewerUserId: string) {
  const prisma = getPrismaClient();
  const [received, sent] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        addresseeId: viewerUserId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        userLow: {
          include: {
            profile: {
              include: {
                preferredLeague: true,
              },
            },
          },
        },
        userHigh: {
          include: {
            profile: {
              include: {
                preferredLeague: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.friendship.findMany({
      where: {
        requesterId: viewerUserId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        userLow: {
          include: {
            profile: {
              include: {
                preferredLeague: true,
              },
            },
          },
        },
        userHigh: {
          include: {
            profile: {
              include: {
                preferredLeague: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return {
    received: received.map((friendship) => mapCounterpart(friendship, viewerUserId)),
    sent: sent.map((friendship) => mapCounterpart(friendship, viewerUserId)),
  };
}

export async function searchPlayersForFriends(options: {
  viewerUserId: string;
  query?: string;
  leagueId?: string;
  limit?: number;
}) {
  const prisma = getPrismaClient();
  const query = options.query?.trim();
  const players = await prisma.playerProfile.findMany({
    where: {
      userId: {
        not: options.viewerUserId,
      },
      preferredLeagueId: options.leagueId || undefined,
      OR: query
        ? [
            {
              user: {
                displayName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
            {
              city: {
                contains: query,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    },
    include: {
      user: true,
      preferredLeague: true,
    },
    orderBy: [{ user: { displayName: "asc" } }],
    take: options.limit ?? 12,
  });

  if (players.length === 0) {
    return [];
  }

  const playerIds = players.map((player) => player.userId);
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        {
          userLowId: options.viewerUserId,
          userHighId: {
            in: playerIds,
          },
        },
        {
          userHighId: options.viewerUserId,
          userLowId: {
            in: playerIds,
          },
        },
      ],
    },
    select: {
      userLowId: true,
      userHighId: true,
      requesterId: true,
      status: true,
    },
  });

  const friendshipsByCounterpartId = new Map(
    friendships.map((friendship) => [
      friendship.userLowId === options.viewerUserId
        ? friendship.userHighId
        : friendship.userLowId,
      friendship,
    ]),
  );

  return players.map((player) => {
    const friendship = friendshipsByCounterpartId.get(player.userId) ?? null;
    const state = getFriendshipStateFromRecord(options.viewerUserId, friendship);

    return {
      ...mapProfileToFriendPlayer(player),
      friendshipStatus: state.status,
      friendshipDirection: state.direction,
    };
  });
}

export async function getFriendDirectoryData(options: {
  viewerUserId: string;
  query?: string;
  leagueId?: string;
}) {
  const [friends, pending, searchResults] = await Promise.all([
    getAcceptedFriends(options.viewerUserId),
    getPendingFriendRequests(options.viewerUserId),
    searchPlayersForFriends(options),
  ]);

  return {
    friends,
    received: pending.received,
    sent: pending.sent,
    searchResults,
  };
}
