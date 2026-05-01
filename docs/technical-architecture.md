# Mus League technical architecture

## Goal

The current baseline covers the main Mus League product loop: authenticated access, broad-zone player discovery, reto creation with optional concrete location, editable 2vs2 lobbies, direct invites, result submission, rival confirmation or dispute, automatic ELO updates, direct chat between friends, challenge chat per table, internal notifications and realistic demo data for QA.

## Stack decisions

- Next.js 16 with the App Router is the application shell.
- Tailwind CSS 4 and shadcn/ui provide design primitives and tokens.
- Prisma 7 models the domain and drives typed database access.
- Supabase provides PostgreSQL plus email/password authentication.
- The Prisma Postgres adapter keeps runtime queries aligned with the current Prisma client flow.
- Supabase Auth cookies are refreshed through root-level `proxy.ts` for SSR-safe access.

## Route strategy

- `src/app/(marketing)` contains the public landing surface.
- `src/app/(marketing)/invite` contains the public invite landing for retos.
- `src/app/(account)` contains login, register and onboarding routes.
- `src/app/(platform)` contains the protected shell and product routes.
- `src/app/api/health/route.ts` exposes runtime readiness information.
- `proxy.ts` refreshes Supabase Auth cookies before App Router rendering and short-circuits no-session access to protected routes.

## Route map

- `/` - public landing page.
- `/login` - Supabase sign-in.
- `/register` - Supabase sign-up.
- `/onboarding` - first-time player profile completion.
- `/dashboard` - current zone, nearby retos, nearby players, current ELO and recent personal movement.
- `/chat` - inbox for direct conversations and challenge conversations.
- `/friends` - friend graph, pending requests and player search.
- `/notifications` - internal notification center for pending and read activity.
- `/leagues` - active zone directory.
- `/leagues/[slug]` - zone detail and player scope.
- `/matches` - retos board, create flow and recent confirmed matches.
- `/matches/[id]` - reto detail, lobby, result capture, rival review and confirmed ELO summary.
- `/invite` - public invite page resolved from `Challenge.inviteCode`.
- `/players/[id]` - public player profile with friendship and direct reto-invite actions.
- `/rankings` - live global and territorial player ladders by ELO.
- `/profile` - profile editing, player stats, ELO movement and match history.
- `/admin` - environment and integration readiness.
- `/api/health` - runtime status endpoint.

## Folder map

```text
src/
  app/
    (account)/
    (marketing)/
    (platform)/
    api/health/
    components/
      auth/
      chat/
      challenges/
      common/
      elo/
    friends/
    layout/
    leagues/
    ui/
  generated/
    prisma/
  lib/
    auth/
    challenges/
    config/
    db/
    elo/
    friends/
    leagues/
    notifications/
    profile/
prisma/
  schema.prisma
  seed.ts
proxy.ts
docs/
  technical-architecture.md
```

## Data model baseline

- `User`
  Stores platform identity and role. `User.id` matches the Supabase Auth user id.
- `PlayerProfile`
  Stores player-facing data plus `preferredLeagueId`, `elo`, `matchesPlayed`, `wins` and `losses`.
- `League`
  Acts as both a future competition container and the territorial graph through `type`, `parentId`, `description` and `isActive`.
- `Season`
  Stores competition cycles for future league play.
- `Team` and `TeamMember`
  Store persistent league rosters for future seasons.
- `Challenge`
  Stores the reto lifecycle: creator, broad zone, optional `locationName`, invite code, match format, optional schedule and state machine.
- `ChallengeParticipant`
  Stores the temporary 4-seat lobby before lock, including manual team assignment.
- `Friendship`
  Stores one record per player pair, including requester, addressee and `PENDING` / `ACCEPTED` / `REJECTED` / `BLOCKED`.
- `ChallengeInvite`
  Stores direct in-app invites from one player to another for a specific reto.
- `Conversation`
  Stores either a direct friend chat or a challenge-linked table chat.
