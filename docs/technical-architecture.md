# Mus League technical architecture

## Goal

The current baseline covers the main Mus League product loop: authenticated access, broad-zone player discovery, reto creation with optional concrete location, editable 2vs2 lobbies, result submission, rival confirmation or dispute, automatic ELO updates and realistic demo data for QA.

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
- `/leagues` - active zone directory.
- `/leagues/[slug]` - zone detail and player scope.
- `/matches` - retos board, create flow and recent confirmed matches.
- `/matches/[id]` - reto detail, lobby, result capture, rival review and confirmed ELO summary.
- `/invite` - public invite page resolved from `Challenge.inviteCode`.
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
    challenges/
    common/
    elo/
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
    leagues/
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
  Handles reto creation, invite-code generation, joins, lobby assignment, match start, result submission and result confirmation/dispute.
- `src/lib/challenges/queries.ts`
  Loads reto feeds, reto detail, invite lookups, nearby retos and match history surfaces.
- `src/lib/elo/rating.ts`
  Holds the pure ELO math and K-factor map.
- `src/lib/elo/apply.ts`
  Applies confirmed-match ELO updates inside a Prisma transaction.
- `src/lib/elo/queries.ts`
  Provides movement feeds, approximate rank queries and ranking lists.

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

## Development seed dataset

`prisma/seed.ts` seeds a realistic QA dataset on top of the territorial graph:

- 8 demo players distributed across the five broad Madrid zones.
- Player bios, avatar URLs, preferred zones and clean profile metadata.
- Multiple retos in `OPEN`, `FULL` and `TEAMS_EDITING`, with optional concrete locations such as bars, municipalities or houses.
- Invite codes on seeded retos so the public invite flow can be tested immediately.
- Confirmed matches with `Challenge`, `ChallengeParticipant`, `Match`, `MatchTeam`, `MatchPlayer` and `EloHistory`.
- Updated ELO, wins, losses and matches played on seeded `PlayerProfile` rows.

The seed supports two modes:

- With `SUPABASE_SERVICE_ROLE_KEY`
  Demo users are created or updated in Supabase Auth and can sign in with `MUSLEAGUE_DEMO_PASSWORD` or the default password.
- Without `SUPABASE_SERVICE_ROLE_KEY`
  The same product data is still created in Postgres, but the demo identities remain database-only for UI and query QA.

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

- No chat.
- No notifications.
- No automated dispute resolution.
- No season standings recalculation yet.
- No advanced moderation or audit tooling yet.

## Suggested next milestones

1. Add dispute-resolution tooling for `DISPUTED` matches.
2. Add real season standings on top of `RankingSnapshot` and `RankingEntry`.
3. Add notifications around reto joins, full tables and result reviews.
4. Add observability and audit logs around rating updates.
