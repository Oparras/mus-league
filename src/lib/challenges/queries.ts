import "server-only";

import { notFound } from "next/navigation";

import {
  ChallengeStatus,
  LobbyTeamSlot,
  type Prisma,
} from "@/generated/prisma/client";
import {
  discoverableChallengeStatuses,
  editableChallengeStatuses,
  joinableChallengeStatuses,
} from "@/lib/challenges/constants";
import { getPrismaClient } from "@/lib/db/prisma";
import { getLeagueScopeIds } from "@/lib/leagues/queries";

export type ChallengeFeedItem = Prisma.ChallengeGetPayload<{
  include: {
    league: true;
    creator: true;
    participants: {
      include: {
        user: true;
      };
      orderBy: {
        seatIndex: "asc";
      };
    };
  };
}> & {
  inviteCode: string | null;
};

export type ChallengeDetail = Prisma.ChallengeGetPayload<{
  include: {
    league: true;
    creator: true;
    participants: {
      include: {
        user: {
          include: {
            profile: {
              include: {
                preferredLeague: true;
              };
            };
          };
        };
      };
      orderBy: {
        seatIndex: "asc";
      };
    };
    match: {
      include: {
        submittedBy: true;
        confirmedBy: true;
        eloHistory: {
          include: {
            playerProfile: {
              include: {
                user: true;
              };
            };
          };
          orderBy: {
            delta: "desc";
          };
        };
        matchTeams: {
          include: {
            players: {
              include: {
                user: true;
              };
              orderBy: {
                seatIndex: "asc";
              };
            };
          };
          orderBy: {
            slot: "asc";
          };
        };
      };
    };
  };
}> & {
  inviteCode: string | null;
};

export type MatchHistoryItem = Prisma.MatchGetPayload<{
  include: {
    league: true;
    challenge: true;
    submittedBy: true;
    confirmedBy: true;
    eloHistory: {
      include: {
        playerProfile: {
          include: {
            user: true;
          };
        };
      };
      orderBy: {
        delta: "desc";
      };
    };
    matchTeams: {
      include: {
        players: {
          include: {
            user: true;
          };
          orderBy: {
            seatIndex: "asc";
          };
        };
      };
      orderBy: {
        slot: "asc";
      };
    };
  };
}>;

function matchesStatus(
  status: ChallengeStatus,
  allowedStatuses: readonly ChallengeStatus[],
) {
  return allowedStatuses.some((allowedStatus) => allowedStatus === status);
}

export function groupParticipantsByTeam<
  T extends {
    teamSlot: LobbyTeamSlot | null;
  },
>(participants: T[]) {
  return {
    teamA: participants.filter((participant) => participant.teamSlot === LobbyTeamSlot.TEAM_A),
    teamB: participants.filter((participant) => participant.teamSlot === LobbyTeamSlot.TEAM_B),
    unassigned: participants.filter((participant) => participant.teamSlot === null),
  };
}

export function isChallengeDiscoverable(status: ChallengeStatus) {
  return matchesStatus(status, discoverableChallengeStatuses);
}

export function isChallengeLobbyEditable(status: ChallengeStatus) {
  return matchesStatus(status, editableChallengeStatuses);
}

export function isChallengeJoinable(status: ChallengeStatus) {
  return matchesStatus(status, joinableChallengeStatuses);
}