- `ConversationParticipant`
  Stores which users can read and write in each conversation.
- `Message`
  Stores plain-text messages with sender and `createdAt`.
- `Notification`
  Stores internal player notifications with type, copy, target href and read state.
- `Match`
  Stores the table created from a reto, result metadata, submitter, confirmer, dispute reason and `eloAppliedAt`.
- `MatchTeam`
  Stores temporary `Team A` and `Team B` records created from the lobby.
- `MatchPlayer`
  Stores the two players assigned to each match team.
- `EloHistory`
  Stores the before/after/delta record per player and confirmed match.
- `RankingSnapshot` and `RankingEntry`
  Stay available for future league-standings generation, even though current player rankings come from live ELO.

## Territorial model

- `LeagueType.GLOBAL` represents the whole network and the overall ranking scope.
- `LeagueType.REGION` represents the current player-facing zones.
- `LeagueType.CITY` and `LeagueType.LOCALITY` stay available for future municipality or subzone expansion, but are not required in the current player flow.
- Players choose a broad zone through `PlayerProfile.preferredLeagueId`.
- Challenges can add a concrete meeting point through `Challenge.locationName`.

Current seed hierarchy:

- `Global`
- `Madrid Centro`
- `Madrid Norte`
- `Madrid Sur`
- `Madrid Este`
- `Madrid Oeste`

## Environment contract

- `NEXT_PUBLIC_APP_URL` - base URL for metadata and app links.
- `DATABASE_URL` - pooled runtime connection string for Prisma inside Next.js.
- `DIRECT_URL` - direct PostgreSQL connection used by Prisma CLI operations.
- `NEXT_PUBLIC_SUPABASE_URL` - public Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - public Supabase client key.
- `SUPABASE_SERVICE_ROLE_KEY` - server-only key used by privileged backend helpers.
- `MUSLEAGUE_DEMO_PASSWORD` - optional password override for demo Auth users created by the seed.
- `MUSLEAGUE_ENABLE_DEMO_DATA` - controls whether `prisma/seed.ts` should create demo accounts, retos and match history, or just the base zones.

## Runtime helpers

- `src/lib/db/prisma.ts`
  Prisma singleton configured against `DATABASE_URL`.
- `src/lib/auth/update-session.ts`
  Refreshes Supabase cookies and redirects unauthenticated protected requests before App Router rendering.
- `src/lib/auth/session.ts`
  Centralizes protected-route access, safe `redirectTo` handling and onboarding redirects.
- `src/lib/auth/actions.ts`
  Contains sign-in, sign-up, sign-out and profile persistence actions.
- `src/lib/profile/profile.ts`
  Synchronizes `User` and `PlayerProfile`.
- `src/lib/leagues/queries.ts`
  Resolves zone hierarchy, selection options and nearby discovery.
- `src/lib/challenges/actions.ts`
  Handles reto creation, invite-code generation, direct reto invites, joins, lobby assignment, match start, result submission and result confirmation/dispute.
- `src/lib/challenges/queries.ts`
  Loads reto feeds, reto detail, direct reto invites, invite lookups, nearby retos and match history surfaces.
- `src/lib/chat/service.ts`
  Keeps challenge and direct conversations synchronized with joins, leaves and conversation bootstrap.
- `src/lib/chat/actions.ts`
  Opens direct chats and sends plain-text messages through Server Actions.
- `src/lib/chat/queries.ts`
  Loads conversation lists, active threads and challenge-linked chats.
- `src/lib/notifications/service.ts`
  Creates internal notifications for one or many player profiles while excluding the actor.
- `src/lib/notifications/actions.ts`
  Marks one or many notifications as read and resolves notification-driven navigation.
- `src/lib/notifications/queries.ts`
  Loads unread counts plus the pending/read inbox for the notification center.
- `src/lib/elo/rating.ts`
  Holds the pure ELO math and K-factor map.
