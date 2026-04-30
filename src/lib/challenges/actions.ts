"use server";

import { redirect } from "next/navigation";

import {
  ChallengeStatus,
  LobbyTeamSlot,
  MatchStatus,
  Prisma,
} from "@/generated/prisma/client";
import {
  editableChallengeStatuses,
  joinableChallengeStatuses,
} from "@/lib/challenges/constants";
import { getChallengePath } from "@/lib/challenges/links";
import {
  createChallengeSchema,
  disputeMatchResultSchema,
  submitMatchResultSchema,
  validateMatchResultByFormat,
} from "@/lib/challenges/schemas";
import { requireCompletedProfile } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/db/prisma";
import { applyConfirmedMatchElo } from "@/lib/elo/apply";
import { z } from "zod";

const teamAssignmentSchema = z.object({
  challengeId: z.string().trim().min(1, "Falta el identificador del reto."),
  participantId: z.string().trim().min(1, "Falta el identificador del jugador."),
  teamSlot: z.enum(["TEAM_A", "TEAM_B", "UNASSIGNED"]),
});

const challengeIdSchema = z.object({
  challengeId: z.string().trim().min(1, "Falta el identificador del reto."),
});

function redirectWithMessage(
  path: string,
  kind: "error" | "message",
  message: string,
): never {
  const searchParams = new URLSearchParams({
    [kind]: message,
  });

  redirect(`${path}?${searchParams.toString()}`);
}

function generateInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function isStatusInList(
  status: ChallengeStatus,
  list: readonly ChallengeStatus[],
) {
  return list.some((item) => item === status);
}

function getNextSeatIndex(participants: { seatIndex: number }[]) {
  for (let seatIndex = 1; seatIndex <= 4; seatIndex += 1) {
    if (!participants.some((participant) => participant.seatIndex === seatIndex)) {
      return seatIndex;
    }
  }

  return null;
}

