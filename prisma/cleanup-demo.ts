import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const confirmCleanup =
  (process.env.MUSLEAGUE_CONFIRM_CLEANUP ?? "false").trim().toLowerCase() === "true";

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be configured to run the cleanup.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const baseZoneSlugs = [
  "global",
  "madrid-centro",
  "madrid-norte",
  "madrid-sur",
  "madrid-este",
  "madrid-oeste",
] as const;

const demoDomains = new Set(["getmusleague.test", "musleague.local"]);
const demoLocalPartPattern =
  /^(demo(?:\d+)?|demo[-_.].+|test[-_.]?demo(?:\d+)?|seed[-_.]?demo(?:\d+)?)$/i;
const demoDisplayNamePattern =
  /^(demo(?:\s*\d+)?|jugador demo|usuario demo|player demo|test demo|seed demo)\b/i;
const demoIdPattern = /^seed-user-/i;

type AppUserCandidate = {
  id: string;
  email: string;
  displayName: string;
  profileId: string | null;
};

type AuthUserCandidate = {
  id: string;
  email: string;
  displayName: string | null;
};

type CleanupSummary = {
  notifications: number;
  messages: number;
  conversationParticipants: number;
  conversations: number;
  challengeInvites: number;
  challengeParticipants: number;
  matchPlayers: number;
  matchTeams: number;
  eloHistory: number;
  matches: number;
  challenges: number;
  friendships: number;
  playerProfiles: number;
  users: number;
  supabaseAuthUsers: number;
};

type CleanupPlan = {
  demoUsers: AppUserCandidate[];
  demoUserIds: string[];
  demoProfileIds: string[];
  demoChallengeIds: string[];
  demoMatchIds: string[];
  demoConversationIds: string[];
  demoNotificationHrefs: string[];
  authDemoUsers: AuthUserCandidate[];
  counts: CleanupSummary;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getEmailParts(email: string) {
  const normalized = normalizeEmail(email);
  const [localPart = "", domain = ""] = normalized.split("@");
  return {
    normalized,
    localPart,
    domain,
  };
}

function isDemoEmail(email: string) {
  const { localPart, domain } = getEmailParts(email);

  return demoDomains.has(domain) || demoLocalPartPattern.test(localPart);
}

function isClearlyDemoDisplayName(displayName: string | null | undefined) {
  return displayName ? demoDisplayNamePattern.test(displayName.trim()) : false;
}

function isDemoLikeIdentity(input: {
  id: string;
  email: string;
  displayName?: string | null;
}) {
  return (
    demoIdPattern.test(input.id) ||
    isDemoEmail(input.email) ||
    isClearlyDemoDisplayName(input.displayName)
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function createEmptySummary(): CleanupSummary {
  return {
    notifications: 0,
    messages: 0,
    conversationParticipants: 0,
    conversations: 0,
    challengeInvites: 0,
    challengeParticipants: 0,
    matchPlayers: 0,
    matchTeams: 0,
    eloHistory: 0,
    matches: 0,
    challenges: 0,
    friendships: 0,
    playerProfiles: 0,
    users: 0,
    supabaseAuthUsers: 0,
  };
}

async function getDemoAppUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      profile: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      email: "asc",
    },
  });

  return users
    .filter((user) =>
      isDemoLikeIdentity({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      }),
    )
    .map<AppUserCandidate>((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profileId: user.profile?.id ?? null,
    }));
}

async function getAuthDemoUsers() {
  if (!supabaseAdmin) {
    return [];
  }

  const matchedUsers: AuthUserCandidate[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (!user.email) {
        continue;
      }

      const displayName =
        typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null;

      if (
        isDemoLikeIdentity({
          id: user.id,
          email: user.email,
          displayName,
        })
      ) {
        matchedUsers.push({
          id: user.id,
          email: user.email,
          displayName,
        });
      }
    }

    hasMore = data.users.length === 200;
    page += 1;
  }

  return matchedUsers.sort((left, right) => left.email.localeCompare(right.email));
}