- `src/lib/elo/apply.ts`
  Applies confirmed-match ELO updates inside a Prisma transaction.
- `src/lib/elo/queries.ts`
  Provides movement feeds, approximate rank queries and ranking lists.
- `src/lib/friends/actions.ts`
  Handles friendship requests, acceptance, rejection and removal.
- `src/lib/friends/queries.ts`
  Resolves friend lists, pending requests, player search and relationship state.

## Auth and profile flow

1. A visitor registers or logs in through Supabase Auth.
2. `proxy.ts` refreshes the auth cookies for SSR.
3. If a protected route is requested without any Supabase auth cookie, proxy redirects immediately to `/login`.
4. The first authenticated request synchronizes the app-level `User` row.
5. If the user has no `PlayerProfile`, protected platform routes redirect to `/onboarding`.
6. Onboarding stores city, bio, avatar, display name and `preferredLeagueId`.
7. Once onboarding is complete, the player can access the protected shell.

## Invite flow

1. Every new reto gets a short `inviteCode`.
2. `/matches/[id]` exposes sharing actions for:
   - public invite link
   - direct reto link
   - WhatsApp sharing
3. `/invite?code=XXXX` resolves the reto publicly and shows:
   - broad zone
   - optional concrete location
   - proposed time
   - current participants
   - seats remaining
4. If the visitor has no session, CTA links to `/register` or `/login` with a safe `redirectTo`.
5. If the visitor authenticates but still needs onboarding, the same `redirectTo` survives through `/onboarding`.
6. Once the profile is complete, the user lands on `/matches/[id]` and can join if seats are still available.

## Friendship flow

1. A player discovers another profile through `/friends`, `/dashboard`, `/leagues/[slug]` or `/players/[id]`.
2. Sending a request creates or refreshes a `Friendship` pair in `PENDING`.
3. The addressee can accept or reject from `/friends` or from the public player profile.
4. If accepted, the pair moves to `ACCEPTED` and becomes available for in-app reto invitations.
5. Removing a friend deletes the accepted edge but leaves match history untouched.

## Direct reto invite flow

1. A player creates a reto in `/matches`.
2. During creation, the player can preselect accepted friends.
3. Each selected friend receives a `ChallengeInvite` in `PENDING`.
4. The same friend can also be invited later from `/players/[id]`, but only into retos where the inviter is already seated.
5. `/dashboard` surfaces pending reto invitations with accept and reject actions.
6. Accepting a `ChallengeInvite`:
   - verifies the reto is still joinable
   - verifies the player is not already seated
   - verifies the table still has fewer than 4 participants
   - auto-creates the matching `ChallengeParticipant`
   - marks the `ChallengeInvite` as `ACCEPTED`
7. If the reto is already full, the action stops with a user-facing message and the player is not duplicated into the table.
8. Public invite links via `/invite?code=XXXX` continue to coexist with direct in-app invites.

## Chat flow

1. A direct conversation is created on demand the first time one friend opens chat with another.
2. The direct thread is keyed by a stable `directKey`, so the same pair reuses the same conversation.
3. Every reto creates a `Conversation` of type `CHALLENGE` during reto creation.
4. When a player joins the reto, the same transaction also inserts `ConversationParticipant`.
5. When a player leaves the reto, that participant is removed from the challenge conversation and loses access to the thread.
6. `/chat` shows all conversations available to the authenticated player.
7. `/matches/[id]` embeds `Chat de la mesa`, but only for current participants.
8. Messages are plain text and are sent through Server Actions with full page refresh, leaving room for future realtime delivery.

## Notification flow

1. The protected shell loads an unread notification count for the authenticated player and surfaces it in the header.
2. `/notifications` splits the inbox into pending and read notifications.
3. Opening a notification marks it as read and redirects to its internal `href`.
4. Notification producers currently include:
   - incoming friend requests
   - direct reto invites
   - chat messages from other participants
   - submitted results that still need rival confirmation
   - disputed results
