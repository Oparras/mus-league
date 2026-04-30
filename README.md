# Mus League

Mus League es una plataforma de Mus con enfoque territorial, retos 2vs2, confirmacion de resultados y ranking ELO real. La experiencia actual ya esta orientada a producto: landing publica, acceso de jugador, zonas amplias, retos con ubicacion concreta y panel competitivo.

## Stack

- Next.js 16 with App Router
- Tailwind CSS 4
- shadcn/ui primitives
- Prisma 7 with PostgreSQL adapter
- Supabase Auth, SSR helpers and Postgres

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill `.env` with real Supabase values.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Apply the schema:

```bash
npm run prisma:push
```

6. Seed the demo dataset:

```bash
npm run prisma:seed
```

7. Start development:

```bash
npm run dev
```

## Available scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:push`
- `npm run prisma:studio`
- `npm run prisma:seed`

## Connection strings in this project

- `DATABASE_URL`
  Use the pooled / pooler connection string from Supabase Connect. This is the runtime connection used by the Next.js app through `src/lib/db/prisma.ts`.
- `DIRECT_URL`
  Use the direct database connection string from Supabase Connect. This is the connection used by Prisma CLI commands through `prisma.config.ts`.
- `NEXT_PUBLIC_SUPABASE_URL`
  Use your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  Use the public client key expected by the browser and SSR Supabase helpers.
- `SUPABASE_SERVICE_ROLE_KEY`
  Keep this because `src/lib/db/supabase-admin.ts` uses it for server-only admin access. Never expose it to the browser.

## Supabase setup

