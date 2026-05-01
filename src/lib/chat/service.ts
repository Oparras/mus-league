import "server-only";

import {
  ConversationType,
  type Prisma,
} from "@/generated/prisma/client";
import { getDirectConversationKey } from "@/lib/chat/queries";

async function ensureConversationParticipants(
  tx: Prisma.TransactionClient,
  conversationId: string,
  userIds: string[],
) {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  for (const userId of uniqueUserIds) {
    await tx.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      update: {},
      create: {
        conversationId,
        userId,
      },
    });
  }
}

export async function ensureDirectConversation(
  tx: Prisma.TransactionClient,
  userAId: string,
  userBId: string,
) {
  const directKey = getDirectConversationKey(userAId, userBId);
  const existingConversation = await tx.conversation.findUnique({
    where: {
      directKey,
    },
    select: {
      id: true,
    },
  });

  if (existingConversation) {
    await ensureConversationParticipants(tx, existingConversation.id, [userAId, userBId]);
    return existingConversation;
  }

  return tx.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      directKey,
      participants: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
    select: {
      id: true,
    },
  });
}

export async function ensureChallengeConversation(
  tx: Prisma.TransactionClient,
  challengeId: string,
  participantUserIds: string[],
) {
  const existingConversation = await tx.conversation.findUnique({
    where: {
      challengeId,
    },
    select: {
      id: true,
    },
  });

  if (existingConversation) {
    await ensureConversationParticipants(tx, existingConversation.id, participantUserIds);
    return existingConversation;
  }

  return tx.conversation.create({
    data: {
      type: ConversationType.CHALLENGE,
      challengeId,
      participants: {
        create: [...new Set(participantUserIds)].map((userId) => ({
          userId,
        })),
      },
    },
    select: {
      id: true,
    },
  });
}

export async function addUserToChallengeConversation(
  tx: Prisma.TransactionClient,
  challengeId: string,
  userId: string,
) {
  const participants = await tx.challengeParticipant.findMany({
    where: {
      challengeId,
    },
    select: {
      userId: true,
    },
  });

  await ensureChallengeConversation(
    tx,
    challengeId,
    [...participants.map((participant) => participant.userId), userId],
  );
}

export async function removeUserFromChallengeConversation(
  tx: Prisma.TransactionClient,
  challengeId: string,
  userId: string,
) {
  const conversation = await tx.conversation.findUnique({
    where: {
      challengeId,
    },
    select: {
      id: true,
    },
  });

  if (!conversation) {
    return;
  }

  await tx.conversationParticipant.deleteMany({
    where: {
      conversationId: conversation.id,
      userId,
    },
  });
}