5. The actor never receives their own notification for the action they just triggered.

## Development seed dataset

`prisma/seed.ts` seeds a realistic QA dataset on top of the territorial graph:

- 8 demo players distributed across the five broad Madrid zones.
- Player bios, avatar URLs, preferred zones and clean profile metadata.
- Multiple retos in `OPEN`, `FULL` and `TEAMS_EDITING`, with optional concrete locations such as bars, municipalities or houses.
- Invite codes on seeded retos so the public invite flow can be tested immediately.
- Confirmed matches with `Challenge`, `ChallengeParticipant`, `Match`, `MatchTeam`, `MatchPlayer` and `EloHistory`.
- Updated ELO, wins, losses and matches played on seeded `PlayerProfile` rows.

The seed supports two modes:

- `MUSLEAGUE_ENABLE_DEMO_DATA=false`
  Only the territorial graph is synchronized. No demo players, retos, matches or demo Auth users are created.
- `MUSLEAGUE_ENABLE_DEMO_DATA=true` with `SUPABASE_SERVICE_ROLE_KEY`
  Demo users are created or updated in Supabase Auth and can sign in with `MUSLEAGUE_DEMO_PASSWORD` or the default password.
- `MUSLEAGUE_ENABLE_DEMO_DATA=true` without `SUPABASE_SERVICE_ROLE_KEY`
  The same product data is still created in Postgres, but the demo identities remain database-only for UI and query QA.

The production seed path is intentionally non-destructive:

- `npm run prisma:seed:prod` forces the minimal mode.
- Existing real users are never deleted automatically.
- Demo cleanup must be reviewed manually in Supabase before going live, filtering only the known demo emails such as `@getmusleague.test`.

## Zone discovery flow

1. The player selects a preferred zone in onboarding or profile.
2. `PlayerProfile.preferredLeagueId` points to an active `League`.
3. `/dashboard` resolves nearby players and nearby retos from the zone network.
4. `/leagues` lists active scopes with aggregated player counts.
5. `/leagues/[slug]` shows scope information and associated players.

## Challenge state machine

- `OPEN` - reto created and waiting for players.
- `FULL` - four players are seated.
- `TEAMS_EDITING` - participants are arranging teams.
- `TEAMS_LOCKED` - reserved state for future pre-start workflows.
- `IN_PROGRESS` - the lobby is locked and the match exists.
- `RESULT_SUBMITTED` - one participant submitted the official score.
- `CONFIRMED` - the opposing team confirmed the score.
- `DISPUTED` - the opposing team disputed the score.
- `CANCELLED` - reto cancelled before completion.

Current active chain:

1. `OPEN`
2. `FULL`
3. `TEAMS_EDITING`
4. `IN_PROGRESS`
5. `RESULT_SUBMITTED`
6. `CONFIRMED` or `DISPUTED`

## Lobby and match flow

1. A player creates a reto from `/matches`.
2. The creator is inserted automatically into `ChallengeParticipant`.
3. Other players join until the reto reaches four seats.
4. Participants manually assign or randomize `Team A` and `Team B`.
5. When both teams have two players, any participant can start the match.
6. Starting the table creates:
   - one `Match`
   - two `MatchTeam` rows
   - four `MatchPlayer` rows
7. The reto becomes `IN_PROGRESS` and the lobby becomes read-only.

## Result flow

1. While `IN_PROGRESS`, any participant can submit the official score.
2. Score validation depends on `MatchFormat`:
   - `POINTS_30`: winner reaches 30
   - `POINTS_40`: winner reaches 40
   - `VACA_FIRST_TO_3`: winner reaches 3
   - `BEST_OF_3_VACAS`: winner reaches 2
3. Submission stores:
   - `teamAScore`
   - `teamBScore`
   - `winnerTeamSlot`
   - `submittedById`
   - `submittedAt`