async function buildCleanupPlan(): Promise<CleanupPlan> {
  const demoUsers = await getDemoAppUsers();
  const demoUserIds = demoUsers.map((user) => user.id);
  const demoProfileIds = demoUsers
    .map((user) => user.profileId)
    .filter((profileId): profileId is string => Boolean(profileId));
  const authDemoUsers = await getAuthDemoUsers();

  if (demoUserIds.length === 0) {
    return {
      demoUsers,
      demoUserIds,
      demoProfileIds,
      demoChallengeIds: [],
      demoMatchIds: [],
      demoConversationIds: [],
      demoNotificationHrefs: [],
      authDemoUsers,
      counts: {
        ...createEmptySummary(),
        supabaseAuthUsers: authDemoUsers.length,
      },
    };
  }

  const [challenges, matches, conversations] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        OR: [
          {
            creatorId: {
              in: demoUserIds,
            },
          },
          {
            participants: {
              some: {
                userId: {
                  in: demoUserIds,
                },
              },
            },
          },
          {
            directInvites: {
              some: {
                OR: [
                  {
                    invitedPlayerId: {
                      in: demoUserIds,
                    },
                  },
                  {
                    invitedByPlayerId: {
                      in: demoUserIds,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    }),
    prisma.match.findMany({
      where: {
        OR: [
          {
            challengeId: {
              not: null,
            },
            challenge: {
              is: {
                OR: [
                  {
                    creatorId: {
                      in: demoUserIds,
                    },
                  },
                  {
                    participants: {
                      some: {
                        userId: {
                          in: demoUserIds,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            matchPlayers: {
              some: {
                userId: {
                  in: demoUserIds,
                },
              },
            },
          },
          {
            submittedById: {
              in: demoUserIds,
            },
          },
          {
            confirmedById: {
              in: demoUserIds,
            },
          },
        ],
      },
      select: {
        id: true,
      },
    }),
    prisma.conversation.findMany({
      where: {
        OR: [
          {
            participants: {
              some: {
                userId: {
                  in: demoUserIds,
                },
              },
            },
          },
          {
            challenge: {
              is: {
                OR: [
                  {
                    creatorId: {
                      in: demoUserIds,
                    },
                  },
                  {
                    participants: {
                      some: {
                        userId: {
                          in: demoUserIds,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        challengeId: true,
        participants: {
          select: {
            userId: true,
          },
        },
      },
    }),
  ]);

  const demoChallengeIds = uniqueStrings(challenges.map((challenge) => challenge.id));
  const demoChallengeIdSet = new Set(demoChallengeIds);
  const demoMatchIds = uniqueStrings(matches.map((match) => match.id));
  const demoUserIdSet = new Set(demoUserIds);

  const demoConversationIds = uniqueStrings(
    conversations
      .filter(
        (conversation) =>
          (conversation.challengeId &&
            demoChallengeIdSet.has(conversation.challengeId)) ||
          (conversation.participants.length > 0 &&
            conversation.participants.every((participant) =>
              demoUserIdSet.has(participant.userId),
            )),
      )
      .map((conversation) => conversation.id),
  );

  const demoNotificationHrefs = uniqueStrings([
    ...demoChallengeIds.map((challengeId) => `/matches/${challengeId}`),
    ...demoConversationIds.map(
      (conversationId) => `/chat?conversation=${conversationId}`,
    ),
  ]);

  const counts = createEmptySummary();

  counts.notifications =
    demoProfileIds.length > 0 || demoNotificationHrefs.length > 0
      ? await prisma.notification.count({
          where: {
            OR: [
              ...(demoProfileIds.length > 0
                ? [
                    {
                      playerProfileId: {
                        in: demoProfileIds,
                      },
                    },
                  ]
                : []),
              ...(demoNotificationHrefs.length > 0
                ? [
                    {
                      href: {
                        in: demoNotificationHrefs,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.messages =
    demoUserIds.length > 0 || demoConversationIds.length > 0
      ? await prisma.message.count({
          where: {
            OR: [
              ...(demoUserIds.length > 0
                ? [
                    {
                      senderId: {
                        in: demoUserIds,
                      },
                    },
                  ]
                : []),
              ...(demoConversationIds.length > 0
                ? [
                    {
                      conversationId: {
                        in: demoConversationIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.conversationParticipants =
    demoUserIds.length > 0 || demoConversationIds.length > 0
      ? await prisma.conversationParticipant.count({
          where: {
            OR: [
              ...(demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: demoUserIds,
                      },
                    },
                  ]
                : []),
              ...(demoConversationIds.length > 0
                ? [
                    {
                      conversationId: {
                        in: demoConversationIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.conversations = demoConversationIds.length;

  counts.challengeInvites =
    demoChallengeIds.length > 0 || demoUserIds.length > 0
      ? await prisma.challengeInvite.count({
          where: {
            OR: [
              ...(demoChallengeIds.length > 0
                ? [
                    {
                      challengeId: {
                        in: demoChallengeIds,
                      },
                    },
                  ]
                : []),
              ...(demoUserIds.length > 0
                ? [
                    {
                      invitedPlayerId: {
                        in: demoUserIds,
                      },
                    },
                    {
                      invitedByPlayerId: {
                        in: demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.challengeParticipants =
    demoChallengeIds.length > 0 || demoUserIds.length > 0
      ? await prisma.challengeParticipant.count({
          where: {
            OR: [
              ...(demoChallengeIds.length > 0
                ? [
                    {
                      challengeId: {
                        in: demoChallengeIds,
                      },
                    },
                  ]
                : []),
              ...(demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.matchPlayers =
    demoMatchIds.length > 0 || demoUserIds.length > 0
      ? await prisma.matchPlayer.count({
          where: {
            OR: [
              ...(demoMatchIds.length > 0
                ? [
                    {
                      matchId: {
                        in: demoMatchIds,
                      },
                    },
                  ]
                : []),
              ...(demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.matchTeams =
    demoMatchIds.length > 0
      ? await prisma.matchTeam.count({
          where: {
            matchId: {
              in: demoMatchIds,
            },
          },
        })
      : 0;

  counts.eloHistory =
    demoProfileIds.length > 0 || demoMatchIds.length > 0
      ? await prisma.eloHistory.count({
          where: {
            OR: [
              ...(demoProfileIds.length > 0
                ? [
                    {
                      playerProfileId: {
                        in: demoProfileIds,
                      },
                    },
                  ]
                : []),
              ...(demoMatchIds.length > 0
                ? [
                    {
                      matchId: {
                        in: demoMatchIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      : 0;

  counts.matches = demoMatchIds.length;
  counts.challenges = demoChallengeIds.length;

  counts.friendships =
    demoUserIds.length > 0
      ? await prisma.friendship.count({
          where: {
            OR: [
              {
                userLowId: {
                  in: demoUserIds,
                },
              },
              {
                userHighId: {
                  in: demoUserIds,
                },
              },
              {
                requesterId: {
                  in: demoUserIds,
                },
              },
              {
                addresseeId: {
                  in: demoUserIds,
                },
              },
              {
                blockerId: {
                  in: demoUserIds,
                },
              },
            ],
          },
        })
      : 0;

  counts.playerProfiles = demoProfileIds.length;
  counts.users = demoUserIds.length;
  counts.supabaseAuthUsers = authDemoUsers.length;

  return {
    demoUsers,
    demoUserIds,
    demoProfileIds,
    demoChallengeIds,
    demoMatchIds,
    demoConversationIds,
    demoNotificationHrefs,
    authDemoUsers,
    counts,
  };
}

async function executeCleanup(plan: CleanupPlan) {
  const deletedCounts = await prisma.$transaction(async (tx) => {
    const summary = createEmptySummary();

    if (plan.demoProfileIds.length > 0 || plan.demoNotificationHrefs.length > 0) {
      summary.notifications = (
        await tx.notification.deleteMany({
          where: {
            OR: [
              ...(plan.demoProfileIds.length > 0
                ? [
                    {
                      playerProfileId: {
                        in: plan.demoProfileIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoNotificationHrefs.length > 0
                ? [
                    {
                      href: {
                        in: plan.demoNotificationHrefs,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;
    }

    if (plan.demoUserIds.length > 0 || plan.demoConversationIds.length > 0) {
      summary.messages = (
        await tx.message.deleteMany({
          where: {
            OR: [
              ...(plan.demoUserIds.length > 0
                ? [
                    {
                      senderId: {
                        in: plan.demoUserIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoConversationIds.length > 0
                ? [
                    {
                      conversationId: {
                        in: plan.demoConversationIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;

      summary.conversationParticipants = (
        await tx.conversationParticipant.deleteMany({
          where: {
            OR: [
              ...(plan.demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: plan.demoUserIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoConversationIds.length > 0
                ? [
                    {
                      conversationId: {
                        in: plan.demoConversationIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;

      const conversationsToDelete = await tx.conversation.findMany({
        where: {
          OR: [
            ...(plan.demoConversationIds.length > 0
              ? [
                  {
                    id: {
                      in: plan.demoConversationIds,
                    },
                  },
                ]
              : []),
            {
              participants: {
                none: {},
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      const conversationIds = conversationsToDelete.map((conversation) => conversation.id);

      if (conversationIds.length > 0) {
        summary.conversations = (
          await tx.conversation.deleteMany({
            where: {
              id: {
                in: conversationIds,
              },
            },
          })
        ).count;
      }
    }

    if (plan.demoChallengeIds.length > 0 || plan.demoUserIds.length > 0) {
      summary.challengeInvites = (
        await tx.challengeInvite.deleteMany({
          where: {
            OR: [
              ...(plan.demoChallengeIds.length > 0
                ? [
                    {
                      challengeId: {
                        in: plan.demoChallengeIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoUserIds.length > 0
                ? [
                    {
                      invitedPlayerId: {
                        in: plan.demoUserIds,
                      },
                    },
                    {
                      invitedByPlayerId: {
                        in: plan.demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;

      summary.challengeParticipants = (
        await tx.challengeParticipant.deleteMany({
          where: {
            OR: [
              ...(plan.demoChallengeIds.length > 0
                ? [
                    {
                      challengeId: {
                        in: plan.demoChallengeIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: plan.demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;
    }

    if (plan.demoMatchIds.length > 0 || plan.demoUserIds.length > 0) {
      summary.matchPlayers = (
        await tx.matchPlayer.deleteMany({
          where: {
            OR: [
              ...(plan.demoMatchIds.length > 0
                ? [
                    {
                      matchId: {
                        in: plan.demoMatchIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoUserIds.length > 0
                ? [
                    {
                      userId: {
                        in: plan.demoUserIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;

      if (plan.demoMatchIds.length > 0) {
        summary.matchTeams = (
          await tx.matchTeam.deleteMany({
            where: {
              matchId: {
                in: plan.demoMatchIds,
              },
            },
          })
        ).count;
      }
    }

    if (plan.demoProfileIds.length > 0 || plan.demoMatchIds.length > 0) {
      summary.eloHistory = (
        await tx.eloHistory.deleteMany({
          where: {
            OR: [
              ...(plan.demoProfileIds.length > 0
                ? [
                    {
                      playerProfileId: {
                        in: plan.demoProfileIds,
                      },
                    },
                  ]
                : []),
              ...(plan.demoMatchIds.length > 0
                ? [
                    {
                      matchId: {
                        in: plan.demoMatchIds,
                      },
                    },
                  ]
                : []),
            ],
          },
        })
      ).count;
    }

    if (plan.demoMatchIds.length > 0) {
      summary.matches = (
        await tx.match.deleteMany({
          where: {
            id: {
              in: plan.demoMatchIds,
            },
          },
        })
      ).count;
    }

    if (plan.demoChallengeIds.length > 0) {
      summary.challenges = (
        await tx.challenge.deleteMany({
          where: {
            id: {
              in: plan.demoChallengeIds,
            },
          },
        })
      ).count;
    }

    if (plan.demoUserIds.length > 0) {
      summary.friendships = (
        await tx.friendship.deleteMany({
          where: {
            OR: [
              {
                userLowId: {
                  in: plan.demoUserIds,
                },
              },
              {
                userHighId: {
                  in: plan.demoUserIds,
                },
              },
              {
                requesterId: {
                  in: plan.demoUserIds,
                },
              },
              {
                addresseeId: {
                  in: plan.demoUserIds,
                },
              },
              {
                blockerId: {
                  in: plan.demoUserIds,
                },
              },
            ],
          },
        })
      ).count;
    }

    if (plan.demoProfileIds.length > 0) {
      summary.playerProfiles = (
        await tx.playerProfile.deleteMany({
          where: {
            id: {
              in: plan.demoProfileIds,
            },
          },
        })
      ).count;
    }

    if (plan.demoUserIds.length > 0) {
      summary.users = (
        await tx.user.deleteMany({
          where: {
            id: {
              in: plan.demoUserIds,
            },
          },
        })
      ).count;
    }

    return summary;
  });

  let deletedAuthUsers = 0;

  if (supabaseAdmin && plan.authDemoUsers.length > 0) {
    for (const authUser of plan.authDemoUsers) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);

      if (error) {
        throw error;
      }

      deletedAuthUsers += 1;
    }
  }

  return {
    ...deletedCounts,
    supabaseAuthUsers: deletedAuthUsers,
  } satisfies CleanupSummary;
}

function printDetectedUsers(plan: CleanupPlan) {
  if (plan.demoUsers.length === 0) {
    console.log("No se han detectado usuarios demo en la base de datos de la app.");
  } else {
    console.log("Usuarios demo detectados en la app:");
    console.table(
      plan.demoUsers.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profileId: user.profileId ?? "-",
      })),
    );
  }

  if (!supabaseAdmin) {
    console.log(
      "Supabase Auth no se revisa porque faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.",
    );
    return;
  }

  if (plan.authDemoUsers.length === 0) {
    console.log("No se han detectado cuentas demo en Supabase Auth.");
    return;
  }

  console.log("Cuentas demo detectadas en Supabase Auth:");
  console.table(
    plan.authDemoUsers.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? "-",
    })),
  );
}

function printSummary(mode: "dry-run" | "cleanup", summary: CleanupSummary) {
  console.log(
    mode === "dry-run"
      ? "Resumen de lo que se borraria:"
      : "Resumen de registros eliminados:",
  );

  console.table(summary);
}

async function main() {
  console.log(
    confirmCleanup
      ? "Modo limpieza real activado."
      : "Modo dry-run activo. No se borrara ningun dato sin MUSLEAGUE_CONFIRM_CLEANUP=true.",
  );
  console.log(`Zonas base protegidas: ${baseZoneSlugs.join(", ")}.`);

  const plan = await buildCleanupPlan();

  printDetectedUsers(plan);
  printSummary("dry-run", plan.counts);

  if (!confirmCleanup) {
    console.log(
      "Para ejecutar el borrado real, lanza el script con MUSLEAGUE_CONFIRM_CLEANUP=true.",
    );
    return;
  }

  const deleted = await executeCleanup(plan);
  printSummary("cleanup", deleted);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Demo cleanup failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
