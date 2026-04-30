import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

import {
  ChallengeStatus,
  LeagueType,
  LobbyTeamSlot,
  MatchFormat,
  MatchStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.MUSLEAGUE_DEMO_PASSWORD ?? "MusLeague123!";
if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be configured to run the seed.");
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

type ZoneSeed = {
  slug: string;
  name: string;
  type: LeagueType;
  parentSlug?: string;
  description?: string;
};

type DemoUserSeed = {
  email: string;
  displayName: string;
  city: string;
  zoneSlug: string;
  bio: string;
};

type OpenChallengeSeed = {
  leagueSlug: string;
  creatorEmail: string;
  description: string;
  locationName?: string;
  matchFormat: MatchFormat;
  status: Extract<ChallengeStatus, "OPEN" | "FULL" | "TEAMS_EDITING">;
  proposedAt?: string;
  participants: Array<{
    email: string;
    seatIndex: number;
    teamSlot?: LobbyTeamSlot;
  }>;
};

type ConfirmedMatchSeed = {
  leagueSlug: string;
  creatorEmail: string;
  description: string;
  locationName?: string;
  matchFormat: MatchFormat;
  teamAEmails: [string, string];
  teamBEmails: [string, string];
  teamAScore: number;
  teamBScore: number;
  winnerTeamSlot: LobbyTeamSlot;
  proposedAt?: string;
  startedAt: string;
  endedAt: string;
  submittedByEmail: string;
  confirmedByEmail: string;
};

type DemoProfileState = {
  profileId: string;
  userId: string;
  email: string;
  displayName: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
};

type DemoIdentity = {
  id: string;
  displayName: string;
  avatarUrl: string;
  hasAuthAccount: boolean;
};

const zoneSeeds: ZoneSeed[] = [
  {
    slug: "global",
    name: "Global",
    type: LeagueType.GLOBAL,
    description: "Clasificacion general y vision completa de la comunidad.",
  },
  {
    slug: "madrid-centro",
    name: "Madrid Centro",
    type: LeagueType.REGION,
    parentSlug: "global",
    description: "Centro de juego para mesas urbanas, rapidas y muy activas.",
  },
  {
    slug: "madrid-norte",
    name: "Madrid Norte",
    type: LeagueType.REGION,
    parentSlug: "global",
    description: "Zona amplia para jugadores del norte y alrededores.",
  },
  {
    slug: "madrid-sur",
    name: "Madrid Sur",
    type: LeagueType.REGION,
    parentSlug: "global",
    description: "Zona amplia para retos entre Getafe, Leganes, Mostoles y cercanos.",
  },
  {
    slug: "madrid-este",
    name: "Madrid Este",
    type: LeagueType.REGION,
    parentSlug: "global",
    description: "Zona amplia para mesas al este de la ciudad.",
  },
  {
    slug: "madrid-oeste",
    name: "Madrid Oeste",
    type: LeagueType.REGION,
    parentSlug: "global",
    description: "Zona amplia para quedadas hacia Mostoles, Alcorcon y alrededores.",
  },
];

const demoUsers: DemoUserSeed[] = [
  {
    email: "alba@getmusleague.test",
    displayName: "Alba Serrano",
    city: "Getafe",
    zoneSlug: "madrid-sur",
    bio: "Le gusta cerrar mesas rapidas entre semana y suele mover retos por Getafe y Leganes.",
  },
  {
    email: "borja@getmusleague.test",
    displayName: "Borja Luna",
    city: "Plaza de Castilla",
    zoneSlug: "madrid-norte",
    bio: "Suele jugar al caer la tarde y siempre aparece cuando falta una pareja para cerrar mesa.",
  },
  {
    email: "carla@getmusleague.test",
    displayName: "Carla Mena",
    city: "Retiro",
    zoneSlug: "madrid-centro",
    bio: "Prefiere partidas a 30 puntos, sitios tranquilos y horarios bien cerrados.",
  },
  {
    email: "diego@getmusleague.test",
    displayName: "Diego Plaza",
    city: "Mostoles",
    zoneSlug: "madrid-oeste",
    bio: "Se apunta mucho a partidas nocturnas y suele proponer bar o casa con tiempo.",
  },
  {
    email: "elena@getmusleague.test",
    displayName: "Elena Cobo",
    city: "Coslada",
    zoneSlug: "madrid-este",
    bio: "Le van las partidas largas y las mesas donde el marcador se cierra con calma.",
  },
  {
    email: "fernando@getmusleague.test",
    displayName: "Fernando Vidal",
    city: "Aluche",
    zoneSlug: "madrid-oeste",
    bio: "Le gusta abrir retos con hora propuesta y dejar claro el sitio desde el principio.",
  },
  {
    email: "gema@getmusleague.test",
    displayName: "Gema Torres",
    city: "Leganes centro",
    zoneSlug: "madrid-sur",
    bio: "Se mueve por toda la zona sur y suele juntar perfiles de distintos barrios y municipios.",
  },
  {
    email: "hugo@getmusleague.test",
    displayName: "Hugo Rojas",
    city: "Malasana",
    zoneSlug: "madrid-centro",
    bio: "Perfil comodin para mesas competitivas, ranking alto y retos con ritmo.",
  },
];

const openChallenges: OpenChallengeSeed[] = [
  {
    leagueSlug: "madrid-sur",
    creatorEmail: "alba@getmusleague.test",
    description: "Mesa abierta para esta tarde. Buen ambiente, ritmo serio y ganas de repetir.",
    locationName: "Getafe",
    matchFormat: MatchFormat.POINTS_30,
    status: ChallengeStatus.OPEN,
    proposedAt: "2026-05-03T19:00:00.000Z",
    participants: [
      { email: "alba@getmusleague.test", seatIndex: 1 },
      { email: "borja@getmusleague.test", seatIndex: 2 },
    ],
  },
  {
    leagueSlug: "madrid-centro",
    creatorEmail: "hugo@getmusleague.test",
    description: "Mesa completa pendiente de repartir parejas antes de arrancar.",
    locationName: "Bar La Plaza",
    matchFormat: MatchFormat.POINTS_40,
    status: ChallengeStatus.FULL,
    proposedAt: "2026-05-02T20:30:00.000Z",
    participants: [
      { email: "hugo@getmusleague.test", seatIndex: 1 },
      { email: "carla@getmusleague.test", seatIndex: 2 },
      { email: "diego@getmusleague.test", seatIndex: 3 },
      { email: "elena@getmusleague.test", seatIndex: 4 },
    ],
  },
  {
    leagueSlug: "madrid-sur",
    creatorEmail: "gema@getmusleague.test",
    description: "La mesa ya esta llena. Solo falta decidir parejas y empezar.",
    locationName: "Leganes centro",
    matchFormat: MatchFormat.BEST_OF_3_VACAS,
    status: ChallengeStatus.TEAMS_EDITING,
    proposedAt: "2026-05-04T18:45:00.000Z",
    participants: [
      { email: "gema@getmusleague.test", seatIndex: 1, teamSlot: LobbyTeamSlot.TEAM_A },
      { email: "hugo@getmusleague.test", seatIndex: 2, teamSlot: LobbyTeamSlot.TEAM_B },
      { email: "fernando@getmusleague.test", seatIndex: 3, teamSlot: LobbyTeamSlot.TEAM_A },
      { email: "alba@getmusleague.test", seatIndex: 4 },
    ],
  },
  {
    leagueSlug: "madrid-oeste",
    creatorEmail: "diego@getmusleague.test",
    description: "Reto express para hoy. Si entras, jugamos en cuanto se complete la cuarta plaza.",
    locationName: "Mostoles",
    matchFormat: MatchFormat.VACA_FIRST_TO_3,
    status: ChallengeStatus.OPEN,
    participants: [{ email: "diego@getmusleague.test", seatIndex: 1 }],
  },
];

const confirmedMatches: ConfirmedMatchSeed[] = [
  {
    leagueSlug: "madrid-sur",
    creatorEmail: "gema@getmusleague.test",
    description: "Cierre ajustado a 30 puntos con final largo y mucha mano.",
    locationName: "Getafe",
    matchFormat: MatchFormat.POINTS_30,
    teamAEmails: ["alba@getmusleague.test", "borja@getmusleague.test"],
    teamBEmails: ["carla@getmusleague.test", "diego@getmusleague.test"],
    teamAScore: 30,
    teamBScore: 24,
    winnerTeamSlot: LobbyTeamSlot.TEAM_A,
    proposedAt: "2026-04-16T18:00:00.000Z",
    startedAt: "2026-04-16T18:15:00.000Z",
    endedAt: "2026-04-16T19:10:00.000Z",
    submittedByEmail: "alba@getmusleague.test",
    confirmedByEmail: "carla@getmusleague.test",
  },
  {
    leagueSlug: "madrid-norte",
    creatorEmail: "hugo@getmusleague.test",
    description: "Primera a 3 vacas con ida y vuelta hasta la ultima mano.",
    locationName: "Plaza de Castilla",
    matchFormat: MatchFormat.VACA_FIRST_TO_3,
    teamAEmails: ["elena@getmusleague.test", "fernando@getmusleague.test"],
    teamBEmails: ["gema@getmusleague.test", "hugo@getmusleague.test"],
    teamAScore: 2,
    teamBScore: 3,
    winnerTeamSlot: LobbyTeamSlot.TEAM_B,
    proposedAt: "2026-04-18T20:30:00.000Z",
    startedAt: "2026-04-18T20:45:00.000Z",
    endedAt: "2026-04-18T21:40:00.000Z",
    submittedByEmail: "gema@getmusleague.test",
    confirmedByEmail: "elena@getmusleague.test",
  },
  {
    leagueSlug: "madrid-centro",
    creatorEmail: "alba@getmusleague.test",
    description: "Mejor de tres vacas con parejas muy igualadas y cierre limpio.",
    locationName: "Chamberi",
    matchFormat: MatchFormat.BEST_OF_3_VACAS,
    teamAEmails: ["alba@getmusleague.test", "gema@getmusleague.test"],
    teamBEmails: ["borja@getmusleague.test", "elena@getmusleague.test"],
    teamAScore: 2,
    teamBScore: 1,
    winnerTeamSlot: LobbyTeamSlot.TEAM_A,
    proposedAt: "2026-04-22T19:15:00.000Z",
    startedAt: "2026-04-22T19:35:00.000Z",
    endedAt: "2026-04-22T20:25:00.000Z",
    submittedByEmail: "gema@getmusleague.test",
    confirmedByEmail: "borja@getmusleague.test",
  },
  {
    leagueSlug: "madrid-oeste",
    creatorEmail: "fernando@getmusleague.test",
    description: "Mesa a 40 puntos con bastante nivel y ranking en juego.",
    locationName: "Casa de Pedro",
    matchFormat: MatchFormat.POINTS_40,
    teamAEmails: ["carla@getmusleague.test", "fernando@getmusleague.test"],
    teamBEmails: ["diego@getmusleague.test", "hugo@getmusleague.test"],
    teamAScore: 33,
    teamBScore: 40,
    winnerTeamSlot: LobbyTeamSlot.TEAM_B,
    proposedAt: "2026-04-25T21:00:00.000Z",
    startedAt: "2026-04-25T21:20:00.000Z",
    endedAt: "2026-04-25T22:20:00.000Z",
    submittedByEmail: "hugo@getmusleague.test",
    confirmedByEmail: "carla@getmusleague.test",
  },
];

function getAvatarUrl(displayName: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
}

function getDemoUserId(email: string) {
  const handle = email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "demo-player";
  return `seed-user-${handle}`;
}

function getExpectedScore(ownElo: number, opponentElo: number) {
  return 1 / (1 + 10 ** ((opponentElo - ownElo) / 400));
}

function getKFactor(format: MatchFormat) {
  switch (format) {
    case MatchFormat.POINTS_30:
      return 24;
    case MatchFormat.POINTS_40:
      return 28;
    case MatchFormat.VACA_FIRST_TO_3:
      return 32;
    case MatchFormat.BEST_OF_3_VACAS:
      return 40;
  }
}

function getTeamAverageElo(team: DemoProfileState[]) {
  return team.reduce((sum, player) => sum + player.elo, 0) / team.length;
}

async function upsertZones() {
  const zonesBySlug = new Map<string, string>();
  const legacyZoneSlugs = [
    "madrid",
    "getafe",
    "leganes",
    "fuenlabrada",
    "mostoles",
    "alcorcon",
    "parla",
    "pinto",
    "valdemoro",
  ];

  await prisma.league.updateMany({
    where: {
      slug: {
        in: legacyZoneSlugs,
      },
    },
    data: {
      isActive: false,
    },
  });

  for (const zone of zoneSeeds) {
    const parentId = zone.parentSlug ? zonesBySlug.get(zone.parentSlug) : undefined;

    const savedZone = await prisma.league.upsert({
      where: {
        slug: zone.slug,
      },
      update: {
        name: zone.name,
        type: zone.type,
        description: zone.description ?? null,
        parentId: parentId ?? null,
        isActive: true,
        status: "ACTIVE",
        visibility: "PUBLIC",
      },
      create: {
        slug: zone.slug,
        name: zone.name,
        type: zone.type,
        description: zone.description ?? null,
        parentId: parentId ?? null,
        isActive: true,
        status: "ACTIVE",
        visibility: "PUBLIC",
      },
    });

    zonesBySlug.set(zone.slug, savedZone.id);
  }

  return zonesBySlug;
}

async function getExistingAuthUsersByEmail() {
  if (!supabaseAdmin) {
    return new Map<string, string>();
  }

  const usersByEmail = new Map<string, string>();
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
      if (user.email) {
        usersByEmail.set(user.email, user.id);
      }
    }

    hasMore = data.users.length === 200;
    page += 1;
  }

  return usersByEmail;
}

