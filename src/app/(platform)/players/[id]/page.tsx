import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, MapPinned, Swords, UserPlus } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireCompletedProfile } from "@/lib/auth/session";
import {
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/lib/friends/actions";
import { getFriendshipState } from "@/lib/friends/queries";
import { getInvitableChallengesForFriend } from "@/lib/challenges/queries";
import { inviteFriendToChallengeAction } from "@/lib/challenges/actions";
import { calculateWinrate } from "@/lib/elo/queries";
import { getPublicPlayerProfileByUserId } from "@/lib/profile/profile";
import { cn } from "@/lib/utils";

function buildChallengeLabel(option: {
  locationName: string | null;
  leagueName: string;
  participantCount: number;
  inviteStatus: "PENDING" | "ACCEPTED" | "DECLINED" | null;
}) {
  const baseLabel = option.locationName || `Mesa en ${option.leagueName}`;
  const inviteSuffix =
    option.inviteStatus === "PENDING"
      ? " · invitacion enviada"
      : option.inviteStatus === "ACCEPTED"
        ? " · ya dentro"
        : "";

  return `${baseLabel} · ${option.participantCount}/4${inviteSuffix}`;
}

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { appUser } = await requireCompletedProfile();
  const { id } = await params;

  if (id === appUser.id) {
    redirect("/profile");
  }

  const [player, friendshipState, invitableChallenges] = await Promise.all([
    getPublicPlayerProfileByUserId(id),
    getFriendshipState(appUser.id, id),
    getInvitableChallengesForFriend(appUser.id, id),
  ]);

  if (!player || !player.profile) {
    notFound();
  }

  const returnTo = `/players/${player.id}`;
  const winrate = calculateWinrate(player.profile.wins, player.profile.matchesPlayed);
  const hasActiveChallengeToInvite = invitableChallenges.length > 0;

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar size="lg" className="size-16 sm:size-20">
              {player.avatarUrl ? <AvatarImage src={player.avatarUrl} alt={player.displayName} /> : null}
              <AvatarFallback>{player.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-4">
              <SectionHeading
                eyebrow="Perfil de jugador"
                title={player.displayName}
                description={
                  player.profile.bio ||
                  "Jugador activo en Mus League, listo para sumar mesas, confirmar resultados y competir por ELO."
                }
              />
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                  {player.profile.city}
                </span>
                {player.profile.preferredLeague ? (
                  <Link
                    href={`/leagues/${player.profile.preferredLeague.slug}`}
                    className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 transition-colors hover:text-foreground"
                  >
                    {player.profile.preferredLeague.name}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Resumen competitivo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary">ELO</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {player.profile.elo}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Partidas
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {player.profile.matchesPlayed}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Victorias
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {player.profile.wins}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Winrate
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {winrate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Relacion con este jugador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {friendshipState.isFriend ? (
              <>
                <p>Ya forma parte de tu lista de amigos.</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/friends"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                  >
                    Ver amigos
                  </Link>
                  <form action={removeFriendAction}>
                    <input type="hidden" name="targetUserId" value={player.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton pendingLabel="Eliminando..." variant="outline" className="rounded-full">
                      Eliminar amigo
                    </SubmitButton>
                  </form>
                </div>
              </>
            ) : friendshipState.isPendingIncoming ? (
              <>
                <p>Este jugador ya te ha enviado una solicitud.</p>
                <div className="flex flex-wrap gap-3">
                  <form action={acceptFriendRequestAction}>
                    <input type="hidden" name="targetUserId" value={player.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton pendingLabel="Aceptando..." className="rounded-full">
                      Aceptar solicitud
                    </SubmitButton>
                  </form>
                  <form action={rejectFriendRequestAction}>
                    <input type="hidden" name="targetUserId" value={player.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <SubmitButton pendingLabel="Rechazando..." variant="outline" className="rounded-full">
                      Rechazar solicitud
                    </SubmitButton>
                  </form>
                </div>
              </>
            ) : friendshipState.isPendingOutgoing ? (
              <>
                <p>Tu solicitud esta pendiente de respuesta.</p>
                <Link
                  href="/friends"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                >
                  Ir a amigos
                </Link>
              </>
            ) : (
              <>
                <p>Anade a este jugador para invitarle a tus retos sin salir de la app.</p>
                <form action={sendFriendRequestAction}>
                  <input type="hidden" name="targetUserId" value={player.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <SubmitButton pendingLabel="Enviando..." className="rounded-full">
                    Anadir amigo
                  </SubmitButton>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Invitar a partida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            {friendshipState.isFriend ? (
              hasActiveChallengeToInvite ? (
                <form action={inviteFriendToChallengeAction} className="space-y-4">
                  <input type="hidden" name="invitedPlayerId" value={player.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <div className="space-y-2">
                    <label htmlFor="challengeId" className="text-sm font-medium text-foreground">
                      Elige una mesa activa
                    </label>
                    <Select id="challengeId" name="challengeId" defaultValue={invitableChallenges[0]?.id} required>
                      {invitableChallenges.map((challenge) => (
                        <option key={challenge.id} value={challenge.id}>
                          {buildChallengeLabel(challenge)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <SubmitButton pendingLabel="Invitando..." className="rounded-full">
                    Invitar a partida
                  </SubmitButton>
                </form>
              ) : (
                <EmptyStateCard
                  icon={<Swords className="size-5" />}
                  eyebrow="Sin hueco activo"
                  title="No tienes ahora mismo una mesa abierta para invitarle"
                  description="Abre un reto nuevo o entra en una mesa con plazas libres y podras mandarle invitacion directa al momento."
                  action={
                    <Link
                      href="/matches#create-challenge"
                      className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                    >
                      Crear reto
                    </Link>
                  }
                  compact
                />
              )
            ) : (
              <EmptyStateCard
                icon={<UserPlus className="size-5" />}
                eyebrow="Primero conecta"
                title="Necesitas ser amigo para invitarle directamente"
                description="Cuando acepte vuestra solicitud, podras sentarle en una de tus mesas con un par de toques."
                compact
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Zona principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <MapPinned className="size-4 text-primary" />
              <span>{player.profile.preferredLeague?.name ?? "Zona pendiente"}</span>
            </div>
            <p>{player.profile.city}</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Activity className="size-4 text-primary" />
              <span>{player.profile.matchesPlayed} partidas registradas</span>
            </div>
            <p>
              Balance actual: {player.profile.wins} victorias y {player.profile.losses} derrotas.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Proxima accion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>
              Si la zona y el estilo te encajan, anade a este jugador y tenlo a mano para tus proximas mesas.
            </p>
            <Link
              href="/matches"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
            >
              Ver retos abiertos
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