export async function getChallengeFeed(leagueId?: string) {
  const prisma = getPrismaClient();

  return prisma.challenge.findMany({
    where: {
      leagueId: leagueId || undefined,
      status: {
        in: [...discoverableChallengeStatuses],
      },
    },
    include: {
      league: true,
      creator: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
    },
    orderBy: [
      {
        proposedAt: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function getRecentConfirmedMatches(options?: {
  leagueId?: string;
  scopeLeagueId?: string;
  limit?: number;
}) {
  const prisma = getPrismaClient();
  const scopedLeagueIds = options?.scopeLeagueId
    ? await getLeagueScopeIds(options.scopeLeagueId)
    : null;

  return prisma.match.findMany({
    where: {
      challenge: {
        is: {
          status: ChallengeStatus.CONFIRMED,
          leagueId: scopedLeagueIds
            ? {
                in: scopedLeagueIds,
              }
            : (options?.leagueId ?? undefined),
        },
      },
    },
    include: {
      league: true,
      challenge: true,
      submittedBy: true,
      confirmedBy: true,
      eloHistory: {
        include: {
          playerProfile: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          delta: "desc",
        },
      },
      matchTeams: {
        include: {
          players: {
            include: {
              user: true,
            },
            orderBy: {
              seatIndex: "asc",
            },
          },
        },
        orderBy: {
          slot: "asc",
        },
      },
    },
    orderBy: [
      {
        confirmedAt: "desc",
      },
      {
        submittedAt: "desc",
      },
    ],
    take: options?.limit ?? 6,
  });
}

export async function getPlayerMatchHistory(options: {
  userId: string;
  limit?: number;
  confirmedOnly?: boolean;
}) {
  const prisma = getPrismaClient();

  return prisma.match.findMany({
    where: {
      matchPlayers: {
        some: {
          userId: options.userId,
        },
      },
      challenge: {
        is: {
          status: options.confirmedOnly
            ? ChallengeStatus.CONFIRMED
            : {
                in: [
                  ChallengeStatus.IN_PROGRESS,
                  ChallengeStatus.RESULT_SUBMITTED,
                  ChallengeStatus.CONFIRMED,
                  ChallengeStatus.DISPUTED,
                ],
              },
        },
      },
    },
    include: {
      league: true,
      challenge: true,
      submittedBy: true,
      confirmedBy: true,
      eloHistory: {
        include: {
          playerProfile: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          delta: "desc",
        },
      },
      matchTeams: {
        include: {
          players: {
            include: {
              user: true,
            },
            orderBy: {
              seatIndex: "asc",
            },
          },
        },
        orderBy: {
          slot: "asc",
        },
      },
    },
    orderBy: [
      {
        confirmedAt: "desc",
      },
      {
        submittedAt: "desc",
      },
      {
        startedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: options.limit,
  });
}

export async function getNearbyChallenges(preferredLeagueId?: string | null) {
  if (!preferredLeagueId) {
    return [];
  }

  const scopeLeagueIds = await getLeagueScopeIds(preferredLeagueId);
  const prisma = getPrismaClient();

  return prisma.challenge.findMany({
    where: {
      leagueId: {
        in: scopeLeagueIds,
      },
      status: {
        in: [...discoverableChallengeStatuses],
      },
    },
    include: {
      league: true,
      creator: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
    },
    orderBy: [
      {
        proposedAt: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 4,
  });
}

export async function getChallengeByIdOrThrow(challengeId: string): Promise<ChallengeDetail> {
  const prisma = getPrismaClient();
  const challenge = await prisma.challenge.findUnique({
    where: {
      id: challengeId,
    },
    include: {
      league: true,
      creator: true,
      participants: {
        include: {
          user: {
            include: {
              profile: {
                include: {
                  preferredLeague: true,
                },
              },
            },
          },
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
      match: {
        include: {
          submittedBy: true,
          confirmedBy: true,
          eloHistory: {
            include: {
              playerProfile: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              delta: "desc",
            },
          },
          matchTeams: {
            include: {
              players: {
                include: {
                  user: true,
                },
                orderBy: {
                  seatIndex: "asc",
                },
              },
            },
            orderBy: {
              slot: "asc",
            },
          },
        },
      },
    },
  });

  if (!challenge) {
    notFound();
  }

  return challenge;
}

export async function getChallengeByInviteCode(
  inviteCode: string,
): Promise<ChallengeDetail | null> {
  const prisma = getPrismaClient();

  return prisma.challenge.findUnique({
    where: {
      inviteCode: inviteCode.trim().toUpperCase(),
    } as Prisma.ChallengeWhereUniqueInput,
    include: {
      league: true,
      creator: true,
      participants: {
        include: {
          user: {
            include: {
              profile: {
                include: {
                  preferredLeague: true,
                },
              },
            },
          },
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
      match: {
        include: {
          submittedBy: true,
          confirmedBy: true,
          eloHistory: {
            include: {
              playerProfile: {
                include: {
                  user: true,
                },
              },
            },
            orderBy: {
              delta: "desc",
            },
          },
          matchTeams: {
            include: {
              players: {
                include: {
                  user: true,
                },
                orderBy: {
                  seatIndex: "asc",
                },
              },
            },
            orderBy: {
              slot: "asc",
            },
          },
        },
      },
    },
  });
}