async function upsertDemoAuthUsers() {
  if (!supabaseAdmin) {
    const demoUsersByEmail = new Map<string, DemoIdentity>();

    for (const demoUser of demoUsers) {
      demoUsersByEmail.set(demoUser.email, {
        id: getDemoUserId(demoUser.email),
        displayName: demoUser.displayName,
        avatarUrl: getAvatarUrl(demoUser.displayName),
        hasAuthAccount: false,
      });
    }

    return demoUsersByEmail;
  }

  const existingUsersByEmail = await getExistingAuthUsersByEmail();
  const demoUsersByEmail = new Map<string, DemoIdentity>();

  for (const demoUser of demoUsers) {
    const avatarUrl = getAvatarUrl(demoUser.displayName);
    const existingId = existingUsersByEmail.get(demoUser.email);

    if (existingId) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingId, {
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          display_name: demoUser.displayName,
          avatar_url: avatarUrl,
        },
      });

      if (error || !data.user) {
        throw error ?? new Error(`Unable to update demo auth user ${demoUser.email}.`);
      }

      demoUsersByEmail.set(demoUser.email, {
        id: data.user.id,
        displayName: demoUser.displayName,
        avatarUrl,
        hasAuthAccount: true,
      });
      continue;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: demoUser.email,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        display_name: demoUser.displayName,
        avatar_url: avatarUrl,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error(`Unable to create demo auth user ${demoUser.email}.`);
    }

    demoUsersByEmail.set(demoUser.email, {
      id: data.user.id,
      displayName: demoUser.displayName,
      avatarUrl,
      hasAuthAccount: true,
    });
  }

  return demoUsersByEmail;
}

