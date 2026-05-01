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
- `npm run prisma:seed:prod`

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
- `MUSLEAGUE_ENABLE_DEMO_DATA`
  Si esta en `true`, el seed crea jugadores demo, retos demo y partidas demo. Si esta en `false`, solo sincroniza las zonas base.

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
- Chat 1 a 1 entre amigos y chat de mesa ligado a cada reto.
- Centro de notificaciones interno para solicitudes, invitaciones, mensajes y resultados pendientes.

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

## Chat

- `/chat` actua como bandeja principal de conversaciones.
- `Conversation` soporta:
  - `DIRECT`
  - `CHALLENGE`
- `ConversationParticipant` controla acceso al hilo.
- `Message` guarda texto plano, remitente y `createdAt`.
- Cada reto crea automaticamente su propio chat al abrirse.
- Cuando un jugador entra en una mesa, tambien entra en su conversacion.
- Si sale de la mesa antes de arrancar o antes de que termine, deja de ver ese chat porque ya no es participante.
- `/matches/[id]` muestra la seccion `Chat de la mesa` solo a quienes forman parte del reto.
- No hay tiempo real todavia: el flujo actual usa Server Actions y refresco de pagina, pero la estructura queda lista para meter realtime mas adelante.

## Notificaciones internas

- El icono superior de avisos muestra cuantas notificaciones siguen pendientes.
- `/notifications` separa:
  - pendientes
  - leidas
- La app genera avisos para:
  - solicitudes de amistad recibidas
  - invitaciones directas a retos
  - mensajes nuevos en chat
  - resultados pendientes de confirmar
  - resultados disputados
- Al abrir una notificacion, Mus League la marca como leida y te lleva a la pantalla correspondiente.
- No hay push notifications externas todavia. Todo vive dentro de la app.

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

## Seed y datos demo

Por defecto, `.env.example` deja `MUSLEAGUE_ENABLE_DEMO_DATA="false"`. Eso significa que:

- `npm run prisma:seed`
  solo sincroniza las zonas base:
  - `Global`
  - `Madrid Centro`
  - `Madrid Norte`
  - `Madrid Sur`
  - `Madrid Este`
  - `Madrid Oeste`
- `npm run prisma:seed:prod`
  fuerza ese mismo modo minimal aunque tu entorno local tenga otra variable cargada.

Si quieres dataset demo para QA, activa:

```bash
MUSLEAGUE_ENABLE_DEMO_DATA=true
```

y luego ejecuta:

```bash
npm run prisma:seed
```

Con `MUSLEAGUE_ENABLE_DEMO_DATA=true`, el seed deja preparado un entorno util para QA:

- 8 jugadores de prueba
- perfiles repartidos por zonas
- retos abiertos
- lobbies listos para cerrar
- partidas confirmadas con `EloHistory`

Si `SUPABASE_SERVICE_ROLE_KEY` esta presente, el seed tambien crea o actualiza cuentas demo en Supabase Auth. Si no, sigue cargando los datos de producto en Postgres para probar UI y consultas.

## Preparacion para usuarios reales

Antes de abrir la app a usuarios reales:

1. Deja `MUSLEAGUE_ENABLE_DEMO_DATA=false`.
2. Ejecuta `npm run prisma:seed:prod` para asegurar que solo quedan las zonas base sincronizadas por seed.
3. Revisa en Supabase que no queden cuentas demo con el dominio `@getmusleague.test`.
4. Borra solo esas cuentas demo desde `Authentication > Users` en Supabase.
5. Revisa en la base de datos las filas demo antes de eliminarlas. Una comprobacion util es:

```sql
select id, email
from "User"
where email like '%@getmusleague.test';
```

6. Si aparecen filas demo, elimina unicamente esas cuentas de app tras revisar backup y dependencias.

Importante:

- El seed en modo produccion no borra usuarios reales automaticamente.
- No automatizamos limpieza destructiva de Supabase Auth para evitar tocar cuentas reales por error.

## Notas

- `rating` sigue existiendo por compatibilidad y se sincroniza con `elo`.
- `ChallengeInvite` convive con el enlace publico: puedes compartir una mesa fuera de la app o reservar plaza a amigos concretos dentro de Mus League.
- `proxy.ts` vive en la raiz para que Next.js 16.2.4 resuelva bien el proxy en un proyecto con `src/app`.
- El chat ya cubre mensajes basicos y ahora se apoya en avisos internos, pero siguen fuera de alcance el tiempo real, las push notifications externas y la resolucion avanzada de disputas.

## Documentacion

- [Technical architecture](./docs/technical-architecture.md)
