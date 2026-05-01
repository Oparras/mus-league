# Mus League

Mus League es una plataforma de Mus 2vs2 con enfoque territorial, retos entre jugadores, confirmacion de resultados y ranking ELO. La app ya cubre el bucle principal de producto: descubrir jugadores, abrir mesa, completar lobby, jugar, confirmar marcador y mover clasificacion.

## Stack

- Next.js 16 con App Router
- Tailwind CSS 4
- shadcn/ui
- Prisma 7 con PostgreSQL adapter
- Supabase Auth + Supabase Postgres

## Quick start

1. Instala dependencias:

```bash
npm install
```

2. Copia variables de entorno:

```bash
copy .env.example .env
```

3. Rellena `.env` con tus valores reales de Supabase.

4. Genera el cliente de Prisma:

```bash
npm run prisma:generate
```

5. Aplica el esquema:

```bash
npm run prisma:push
```

6. Si quieres dataset demo, carga el seed:

```bash
npm run prisma:seed
```

7. Arranca el entorno local:

```bash
npm run dev
```

## Scripts

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

## Variables de entorno

- `DATABASE_URL`
  Usa la connection string pooled / pooler de Supabase. Es la conexion runtime del proyecto en Next.js.
- `DIRECT_URL`
  Usa la connection string directa de Supabase. Es la conexion para Prisma CLI.
- `NEXT_PUBLIC_SUPABASE_URL`
  Project URL de Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  Clave publica cliente para navegador y SSR.
- `SUPABASE_SERVICE_ROLE_KEY`
  Clave server-only para operaciones administrativas.
- `NEXT_PUBLIC_APP_URL`
  URL base de la app.
- `MUSLEAGUE_DEMO_PASSWORD`
  Opcional. Cambia la password que usa el seed para cuentas demo en Supabase Auth.

## Supabase setup

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard/projects).
2. Copia el `Project URL` en `NEXT_PUBLIC_SUPABASE_URL`.
3. Copia la `anon key` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copia la `service_role key` en `SUPABASE_SERVICE_ROLE_KEY` si vas a usar funciones admin o el seed con usuarios reales de Auth.
5. En `Connect`, copia la cadena pooled en `DATABASE_URL`.
6. En `Connect`, copia la cadena directa en `DIRECT_URL`.
7. Ejecuta:

```bash
npm run prisma:generate
```

8. Aplica el esquema:

```bash
npm run prisma:push
```

o

```bash
npm run prisma:migrate
```

9. Si quieres explorar la base:

```bash
npm run prisma:studio
```

## Lo que ya hace el producto

- Landing publica orientada a jugadores.
- Auth con Supabase en `/login`, `/register` y `/onboarding`.
- Rutas protegidas con `proxy.ts`.
- Zonas amplias de juego:
  - `Global`
  - `Madrid Centro`
  - `Madrid Norte`
  - `Madrid Sur`
  - `Madrid Este`
  - `Madrid Oeste`
- Retos 2vs2 con lugar concreto opcional mediante `Challenge.locationName`.
- Lobby editable para completar equipos antes de empezar.
- Registro de resultado, confirmacion rival y disputa.
- ELO real por equipos con historial de cambios.
- Ranking global y por zona.
- Enlace publico `/invite?code=XXXX` para compartir una mesa.
- Deep link directo a retos y acciones rapidas para WhatsApp.
- Sistema de amigos e invitaciones directas a retos dentro de la app.

## Friends e invitaciones directas

- `/friends` permite:
  - ver amigos
  - aceptar solicitudes recibidas
  - revisar solicitudes enviadas
  - buscar jugadores por nombre o zona
- `/players/[id]` funciona como perfil publico de otro jugador.
- Desde ese perfil puedes:
  - anadir amigo
  - aceptar o rechazar una solicitud
  - eliminar amigo
  - invitar a una de tus mesas activas si ya sois amigos
- Al crear un reto en `/matches` puedes seleccionar amigos concretos para avisarles en el momento.
- `/dashboard` muestra invitaciones pendientes para aceptar o rechazar sin salir del panel.
- Si un jugador acepta una invitacion y aun hay plaza, entra automaticamente al reto.
- Si la mesa ya esta llena, la app muestra un mensaje claro y evita duplicados.

## Estados del reto

- `OPEN`
- `FULL`
- `TEAMS_EDITING`
- `TEAMS_LOCKED`
- `IN_PROGRESS`
- `RESULT_SUBMITTED`
- `CONFIRMED`
- `DISPUTED`
- `CANCELLED`

Flujo principal:

1. `OPEN`
2. `FULL`
3. `TEAMS_EDITING`
4. `IN_PROGRESS`
5. `RESULT_SUBMITTED`
6. `CONFIRMED` o `DISPUTED`

## ELO

- Cada `PlayerProfile` empieza en `1000`.
- El ELO del equipo es la media de sus dos jugadores.
- Se usa la formula ELO estandar.
- El mismo delta se aplica a ambos miembros del equipo.
- `Match.eloAppliedAt` evita aplicar ELO dos veces.
- `EloHistory` guarda `eloBefore`, `eloAfter` y `delta` por jugador y partida.

K-factor por formato:

- `POINTS_30`: `24`
- `POINTS_40`: `28`
- `VACA_FIRST_TO_3`: `32`
- `BEST_OF_3_VACAS`: `40`

## Seed demo

`npm run prisma:seed` deja preparado un entorno util para QA:

- 8 jugadores de prueba
- perfiles repartidos por zonas
- retos abiertos
- lobbies listos para cerrar
- partidas confirmadas con `EloHistory`

Si `SUPABASE_SERVICE_ROLE_KEY` esta presente, el seed tambien crea o actualiza cuentas demo en Supabase Auth. Si no, sigue cargando los datos de producto en Postgres para probar UI y consultas.

## Notas

- `rating` sigue existiendo por compatibilidad y se sincroniza con `elo`.
- `ChallengeInvite` convive con el enlace publico: puedes compartir una mesa fuera de la app o reservar plaza a amigos concretos dentro de Mus League.
- `proxy.ts` vive en la raiz para que Next.js 16.2.4 resuelva bien el proxy en un proyecto con `src/app`.
- Chat, notificaciones y resolucion avanzada de disputas siguen fuera de alcance.

## Documentacion

- [Technical architecture](./docs/technical-architecture.md)
