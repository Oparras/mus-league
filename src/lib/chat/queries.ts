import "server-only";

import { ConversationType, type Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { getChallengeSeatsLabel } from "@/lib/challenges/links";

const conversationListInclude = {
  challenge: {
    include: {
      league: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
    },
  },
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
      joinedAt: "asc",
    },
  },
  messages: {
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
} satisfies Prisma.ConversationInclude;

const conversationDetailInclude = {
  challenge: {
    include: {
      league: true,
      participants: {
        include: {
          user: true,
        },
        orderBy: {
          seatIndex: "asc",
        },
      },
    },
  },
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
      joinedAt: "asc",
    },
  },
  messages: {
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 80,
  },
} satisfies Prisma.ConversationInclude;

export type ConversationListItem = Prisma.ConversationGetPayload<{
  include: typeof conversationListInclude;
}>;

export type ConversationDetail = Prisma.ConversationGetPayload<{
  include: typeof conversationDetailInclude;
}>;

export function getDirectConversationKey(userAId: string, userBId: string) {
  return userAId < userBId ? `${userAId}:${userBId}` : `${userBId}:${userAId}`;
}

export function getConversationCounterpart(
  conversation: {
    type: ConversationType;
    participants: Array<{
      userId: string;
      user: {
        displayName: string;
        avatarUrl: string | null;
        profile: {
          city: string;
          preferredLeague: {
            name: string;
          } | null;
        } | null;
      };
    }>;
  },
  viewerUserId: string,
) {
  if (conversation.type !== ConversationType.DIRECT) {
    return null;
  }

  return (
    conversation.participants.find((participant) => participant.userId !== viewerUserId) ?? null
  );
}

export function getConversationTitle(
  conversation: ConversationListItem | ConversationDetail,
  viewerUserId: string,
) {
  if (conversation.type === ConversationType.DIRECT) {
    return getConversationCounterpart(conversation, viewerUserId)?.user.displayName ?? "Chat directo";
  }

  if (conversation.challenge?.locationName) {
    return conversation.challenge.locationName;
  }

  return conversation.challenge?.league.name
    ? `Mesa en ${conversation.challenge.league.name}`
    : "Chat de la mesa";
}

export function getConversationDescription(
  conversation: ConversationListItem | ConversationDetail,
  viewerUserId: string,
) {
  if (conversation.type === ConversationType.DIRECT) {
    const counterpart = getConversationCounterpart(conversation, viewerUserId);

    if (!counterpart) {
      return "Conversacion privada entre jugadores.";
    }

    const segments = [
      counterpart.user.profile?.preferredLeague?.name ?? null,
      counterpart.user.profile?.city ?? null,
    ].filter(Boolean);

    return segments.join(" · ") || "Conversacion privada entre jugadores.";
  }

  if (!conversation.challenge) {
    return "Conversacion de reto.";
  }

  return `${conversation.challenge.league.name} · ${getChallengeSeatsLabel(
    conversation.challenge.participants.length,
  )}`;
}

export async function getConversationsForUser(userId: string) {
  const prisma = getPrismaClient();
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId,
        },
      },
    },
    include: conversationListInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return conversations.sort((left, right) => {
    const leftTimestamp =
      left.messages[0]?.createdAt.getTime() ?? left.updatedAt.getTime();
    const rightTimestamp =
      right.messages[0]?.createdAt.getTime() ?? right.updatedAt.getTime();

    return rightTimestamp - leftTimestamp;
  });
}

export async function getConversationDetailForUser(
  userId: string,
  conversationId: string,
) {
  const prisma = getPrismaClient();

  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: {
          userId,
        },
      },
    },
    include: conversationDetailInclude,
  });
}

export async function getChallengeConversationForUser(
  userId: string,
  challengeId: string,
) {
  const prisma = getPrismaClient();

  return prisma.conversation.findFirst({
    where: {
      challengeId,
      participants: {
        some: {
          userId,
        },
      },
    },
    include: conversationDetailInclude,
  });
}