1. Create a new project in [Supabase](https://supabase.com/dashboard/projects).
2. Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
3. Open `Settings -> API Keys` and copy the public client key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy the server-only `service_role` key into `SUPABASE_SERVICE_ROLE_KEY`.
5. Open `Connect` in the Supabase dashboard.
6. Copy the pooled / pooler Postgres connection string into `DATABASE_URL`.
7. Copy the direct Postgres connection string into `DIRECT_URL`.
8. Run:

```bash
npm run prisma:generate
```

9. Apply the schema with one of these commands:

```bash
npm run prisma:push
```

or

```bash
npm run prisma:migrate
```

10. Optionally inspect the database with:

```bash
npm run prisma:studio
```

11. Seed the demo dataset:

```bash
npm run prisma:seed
```

The seed always creates:

- `Global`
- `Madrid Centro`
- `Madrid Norte`
- `Madrid Sur`
- `Madrid Este`
- `Madrid Oeste`

`npm run prisma:seed` also adds:

- 8 demo players with avatars, bios, city and preferred zone.
- Multiple retos in `OPEN`, `FULL` and `TEAMS_EDITING`.
- Several confirmed matches with `Match`, `MatchTeam`, `MatchPlayer` and `EloHistory`.
- Real ELO, wins, losses and matches played so dashboard, perfil and clasificacion are immediately testable.

If `SUPABASE_SERVICE_ROLE_KEY` is configured, the seed also provisions those demo accounts in Supabase Auth. If that key is missing, the same product data is still created in Postgres so UI and domain flows can be tested, but the demo users will not be able to sign in until the service role is added.

Optional demo env:

- `MUSLEAGUE_DEMO_PASSWORD`
  Overrides the password used for demo accounts created in Supabase Auth. Default: `MusLeague123!`.

Demo emails created by the seed:

- `alba@getmusleague.test`
- `borja@getmusleague.test`
- `carla@getmusleague.test`
- `diego@getmusleague.test`
- `elena@getmusleague.test`
- `fernando@getmusleague.test`
- `gema@getmusleague.test`
- `hugo@getmusleague.test`

## Product highlights

- Landing publica centrada en jugadores: reta, juega, confirma resultados y sube ELO.
- Supabase Auth con `/login`, `/register`, `/onboarding` y `/profile`.
- Rutas protegidas con `proxy.ts` en la raiz del proyecto para refresco de sesion y redireccion inmediata a login.
- Zonas amplias como estructura principal: `Madrid Centro`, `Madrid Norte`, `Madrid Sur`, `Madrid Este` y `Madrid Oeste`.
- Ubicacion concreta opcional en cada reto mediante `Challenge.locationName`.
- `/matches` y `/matches/[id]` para abrir mesa, completar plazas, configurar equipos, iniciar partida y cerrar resultado.
- `/invite?code=XXXX` como puerta publica para invitados que aun no tienen cuenta.
- `/dashboard` con ELO actual, zona principal, retos cercanos, partidas recientes y accesos rapidos.
- `/profile` con estadisticas reales, historial y movimientos de ELO.
- `/rankings` con clasificacion global y por zona basada en ELO real.
- Sistema visual verde botella premium en landing, shell y pantallas de juego.
- Invitaciones simples con enlace publico, deep link de reto y acciones rapidas para compartir por WhatsApp.

## Challenge states

- `OPEN`
- `FULL`
- `TEAMS_EDITING`
- `TEAMS_LOCKED`
- `IN_PROGRESS`
- `RESULT_SUBMITTED`
- `CONFIRMED`
- `DISPUTED`
- `CANCELLED`

Current active flow:

1. `OPEN`
2. `FULL`
3. `TEAMS_EDITING`
4. `IN_PROGRESS`
5. `RESULT_SUBMITTED`
6. `CONFIRMED` or `DISPUTED`

## Invitation flow

- Cada reto nuevo genera un `inviteCode` corto para compartir enlaces tipo `/invite?code=XXXX`.
- El detalle de `/matches/[id]` permite:
  - copiar invitacion publica
  - copiar enlace directo del reto
  - compartir por WhatsApp
- Un visitante sin cuenta puede abrir `/invite?code=XXXX`, ver la informacion basica de la mesa y crear cuenta para unirse.
- `redirectTo` se conserva entre `/login`, `/register` y `/onboarding` para que el usuario termine en el reto al completar el acceso.
- Un jugador autenticado con perfil completo puede entrar desde la invitacion y usar directamente `Unirse al reto`.

## Lobby flow

1. A player creates a reto from `/matches` and is inserted automatically as the first participant.
2. Other players join until the reto reaches 4 participants.
3. Once full, participants can organize `Team A` and `Team B` manually or randomize them.
4. When both teams have 2 players, any participant can lock the lobby and start the table.
5. That action creates a `Match`, two `MatchTeam` rows and four `MatchPlayer` rows.
6. The reto moves to `IN_PROGRESS` and the lobby becomes read-only.

## Territorial model

- `Global` se mantiene para clasificacion general y alcance total.
- Los jugadores eligen una zona amplia como base de juego.
- La ubicacion concreta de una mesa se guarda en `Challenge.locationName`.
- El campo `city` del perfil sigue disponible como ubicacion habitual libre.
- El modelo `League` queda preparado para volver a introducir municipios o subzonas mas adelante sin rehacer el dominio.

## Result and ELO flow

1. While the reto is `IN_PROGRESS`, any participant can submit the official score from `/matches/[id]`.
2. The result is validated by format:
   - `POINTS_30`: winner reaches 30
   - `POINTS_40`: winner reaches 40
   - `VACA_FIRST_TO_3`: winner reaches 3
   - `BEST_OF_3_VACAS`: winner reaches 2
3. Submitting the result moves the reto to `RESULT_SUBMITTED`.
4. Only a player from the opposing team can confirm or dispute that score.
5. If the rival confirms:
   - reto state becomes `CONFIRMED`
   - match state becomes `VERIFIED`
   - ELO is applied automatically in one Prisma transaction
   - player stats and `EloHistory` are written
6. If the rival disputes:
   - reto state becomes `DISPUTED`
   - the match stays out of confirmed history

## ELO rules

- Every `PlayerProfile` starts at `1000` ELO.
- Team ELO is the average of the two players in that team.
- Expected score uses the standard ELO formula.
- The same delta is applied to both players in the winning team and the inverse delta to both players in the losing team.
- Final ELO is rounded to integers.

K-factor by format:

- `POINTS_30`: `24`
- `POINTS_40`: `28`
- `VACA_FIRST_TO_3`: `32`
- `BEST_OF_3_VACAS`: `40`

## History and rankings

- `/profile` shows current ELO, wins, losses, matches played, winrate and latest ELO movements.
- `/profile` also shows the player match history with per-player ELO deltas.
- `/matches` includes recent confirmed matches.
- `/dashboard` includes current ELO, approximate global rank and latest personal ELO changes.
- `/rankings` shows a live global ladder and a zone-scoped ladder based on `preferredLeague`.

## Notes

- `rating` remains in the schema as a compatibility field and is synchronized with `elo`.
- ELO is applied only once per confirmed match through `Match.eloAppliedAt`.
- `Challenge.inviteCode` queda preparado para enlaces publicos de invitacion y puede convivir temporalmente con retos antiguos sin codigo.
- The dev seed is safe to run without `SUPABASE_SERVICE_ROLE_KEY`; only Auth demo-account provisioning becomes optional.
- `proxy.ts` lives at the project root so Next.js 16.2.4 can resolve the proxy module correctly in a `src/app` project.
- Chat, notifications, advanced dispute resolution and team-league standings remain out of scope.
- `RankingSnapshot` and `RankingEntry` still exist for future season standings, but `/rankings` is currently player-ELO driven.

## Documentation

- [Technical architecture](./docs/technical-architecture.md)
#   m u s - l e a g u e  
 