function shuffleParticipants<T>(participants: T[]) {
  const copy = [...participants];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

async function getChallengeForMutation(
  tx: Prisma.TransactionClient,
  challengeId: string,
) {
  return tx.challenge.findUnique({
    where: {
      id: challengeId,
    },
    include: {
      participants: {
        orderBy: {
          seatIndex: "asc",
        },
      },
      match: {
        include: {
          matchPlayers: {
            include: {
              team: true,
            },
          },
        },
      },
    },
  });
}

function assertParticipant(
  viewerId: string,
  participants: {
    userId: string;
  }[],
) {
  return participants.some((participant) => participant.userId === viewerId);
}

function getParticipantTeamSlot(
  participants: {
    userId: string;
    teamSlot: LobbyTeamSlot | null;
  }[],
  userId: string,
) {
  return participants.find((participant) => participant.userId === userId)?.teamSlot ?? null;
}

function canOpposingTeamReviewResult(options: {
  viewerId: string;
  participants: {
    userId: string;
    teamSlot: LobbyTeamSlot | null;
  }[];
  submittedById: string | null | undefined;
}) {
  if (!options.submittedById || options.viewerId === options.submittedById) {
    return false;
  }

  const viewerTeamSlot = getParticipantTeamSlot(options.participants, options.viewerId);
  const submitterTeamSlot = getParticipantTeamSlot(options.participants, options.submittedById);

  if (!viewerTeamSlot || !submitterTeamSlot) {
    return false;
  }

  return viewerTeamSlot !== submitterTeamSlot;
}

export async function createChallengeAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = createChallengeSchema.safeParse({
    leagueId: formData.get("leagueId"),
    matchFormat: formData.get("matchFormat"),
    description: formData.get("description"),
    locationName: formData.get("locationName"),
    proposedAt: formData.get("proposedAt"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/matches",
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido crear el reto.",
    );
  }

  const prisma = getPrismaClient();
  const league = await prisma.league.findFirst({
    where: {
      id: parsed.data.leagueId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!league) {
    redirectWithMessage("/matches", "error", "La zona seleccionada ya no esta disponible.");
  }

  let challenge: { id: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      challenge = await prisma.challenge.create({
        data: {
          inviteCode: generateInviteCode(),
          leagueId: parsed.data.leagueId,
          creatorId: appUser.id,
          matchFormat: parsed.data.matchFormat,
          description: parsed.data.description ?? null,
          locationName: parsed.data.locationName ?? null,
          proposedAt: parsed.data.proposedAt ?? null,
          status: ChallengeStatus.OPEN,
          participants: {
            create: {
              userId: appUser.id,
              seatIndex: 1,
            },
          },
        },
        select: {
          id: true,
        },
      });
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  if (!challenge) {
    redirectWithMessage("/matches", "error", "No hemos podido generar la invitacion del reto.");
  }

  redirectWithMessage(
    getChallengePath(challenge.id),
    "message",
    "Reto creado. Ya estas dentro de la mesa.",
  );
}

export async function joinChallengeAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = challengeIdSchema.safeParse({
    challengeId: formData.get("challengeId"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido unirte a este reto.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  try {
    await prisma.$transaction(async (tx) => {
      const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

      if (!challenge) {
        redirectWithMessage("/matches", "error", "No hemos encontrado ese reto.");
      }

      if (!isStatusInList(challenge.status, joinableChallengeStatuses)) {
        redirectWithMessage(challengePath, "error", "Este reto ya no admite mas jugadores.");
      }

      if (challenge.participants.some((participant) => participant.userId === appUser.id)) {
        redirectWithMessage(challengePath, "message", "Ya formas parte de este reto.");
      }

      if (challenge.participants.length >= 4) {
        redirectWithMessage(challengePath, "error", "Este reto ya no tiene plazas libres.");
      }

      const nextSeatIndex = getNextSeatIndex(challenge.participants);

      if (!nextSeatIndex) {
        redirectWithMessage(challengePath, "error", "Este reto ya no tiene plazas libres.");
      }

      await tx.challengeParticipant.create({
        data: {
          challengeId: challenge.id,
          userId: appUser.id,
          seatIndex: nextSeatIndex,
        },
      });

      await tx.challenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          status:
            challenge.participants.length + 1 >= 4
              ? ChallengeStatus.FULL
              : ChallengeStatus.OPEN,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectWithMessage(challengePath, "error", "La ultima plaza acaba de ocuparse.");
    }

    throw error;
  }

  redirectWithMessage(challengePath, "message", "Ya estas apuntado al reto.");
}

export async function leaveChallengeAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = challengeIdSchema.safeParse({
    challengeId: formData.get("challengeId"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido sacarte de este reto.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge) {
      redirectWithMessage("/matches", "error", "No hemos encontrado ese reto.");
    }

    if (
      challenge.status === ChallengeStatus.IN_PROGRESS ||
      challenge.status === ChallengeStatus.TEAMS_LOCKED ||
      challenge.teamsLockedAt
    ) {
      redirectWithMessage(challengePath, "error", "Los equipos ya estan bloqueados en este reto.");
    }

    const viewerParticipant = challenge.participants.find(
      (participant) => participant.userId === appUser.id,
    );

    if (!viewerParticipant) {
      redirectWithMessage(challengePath, "error", "No formas parte de este reto.");
    }

    await tx.challengeParticipant.delete({
      where: {
        id: viewerParticipant.id,
      },
    });

    const remainingCount = challenge.participants.length - 1;

    if (remainingCount <= 0) {
      await tx.challenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          status: ChallengeStatus.CANCELLED,
          teamsLockedAt: null,
        },
      });

      return;
    }

    await tx.challengeParticipant.updateMany({
      where: {
        challengeId: challenge.id,
      },
      data: {
        teamSlot: null,
      },
    });

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.OPEN,
        teamsLockedAt: null,
      },
    });
  });

  redirectWithMessage(challengePath, "message", "Has salido del reto.");
}

export async function assignParticipantTeamAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = teamAssignmentSchema.safeParse({
    challengeId: formData.get("challengeId"),
    participantId: formData.get("participantId"),
    teamSlot: formData.get("teamSlot"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido actualizar el lobby.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge) {
      redirectWithMessage("/matches", "error", "No hemos encontrado ese reto.");
    }

    if (!assertParticipant(appUser.id, challenge.participants)) {
      redirectWithMessage(challengePath, "error", "Solo los participantes pueden editar el lobby.");
    }

    if (
      challenge.participants.length !== 4 ||
      !isStatusInList(challenge.status, editableChallengeStatuses)
    ) {
      redirectWithMessage(challengePath, "error", "El lobby no se puede editar ahora mismo.");
    }

    const targetParticipant = challenge.participants.find(
      (participant) => participant.id === parsed.data.participantId,
    );

    if (!targetParticipant) {
      redirectWithMessage(challengePath, "error", "No hemos encontrado a ese jugador en el reto.");
    }

    const teamSlot =
      parsed.data.teamSlot === "UNASSIGNED"
        ? null
        : (parsed.data.teamSlot as LobbyTeamSlot);

    if (teamSlot) {
      const teamCount = challenge.participants.filter(
        (participant) =>
          participant.id !== targetParticipant.id && participant.teamSlot === teamSlot,
      ).length;

      if (teamCount >= 2) {
        redirectWithMessage(
          challengePath,
          "error",
          "Ese equipo ya esta completo. Saca antes a otra persona.",
        );
      }
    }

    await tx.challengeParticipant.update({
      where: {
        id: targetParticipant.id,
      },
      data: {
        teamSlot,
      },
    });

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.TEAMS_EDITING,
      },
    });
  });

  redirectWithMessage(challengePath, "message", "Equipos actualizados.");
}

export async function randomizeChallengeTeamsAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = challengeIdSchema.safeParse({
    challengeId: formData.get("challengeId"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido aleatorizar el lobby.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge) {
      redirectWithMessage("/matches", "error", "No hemos encontrado ese reto.");
    }

    if (!assertParticipant(appUser.id, challenge.participants)) {
      redirectWithMessage(challengePath, "error", "Solo los participantes pueden aleatorizar equipos.");
    }

    if (
      challenge.participants.length !== 4 ||
      !isStatusInList(challenge.status, editableChallengeStatuses)
    ) {
      redirectWithMessage(challengePath, "error", "El lobby no se puede editar ahora mismo.");
    }

    const randomizedParticipants = shuffleParticipants(challenge.participants);

    for (const [index, participant] of randomizedParticipants.entries()) {
      await tx.challengeParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          teamSlot: index < 2 ? LobbyTeamSlot.TEAM_A : LobbyTeamSlot.TEAM_B,
        },
      });
    }

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.TEAMS_EDITING,
      },
    });
  });

  redirectWithMessage(challengePath, "message", "Equipos sorteados.");
}

export async function startChallengeMatchAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = challengeIdSchema.safeParse({
    challengeId: formData.get("challengeId"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido iniciar esta partida.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge) {
      redirectWithMessage("/matches", "error", "No hemos encontrado ese reto.");
    }

    if (!assertParticipant(appUser.id, challenge.participants)) {
      redirectWithMessage(challengePath, "error", "Solo los participantes pueden bloquear equipos.");
    }

    if (
      challenge.participants.length !== 4 ||
      !isStatusInList(challenge.status, editableChallengeStatuses)
    ) {
      redirectWithMessage(challengePath, "error", "El lobby todavia no esta listo para empezar.");
    }

    if (challenge.match) {
      redirectWithMessage(challengePath, "message", "Este reto ya esta en curso.");
    }

    const teamAPlayers = challenge.participants.filter(
      (participant) => participant.teamSlot === LobbyTeamSlot.TEAM_A,
    );
    const teamBPlayers = challenge.participants.filter(
      (participant) => participant.teamSlot === LobbyTeamSlot.TEAM_B,
    );

    if (teamAPlayers.length !== 2 || teamBPlayers.length !== 2) {
      redirectWithMessage(
        challengePath,
        "error",
        "Necesitas dos jugadores en cada equipo antes de iniciar la partida.",
      );
    }

    const now = new Date();
    const match = await tx.match.create({
      data: {
        challengeId: challenge.id,
        leagueId: challenge.leagueId,
        format: challenge.matchFormat,
        description: challenge.description ?? null,
        scheduledAt: challenge.proposedAt ?? null,
        startedAt: now,
        status: MatchStatus.IN_PROGRESS,
      },
    });

    const teamARecord = await tx.matchTeam.create({
      data: {
        matchId: match.id,
        slot: LobbyTeamSlot.TEAM_A,
        name: "Equipo A",
      },
    });
    const teamBRecord = await tx.matchTeam.create({
      data: {
        matchId: match.id,
        slot: LobbyTeamSlot.TEAM_B,
        name: "Equipo B",
      },
    });

    await tx.matchPlayer.createMany({
      data: [
        ...teamAPlayers.map((participant, index) => ({
          matchId: match.id,
          teamId: teamARecord.id,
          userId: participant.userId,
          seatIndex: index + 1,
        })),
        ...teamBPlayers.map((participant, index) => ({
          matchId: match.id,
          teamId: teamBRecord.id,
          userId: participant.userId,
          seatIndex: index + 1,
        })),
      ],
    });

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.IN_PROGRESS,
        teamsLockedAt: now,
        startedAt: now,
      },
    });
  });

  redirectWithMessage(
    challengePath,
    "message",
    "Partida en curso. Los equipos ya estan cerrados.",
  );
}

