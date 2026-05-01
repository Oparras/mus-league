import Link from "next/link";
import { ArrowUpRight, History, Mailbox, Swords, Trophy, Users } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { MatchHistoryCard } from "@/components/challenges/match-history-card";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { ShareLinkActions } from "@/components/common/share-link-actions";
import { EloMovementList } from "@/components/elo/elo-movement-list";
import { PlayerCard } from "@/components/leagues/player-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompletedProfile } from "@/lib/auth/session";
import {
  acceptChallengeInviteAction,
  declineChallengeInviteAction,
} from "@/lib/challenges/actions";
import { getChallengeInvitePath } from "@/lib/challenges/links";
import {
  getNearbyChallenges,
  getPendingChallengeInvitesForUser,
  getPlayerMatchHistory,
} from "@/lib/challenges/queries";
import {
  calculateWinrate,
  getApproximateGlobalRank,
  getLatestEloMovementsForUser,
} from "@/lib/elo/queries";
import { getNearbyPlayers } from "@/lib/leagues/queries";
import { cn } from "@/lib/utils";

const quickLinks = [
  {
    href: "/matches",
    title: "Crear reto",
    description: "Abre una mesa nueva en tu zona y empieza a reunir jugadores.",
  },
  {
    href: "/rankings",
    title: "Ver ranking",
    description: "Comprueba tu posicion global y el pulso competitivo de tu zona.",
  },
  {
    href: "/profile",
    title: "Ajustar perfil",
    description: "Cambia tu zona principal, tu ubicacion habitual o tu bio.",
  },
  {
    href: "/friends",
    title: "Abrir amigos",
    description: "Gestiona tu circulo de juego y manda invitaciones directas a tus retos.",
  },
];