async function deleteStaleDemoUsers(desiredUserIds: string[]) {
  const staleUsers = await prisma.user.findMany({
    where: {
      email: {
        in: demoUsers.map((user) => user.email),
      },
      id: {
        notIn: desiredUserIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (staleUsers.length === 0) {
    return;
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: staleUsers.map((user) => user.id),
      },
    },
  });
}

async function cleanupDemoActivity(demoUserIds: string[]) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
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
          challenge: {
            is: {
              creatorId: {
                in: demoUserIds,
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  const challenges = await prisma.challenge.findMany({
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
      ],
    },
    select: {
      id: true,
    },
  });

  if (matches.length > 0) {
    await prisma.match.deleteMany({
      where: {
        id: {
          in: matches.map((match) => match.id),
        },
      },
    });
  }

  if (challenges.length > 0) {
    await prisma.challenge.deleteMany({
      where: {
        id: {
          in: challenges.map((challenge) => challenge.id),
        },
      },
    });
  }
}

async function upsertDemoProfiles(options: {
  zonesBySlug: Map<string, string>;
  demoAuthUsersByEmail: Map<string, DemoIdentity>;
}) {
  const profilesByEmail = new Map<string, DemoProfileState>();

  for (const demoUser of demoUsers) {
    const authUser = options.demoAuthUsersByEmail.get(demoUser.email);
    const preferredLeagueId = options.zonesBySlug.get(demoUser.zoneSlug);

    if (!authUser || !preferredLeagueId) {
      throw new Error(`Missing auth user or zone while seeding ${demoUser.email}.`);
    }

    await prisma.user.upsert({
      where: {
        id: authUser.id,
      },
      update: {
        email: demoUser.email,
        displayName: demoUser.displayName,
        avatarUrl: authUser.avatarUrl,
        role: UserRole.PLAYER,
      },
      create: {
        id: authUser.id,
        email: demoUser.email,
        displayName: demoUser.displayName,
        avatarUrl: authUser.avatarUrl,
        role: UserRole.PLAYER,
      },
    });

    const profile = await prisma.playerProfile.upsert({
      where: {
        userId: authUser.id,
      },
      update: {
        city: demoUser.city,
        bio: demoUser.bio,
        preferredLeagueId,
        rating: 1000,
        elo: 1000,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
      create: {
        userId: authUser.id,
        city: demoUser.city,
        bio: demoUser.bio,
        preferredLeagueId,
        rating: 1000,
        elo: 1000,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    profilesByEmail.set(demoUser.email, {
      profileId: profile.id,
      userId: authUser.id,
      email: demoUser.email,
      displayName: demoUser.displayName,
      elo: 1000,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    });
  }

  return profilesByEmail;
}

async function createOpenChallengeSeed(options: {
  zonesBySlug: Map<string, string>;
  demoProfilesByEmail: Map<string, DemoProfileState>;
  seed: OpenChallengeSeed;
}) {
  const leagueId = options.zonesBySlug.get(options.seed.leagueSlug);
  const creator = options.demoProfilesByEmail.get(options.seed.creatorEmail);

  if (!leagueId || !creator) {
    throw new Error(`Missing league or creator for open challenge ${options.seed.description}.`);
  }

  await prisma.challenge.create({
    data: {
      leagueId,
      creatorId: creator.userId,
      matchFormat: options.seed.matchFormat,
      status: options.seed.status,
      description: options.seed.description,
      locationName: options.seed.locationName ?? null,
      proposedAt: options.seed.proposedAt ? new Date(options.seed.proposedAt) : null,
      participants: {
        create: options.seed.participants.map((participant) => {
          const profile = options.demoProfilesByEmail.get(participant.email);

          if (!profile) {
            throw new Error(`Missing demo participant ${participant.email}.`);
          }

          return {
            userId: profile.userId,
            seatIndex: participant.seatIndex,
            teamSlot: participant.teamSlot ?? null,
          };
        }),
      },
    },
  });
}

async function createConfirmedMatchSeed(options: {
  zonesBySlug: Map<string, string>;
  demoProfilesByEmail: Map<string, DemoProfileState>;
  seed: ConfirmedMatchSeed;
}) {
  const leagueId = options.zonesBySlug.get(options.seed.leagueSlug);
  const creator = options.demoProfilesByEmail.get(options.seed.creatorEmail);
  const submittedBy = options.demoProfilesByEmail.get(options.seed.submittedByEmail);
  const confirmedBy = options.demoProfilesByEmail.get(options.seed.confirmedByEmail);
  const teamA = options.seed.teamAEmails.map((email) => options.demoProfilesByEmail.get(email));
  const teamB = options.seed.teamBEmails.map((email) => options.demoProfilesByEmail.get(email));

  if (!leagueId || !creator || !submittedBy || !confirmedBy || teamA.some((player) => !player) || teamB.some((player) => !player)) {
    throw new Error(`Missing references while seeding confirmed match ${options.seed.description}.`);
  }

  const typedTeamA = teamA as DemoProfileState[];
  const typedTeamB = teamB as DemoProfileState[];
  const teamAElo = getTeamAverageElo(typedTeamA);
  const teamBElo = getTeamAverageElo(typedTeamB);
  const expectedTeamA = getExpectedScore(teamAElo, teamBElo);
  const expectedTeamB = 1 - expectedTeamA;
  const scoreTeamA = options.seed.winnerTeamSlot === LobbyTeamSlot.TEAM_A ? 1 : 0;
  const scoreTeamB = options.seed.winnerTeamSlot === LobbyTeamSlot.TEAM_B ? 1 : 0;
  const kFactor = getKFactor(options.seed.matchFormat);
  const teamADelta = Math.round(kFactor * (scoreTeamA - expectedTeamA));
  const teamBDelta = Math.round(kFactor * (scoreTeamB - expectedTeamB));
  const startedAt = new Date(options.seed.startedAt);
  const endedAt = new Date(options.seed.endedAt);

  const challenge = await prisma.challenge.create({
    data: {
      leagueId,
      creatorId: creator.userId,
      matchFormat: options.seed.matchFormat,
      status: ChallengeStatus.CONFIRMED,
      description: options.seed.description,
      locationName: options.seed.locationName ?? null,
      proposedAt: options.seed.proposedAt ? new Date(options.seed.proposedAt) : startedAt,
      startedAt,
      teamsLockedAt: startedAt,
      participants: {
        create: [
          ...typedTeamA.map((player, index) => ({
            userId: player.userId,
            seatIndex: index + 1,
            teamSlot: LobbyTeamSlot.TEAM_A,
          })),
          ...typedTeamB.map((player, index) => ({
            userId: player.userId,
            seatIndex: index + 3,
            teamSlot: LobbyTeamSlot.TEAM_B,
          })),
        ],
      },
    },
  });

  const match = await prisma.match.create({
    data: {
      challengeId: challenge.id,
      leagueId,
      format: options.seed.matchFormat,
      description: options.seed.description,
      scheduledAt: options.seed.proposedAt ? new Date(options.seed.proposedAt) : startedAt,
      startedAt,
      endedAt,
      status: MatchStatus.VERIFIED,
      teamAScore: options.seed.teamAScore,
      teamBScore: options.seed.teamBScore,
      winnerTeamSlot: options.seed.winnerTeamSlot,
      submittedAt: endedAt,
      submittedById: submittedBy.userId,
      confirmedAt: endedAt,
      confirmedById: confirmedBy.userId,
      eloAppliedAt: endedAt,
    },
  });

  const teamARecord = await prisma.matchTeam.create({
    data: {
      matchId: match.id,
      slot: LobbyTeamSlot.TEAM_A,
      name: "Equipo A",
    },
  });

  const teamBRecord = await prisma.matchTeam.create({
    data: {
      matchId: match.id,
      slot: LobbyTeamSlot.TEAM_B,
      name: "Equipo B",
    },
  });

  await prisma.matchPlayer.createMany({
    data: [
      ...typedTeamA.map((player, index) => ({
        matchId: match.id,
        teamId: teamARecord.id,
        userId: player.userId,
        seatIndex: index + 1,
      })),
      ...typedTeamB.map((player, index) => ({
        matchId: match.id,
        teamId: teamBRecord.id,
        userId: player.userId,
        seatIndex: index + 1,
      })),
    ],
  });

  const profileUpdates = [
    ...typedTeamA.map((player) => ({
      player,
      delta: teamADelta,
      won: options.seed.winnerTeamSlot === LobbyTeamSlot.TEAM_A,
    })),
    ...typedTeamB.map((player) => ({
      player,
      delta: teamBDelta,
      won: options.seed.winnerTeamSlot === LobbyTeamSlot.TEAM_B,
    })),
  ];

  for (const entry of profileUpdates) {
    const eloBefore = entry.player.elo;
    const eloAfter = Math.round(eloBefore + entry.delta);

    await prisma.playerProfile.update({
      where: {
        id: entry.player.profileId,
      },
      data: {
        elo: eloAfter,
        rating: eloAfter,
        matchesPlayed: {
          increment: 1,
        },
        wins: {
          increment: entry.won ? 1 : 0,
        },
        losses: {
          increment: entry.won ? 0 : 1,
        },
      },
    });

    await prisma.eloHistory.create({
      data: {
        playerProfileId: entry.player.profileId,
        matchId: match.id,
        eloBefore,
        eloAfter,
        delta: entry.delta,
        createdAt: endedAt,
      },
    });

    entry.player.elo = eloAfter;
    entry.player.matchesPlayed += 1;
    entry.player.wins += entry.won ? 1 : 0;
    entry.player.losses += entry.won ? 0 : 1;
  }
}

async function seedDemoData(zonesBySlug: Map<string, string>) {
  const demoAuthUsersByEmail = await upsertDemoAuthUsers();
  const desiredDemoUserIds = [...demoAuthUsersByEmail.values()].map((user) => user.id);
  const existingDemoUserIds = await prisma.user.findMany({
    where: {
      email: {
        in: demoUsers.map((user) => user.email),
      },
    },
    select: {
      id: true,
    },
  });
  const demoUserIds = [...new Set([...desiredDemoUserIds, ...existingDemoUserIds.map((user) => user.id)])];

  await cleanupDemoActivity(demoUserIds);
  await deleteStaleDemoUsers(desiredDemoUserIds);

  const demoProfilesByEmail = await upsertDemoProfiles({
    zonesBySlug,
    demoAuthUsersByEmail,
  });

  for (const challenge of openChallenges) {
    await createOpenChallengeSeed({
      zonesBySlug,
      demoProfilesByEmail,
      seed: challenge,
    });
  }

  for (const match of confirmedMatches) {
    await createConfirmedMatchSeed({
      zonesBySlug,
      demoProfilesByEmail,
      seed: match,
    });
  }

  return {
    authBackedAccounts: [...demoAuthUsersByEmail.values()].every((user) => user.hasAuthAccount),
    accounts: demoUsers.map((user) => ({
      email: user.email,
      displayName: user.displayName,
      zoneSlug: user.zoneSlug,
    })),
  };
}

async function main() {
  const zonesBySlug = await upsertZones();
  const demoSummary = await seedDemoData(zonesBySlug);

  console.log("Seed completado.");
  if (demoSummary.authBackedAccounts) {
    console.log(`Contrasena demo: ${demoPassword}`);
  } else {
    console.log(
      "Aviso: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Se han creado datos demo en Postgres, pero no cuentas de acceso en Supabase Auth.",
    );
  }
  console.table(demoSummary.accounts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