export async function submitMatchResultAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = submitMatchResultSchema.safeParse({
    challengeId: formData.get("challengeId"),
    winnerTeamSlot: formData.get("winnerTeamSlot"),
    teamAScore: formData.get("teamAScore"),
    teamBScore: formData.get("teamBScore"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/matches",
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido registrar el resultado.",
    );
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge || !challenge.match) {
      redirectWithMessage(challengePath, "error", "Este reto no tiene una partida activa.");
    }

    if (challenge.status !== ChallengeStatus.IN_PROGRESS) {
      redirectWithMessage(challengePath, "error", "La partida no admite envio de resultado ahora mismo.");
    }

    if (!assertParticipant(appUser.id, challenge.participants)) {
      redirectWithMessage(challengePath, "error", "Solo los participantes pueden registrar el resultado.");
    }

    const format = challenge.match.format ?? challenge.matchFormat;
    const formatError = validateMatchResultByFormat({
      format,
      winnerTeamSlot: parsed.data.winnerTeamSlot,
      teamAScore: parsed.data.teamAScore,
      teamBScore: parsed.data.teamBScore,
    });

    if (formatError) {
      redirectWithMessage(challengePath, "error", formatError);
    }

    const submittedAt = new Date();

    await tx.match.update({
      where: {
        id: challenge.match.id,
      },
      data: {
        status: MatchStatus.COMPLETED,
        winnerTeamSlot: parsed.data.winnerTeamSlot,
        teamAScore: parsed.data.teamAScore,
        teamBScore: parsed.data.teamBScore,
        submittedAt,
        submittedById: appUser.id,
        confirmedAt: null,
        confirmedById: null,
        disputeReason: null,
        endedAt: submittedAt,
      },
    });

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.RESULT_SUBMITTED,
      },
    });
  });

  redirectWithMessage(
    challengePath,
    "message",
    "Resultado enviado. Ahora debe confirmarlo el otro equipo.",
  );
}

export async function confirmMatchResultAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = challengeIdSchema.safeParse({
    challengeId: formData.get("challengeId"),
  });

  if (!parsed.success) {
    redirectWithMessage("/matches", "error", "No hemos podido confirmar este resultado.");
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  try {
    await prisma.$transaction(async (tx) => {
      const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

      if (!challenge || !challenge.match) {
        redirectWithMessage(
          challengePath,
          "error",
          "Este reto no tiene un resultado pendiente de revisar.",
        );
      }

      if (challenge.status !== ChallengeStatus.RESULT_SUBMITTED) {
        redirectWithMessage(challengePath, "error", "Este resultado no se puede confirmar ahora mismo.");
      }

      if (
        !canOpposingTeamReviewResult({
          viewerId: appUser.id,
          participants: challenge.participants,
          submittedById: challenge.match.submittedById,
        })
      ) {
        redirectWithMessage(
          challengePath,
          "error",
          "Solo un jugador del equipo rival puede confirmar este resultado.",
        );
      }

      const confirmedAt = new Date();

      await tx.match.update({
        where: {
          id: challenge.match.id,
        },
        data: {
          status: MatchStatus.VERIFIED,
          confirmedById: appUser.id,
          confirmedAt,
        },
      });

      await applyConfirmedMatchElo(tx, challenge.match.id);

      await tx.challenge.update({
        where: {
          id: challenge.id,
        },
        data: {
          status: ChallengeStatus.CONFIRMED,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirectWithMessage(
        challengePath,
        "message",
        "Este resultado ya estaba confirmado y el ELO ya habia sido aplicado.",
      );
    }

    throw error;
  }

  redirectWithMessage(
    challengePath,
    "message",
    "Resultado confirmado. El historial y el ELO ya estan actualizados.",
  );
}

export async function disputeMatchResultAction(formData: FormData) {
  const { appUser } = await requireCompletedProfile();
  const parsed = disputeMatchResultSchema.safeParse({
    challengeId: formData.get("challengeId"),
    disputeReason: formData.get("disputeReason"),
  });

  if (!parsed.success) {
    redirectWithMessage(
      "/matches",
      "error",
      parsed.error.issues[0]?.message ?? "No hemos podido disputar este resultado.",
    );
  }

  const prisma = getPrismaClient();
  const challengePath = getChallengePath(parsed.data.challengeId);

  await prisma.$transaction(async (tx) => {
    const challenge = await getChallengeForMutation(tx, parsed.data.challengeId);

    if (!challenge || !challenge.match) {
      redirectWithMessage(challengePath, "error", "Este reto no tiene un resultado pendiente de revisar.");
    }

    if (challenge.status !== ChallengeStatus.RESULT_SUBMITTED) {
      redirectWithMessage(challengePath, "error", "Este resultado no se puede disputar ahora mismo.");
    }

    if (
      !canOpposingTeamReviewResult({
        viewerId: appUser.id,
        participants: challenge.participants,
        submittedById: challenge.match.submittedById,
      })
    ) {
        redirectWithMessage(
          challengePath,
          "error",
          "Solo un jugador del equipo rival puede disputar este resultado.",
        );
      }

    await tx.match.update({
      where: {
        id: challenge.match.id,
      },
      data: {
        disputeReason: parsed.data.disputeReason ?? null,
      },
    });

    await tx.challenge.update({
      where: {
        id: challenge.id,
      },
      data: {
        status: ChallengeStatus.DISPUTED,
      },
    });
  });

  redirectWithMessage(
    challengePath,
    "message",
    "Resultado en disputa. Esta mesa queda fuera del historial confirmado por ahora.",
  );
}