export default async function DashboardPage() {
  const { appUser, profile } = await requireCompletedProfile();
  const [
    nearbyPlayers,
    nearbyChallenges,
    latestMatches,
    globalRank,
    eloMovements,
    pendingInvites,
  ] = await Promise.all([
    getNearbyPlayers(appUser.id, profile.preferredLeagueId),
    getNearbyChallenges(profile.preferredLeagueId),
    getPlayerMatchHistory({
      userId: appUser.id,
      limit: 3,
    }),
    getApproximateGlobalRank(appUser.id),
    getLatestEloMovementsForUser({
      userId: appUser.id,
      limit: 4,
    }),
    getPendingChallengeInvitesForUser(appUser.id),
  ]);

  const winrate = calculateWinrate(profile.wins, profile.matchesPlayed);
  const featuredInviteChallenge = nearbyChallenges[0] ?? null;
  const metrics = [
    {
      label: "ELO actual",
      value: profile.elo.toString(),
      detail: `Puesto global aproximado #${globalRank ?? "--"}`,
    },
    {
      label: "Retos cerca",
      value: nearbyChallenges.length.toString().padStart(2, "0"),
      detail: "Retos abiertos o con equipos todavia editables.",
    },
    {
      label: "Partidas",
      value: profile.matchesPlayed.toString().padStart(2, "0"),
      detail: `${profile.wins} victorias y ${profile.losses} derrotas.`,
    },
    {
      label: "Winrate",
      value: `${winrate}%`,
      detail: "Tu rendimiento en mesas ya confirmadas.",
    },
  ];

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              Panel del jugador
            </Badge>
            <div className="space-y-3">
              <h2 className="font-heading text-4xl font-semibold tracking-tight">
                Tu mesa empieza en {profile.preferredLeague?.name ?? "tu zona"}.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Sigue tu ELO, localiza retos cercanos, repasa tus ultimas
                partidas y ten a mano las acciones que mas usas.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Tu ficha competitiva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div>
              <p className="font-heading text-4xl font-semibold text-foreground">{profile.elo}</p>
              <p>
                Ranking global aproximado:{" "}
                <span className="font-medium text-foreground">#{globalRank ?? "--"}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Zona principal</p>
              <p className="mt-2 font-medium text-foreground">
                {profile.preferredLeague?.name ?? "Pendiente"}
              </p>
              <p className="text-sm text-muted-foreground">{profile.city}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Victorias
                </p>
                <p className="mt-1 font-medium text-foreground">{profile.wins}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Derrotas
                </p>
                <p className="mt-1 font-medium text-foreground">{profile.losses}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Partidas
                </p>
                <p className="mt-1 font-medium text-foreground">{profile.matchesPlayed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-border/80 bg-card/95">
            <CardHeader className="space-y-3">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <CardTitle className="text-4xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {metric.detail}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Accesos rapidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-4 transition-colors hover:border-primary/35 hover:bg-secondary/60"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{link.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{link.description}</p>
                </div>
                <ArrowUpRight className="mt-1 size-4 text-primary" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <EloMovementList
          items={eloMovements}
          title="Ultimas variaciones de ELO"
          emptyLabel="Todavia no tienes cambios de ELO. En cuanto cierres una partida confirmada, apareceran aqui."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvites.length > 0 ? (
              pendingInvites.slice(0, 3).map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-border/70 bg-background/60 px-4 py-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {invite.challenge.locationName || `Mesa en ${invite.challenge.league.name}`}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {invite.invitedByPlayer.displayName} te ha invitado a una mesa en{" "}
                      {invite.challenge.league.name}.
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-primary">
                      {invite.challenge.participants.length}/4 plazas
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={acceptChallengeInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="returnTo" value="/dashboard" />
                      <SubmitButton pendingLabel="Uniendote..." className="rounded-full">
                        Aceptar
                      </SubmitButton>
                    </form>
                    <form action={declineChallengeInviteAction}>
                      <input type="hidden" name="inviteId" value={invite.id} />
                      <input type="hidden" name="returnTo" value="/dashboard" />
                      <SubmitButton
                        pendingLabel="Respondiendo..."
                        variant="outline"
                        className="rounded-full"
                      >
                        Rechazar
                      </SubmitButton>
                    </form>
                    <Link
                      href={`/matches/${invite.challengeId}`}
                      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                    >
                      Ver reto
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <EmptyStateCard
                icon={<Mailbox className="size-5" />}
                eyebrow="Todo al dia"
                title="No tienes invitaciones pendientes"
                description="Cuando un amigo te reserve una plaza en una mesa, la veras aqui lista para aceptar o rechazar."
                compact
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Invita a tus amigos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Comparte Mus League con tu grupo o manda directamente una mesa abierta para
              sentaros a jugar cuanto antes.
            </p>
            <ShareLinkActions
              primaryPath="/"
              primaryLabel="Copiar enlace general"
              secondaryPath={
                featuredInviteChallenge?.inviteCode
                  ? getChallengeInvitePath(featuredInviteChallenge.inviteCode)
                  : undefined
              }
              secondaryLabel={featuredInviteChallenge ? "Copiar reto cercano" : undefined}
              whatsappPath={
                featuredInviteChallenge?.inviteCode
                  ? getChallengeInvitePath(featuredInviteChallenge.inviteCode)
                  : "/"
              }
              whatsappText={
                featuredInviteChallenge
                  ? `Te paso una mesa de Mus League en ${featuredInviteChallenge.league.name}.`
                  : "Te invito a Mus League para jugar y subir ELO."
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Invitacion destacada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            {featuredInviteChallenge ? (
              <>
                <p className="font-medium text-foreground">
                  {featuredInviteChallenge.locationName ||
                    `Mesa en ${featuredInviteChallenge.league.name}`}
                </p>
                <p>
                  {featuredInviteChallenge.description ||
                    "Reto abierto listo para sumar pareja y arrancar."}
                </p>
                <p>
                  Zona:{" "}
                  <span className="font-medium text-foreground">
                    {featuredInviteChallenge.league.name}
                  </span>
                </p>
                <Link
                  href={`/matches/${featuredInviteChallenge.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                >
                  Abrir reto
                </Link>
              </>
            ) : (
              <>
                <p>No tienes ahora mismo un reto cercano para compartir.</p>
                <Link
                  href="/matches"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                >
                  Crear reto
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Tu mejor atajo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Si quieres cerrar mesas con gente conocida, tu lista de amigos es el camino mas
              rapido.
            </p>
            <Link
              href="/friends"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
            >
              Abrir amigos
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Ultimas partidas
            </p>
            <h3 className="font-heading text-2xl font-semibold">
              Lo mas reciente de tu historial
            </h3>
          </div>
          <Link
            href="/profile"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
          >
            Abrir perfil
          </Link>
        </div>

        {latestMatches.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {latestMatches.map((match) => (
              <MatchHistoryCard key={match.id} match={match} compact viewerUserId={appUser.id} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<History className="size-5" />}
            eyebrow="Sin historial"
            title="Todavia no has cerrado ninguna partida"
            description="En cuanto completes una mesa y el rival confirme el resultado, la veras aqui con su marcador y su impacto en ELO."
            action={
              <Link href="/matches" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
                Ir a retos
              </Link>
            }
          />
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Retos cerca de ti
            </p>
            <h3 className="font-heading text-2xl font-semibold">
              Mesas activas en tu zona
            </h3>
          </div>
          <Link
            href="/matches"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
          >
            Ver retos
          </Link>
        </div>

        {nearbyChallenges.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {nearbyChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} compact />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Swords className="size-5" />}
            eyebrow="Sin retos"
            title="No hay mesas abiertas en tu zona ahora mismo"
            description="Abre un reto nuevo y marca el lugar si ya lo tienes claro para atraer jugadores mas rapido."
            action={
              <>
                <Link href="/matches" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
                  Crear reto
                </Link>
                <Link
                  href="/profile"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                >
                  Cambiar zona
                </Link>
              </>
            }
          />
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Jugadores cerca de ti
            </p>
            <h3 className="font-heading text-2xl font-semibold">
              Perfiles activos alrededor de tu zona
            </h3>
          </div>
          <Link
            href="/leagues"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
          >
            Ver zonas
          </Link>
        </div>

        {nearbyPlayers.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {nearbyPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                city={player.city}
                zoneName={player.preferredLeagueName}
                zoneSlug={player.preferredLeagueSlug}
                bio={player.bio}
                label={player.relationLabel}
                profileHref={`/players/${player.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Users className="size-5" />}
            eyebrow="Sin jugadores"
            title="Tu zona todavia va corta de rivales"
            description="A medida que mas jugadores se muevan por tu zona, veras aqui perfiles con los que cuadrar la proxima mesa."
            action={
              <Link
                href="/leagues"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
              >
                Explorar zonas
              </Link>
            }
          />
        )}
      </section>

      {nearbyPlayers.length === 0 && nearbyChallenges.length === 0 && latestMatches.length === 0 ? (
        <EmptyStateCard
          icon={<Trophy className="size-5" />}
          eyebrow="Empieza la temporada"
          title="Tu panel esta listo para llenarse de juego"
          description="Crea un reto o acepta una mesa en tu zona para empezar a mover tu historial y tu ELO."
          compact
        />
      ) : null}
    </div>
  );
}