4. The reto moves to `RESULT_SUBMITTED`.
5. Only a participant from the opposite team can confirm or dispute.
6. If confirmed:
   - `confirmedById` and `confirmedAt` are written
   - reto becomes `CONFIRMED`
   - match becomes `VERIFIED`
   - ELO is applied
7. If disputed:
   - `disputeReason` is stored
   - reto becomes `DISPUTED`

## ELO system

### Initial values

- Every player starts at `1000` ELO.
- `matchesPlayed`, `wins` and `losses` start at `0`.

### Team rating

- Team ELO is the average of the two players in that team.

### Expected score

- Uses the standard ELO expectation:

```text
expected = 1 / (1 + 10 ^ ((opponent - own) / 400))
```

### Score input

- If `Team A` wins:
  - `scoreA = 1`
  - `scoreB = 0`
- If `Team B` wins:
  - `scoreA = 0`
  - `scoreB = 1`

### K-factor by format

- `POINTS_30` -> `24`
- `POINTS_40` -> `28`
- `VACA_FIRST_TO_3` -> `32`
- `BEST_OF_3_VACAS` -> `40`

### Delta application

- The same rounded delta is applied to both players in a team.
- Winners increase `wins`.
- Losers increase `losses`.
- All four players increase `matchesPlayed`.
- `EloHistory` stores:
  - `eloBefore`
  - `eloAfter`
  - `delta`
  - `matchId`
  - `playerProfileId`

### Double-application guard

- `Match.eloAppliedAt` is written when ELO is successfully applied.
- `EloHistory` is also unique by `[playerProfileId, matchId]`.
- This gives both an explicit application flag and a relational guard against duplicate rating writes.

## ELO confirmation transaction

When a result is confirmed, `src/lib/challenges/actions.ts` runs a Prisma transaction that:

1. Verifies the reto is still `RESULT_SUBMITTED`.
2. Verifies the reviewer belongs to the opposite team.
3. Marks the match as `VERIFIED`.
4. Loads the four `MatchPlayer` rows and current player profiles.
5. Calculates the team averages, expected score and delta.
6. Updates the four `PlayerProfile` rows.
7. Creates the four `EloHistory` rows.
8. Writes `eloAppliedAt`.
9. Moves the reto to `CONFIRMED`.

## Ranking and history surfaces

- `/profile`
  Shows current ELO, record, winrate, recent ELO movements and match history.
- `/dashboard`
  Shows current ELO, approximate global rank, personal movement and nearby product activity.
- `/matches`
  Shows recent confirmed matches, including per-player ELO deltas.
- `/rankings`
  Shows:
  - global ranking by `PlayerProfile.elo`
  - zone ranking by `preferredLeagueId` scope

## QA and UX polish

The current product pass also strengthens readiness around the main flows:

- Empty states exist across dashboard, retos, clasificacion, perfil and zonas.
- Buttons expose clearer pending labels for create, join, leave, randomize, start, submit and confirm/dispute actions.
- Loading boundaries exist for both account and protected route groups.
- Copy is now Spanish-first across the landing, auth flow and platform shell.
- Protected routes no longer rely only on streaming redirects for the no-session case, avoiding blank transitional states in local QA.

## Visual direction

- Global UI uses a premium bottle-green palette inspired by a Mus table.
- Surfaces stay dark and restrained, with muted cream text and subtle gold accents.
- Gradients remain minimal so the app feels professional rather than casino-themed.

## Current deliberate gaps

- No realtime push or websocket delivery for chat yet.
- No notifications.
- No automated dispute resolution.
- No season standings recalculation yet.
- No advanced moderation or audit tooling yet.

## Suggested next milestones

1. Add dispute-resolution tooling for `DISPUTED` matches.
2. Add real season standings on top of `RankingSnapshot` and `RankingEntry`.
3. Add notifications around reto joins, full tables and result reviews.
4. Add observability and audit logs around rating updates.
