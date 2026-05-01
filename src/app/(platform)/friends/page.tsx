import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { PlayerCard } from "@/components/leagues/player-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireCompletedProfile } from "@/lib/auth/session";
import { openDirectConversationAction } from "@/lib/chat/actions";
import {
  acceptFriendRequestAction,
  rejectFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/lib/friends/actions";
import { getFriendDirectoryData } from "@/lib/friends/queries";
import { getLeagueSelectionOptions } from "@/lib/leagues/queries";
import { cn } from "@/lib/utils";

function buildFriendsPath(query?: string, zone?: string) {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("q", query);
  }

  if (zone) {
    searchParams.set("zone", zone);
  }

  const serialized = searchParams.toString();
  return serialized ? `/friends?${serialized}` : "/friends";
}

function renderAcceptRejectActions(targetUserId: string, returnTo: string) {
  return (
    <>
      <form action={acceptFriendRequestAction}>
        <input type="hidden" name="targetUserId" value={targetUserId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <SubmitButton pendingLabel="Aceptando..." className="rounded-full">
          Aceptar
        </SubmitButton>
      </form>
      <form action={rejectFriendRequestAction}>
        <input type="hidden" name="targetUserId" value={targetUserId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <SubmitButton pendingLabel="Rechazando..." variant="outline" className="rounded-full">
          Rechazar
        </SubmitButton>
      </form>
    </>
  );
}

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    zone?: string;
  }>;
}) {
  const { appUser } = await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const zone = resolvedSearchParams.zone?.trim() ?? "";
  const returnTo = buildFriendsPath(query, zone);

  const [leagueOptions, directory] = await Promise.all([
    getLeagueSelectionOptions(),
    getFriendDirectoryData({
      viewerUserId: appUser.id,
      query,
      leagueId: zone || undefined,
    }),
  ]);

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <SectionHeading
            eyebrow="Amigos"
            title="Tu circulo de juego"
            description="Encuentra jugadores por nombre o zona, gestiona solicitudes y deja lista tu mesa de confianza para los proximos retos."
          />
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Resumen social</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Amigos
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {directory.friends.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Recibidas
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {directory.received.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Enviadas
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {directory.sent.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/80 bg-card/95">
        <CardHeader>
          <CardTitle>Buscar jugadores</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1fr_280px_auto]" action="/friends">
            <div className="space-y-2">
              <label htmlFor="q" className="text-sm font-medium text-foreground">
                Nombre o ubicacion
              </label>
              <Input
                id="q"
                name="q"
                defaultValue={query}
                placeholder="Busca por nombre, barrio o municipio"
                className="h-11 rounded-2xl px-3"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="zone" className="text-sm font-medium text-foreground">
                Zona
              </label>
              <Select id="zone" name="zone" defaultValue={zone}>
                <option value="">Todas las zonas</option>
                {leagueOptions.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl lg:w-auto")}
              >
                Buscar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Solicitudes recibidas</h2>
          <p className="text-sm text-muted-foreground">{directory.received.length} pendientes</p>
        </div>

        {directory.received.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {directory.received.map((player) => (
              <PlayerCard
                key={player.userId}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                city={player.city ?? "Zona pendiente"}
                zoneName={player.preferredLeagueName}
                zoneSlug={player.preferredLeagueSlug}
                bio={player.bio}
                label="Te ha invitado"
                profileHref={`/players/${player.userId}`}
                action={renderAcceptRejectActions(player.userId, returnTo)}
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Users className="size-5" />}
            eyebrow="Sin pendientes"
            title="No tienes solicitudes recibidas"
            description="Cuando otro jugador quiera sumarte a su circulo, la veras aparecer aqui con acceso directo para aceptar o rechazar."
            compact
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Tus amigos</h2>
          <p className="text-sm text-muted-foreground">{directory.friends.length} jugadores</p>
        </div>

        {directory.friends.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {directory.friends.map((player) => (
              <PlayerCard
                key={player.userId}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                city={player.city ?? "Zona pendiente"}
                zoneName={player.preferredLeagueName}
                zoneSlug={player.preferredLeagueSlug}
                bio={player.bio}
                label={player.elo ? `ELO ${player.elo}` : "Amigo"}
                profileHref={`/players/${player.userId}`}
                action={
                  <>
                    <Link
                      href={`/players/${player.userId}`}
                      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                    >
                      Ver perfil
                    </Link>
                    <form action={openDirectConversationAction}>
                      <input type="hidden" name="targetUserId" value={player.userId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton pendingLabel="Abriendo..." variant="outline" className="rounded-full">
                        Abrir chat
                      </SubmitButton>
                    </form>
                    <form action={removeFriendAction}>
                      <input type="hidden" name="targetUserId" value={player.userId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton
                        pendingLabel="Eliminando..."
                        variant="outline"
                        className="rounded-full"
                      >
                        Eliminar amigo
                      </SubmitButton>
                    </form>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<UserPlus className="size-5" />}
            eyebrow="Tu circulo"
            title="Todavia no has conectado con otros jugadores"
            description="Busca perfiles por nombre o zona y monta una lista de amigos para invitar a tus mesas en segundos."
            compact
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Solicitudes enviadas</h2>
          <p className="text-sm text-muted-foreground">{directory.sent.length} en curso</p>
        </div>

        {directory.sent.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {directory.sent.map((player) => (
              <PlayerCard
                key={player.userId}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                city={player.city ?? "Zona pendiente"}
                zoneName={player.preferredLeagueName}
                zoneSlug={player.preferredLeagueSlug}
                bio={player.bio}
                label="Solicitud enviada"
                profileHref={`/players/${player.userId}`}
                action={
                  <p className="text-sm text-muted-foreground">
                    En cuanto responda, podras invitarle a tus retos con un toque.
                  </p>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Search className="size-5" />}
            eyebrow="Todo despejado"
            title="No tienes solicitudes enviadas"
            description="Usa el buscador para localizar jugadores de tu zona y empezar a construir tu red."
            compact
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Resultados del buscador</h2>
          <p className="text-sm text-muted-foreground">{directory.searchResults.length} perfiles</p>
        </div>

        {directory.searchResults.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {directory.searchResults.map((player) => (
              <PlayerCard
                key={player.userId}
                displayName={player.displayName}
                avatarUrl={player.avatarUrl}
                city={player.city ?? "Zona pendiente"}
                zoneName={player.preferredLeagueName}
                zoneSlug={player.preferredLeagueSlug}
                bio={player.bio}
                label={player.friendshipStatus === "ACCEPTED" ? "Amigo" : undefined}
                profileHref={`/players/${player.userId}`}
                action={
                  player.friendshipStatus === "ACCEPTED" ? (
                    <>
                      <Link
                        href={`/players/${player.userId}`}
                        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
                      >
                        Ver perfil
                      </Link>
                      <form action={openDirectConversationAction}>
                        <input type="hidden" name="targetUserId" value={player.userId} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <SubmitButton pendingLabel="Abriendo..." variant="outline" className="rounded-full">
                          Abrir chat
                        </SubmitButton>
                      </form>
                    </>
                  ) : player.friendshipStatus === "PENDING" &&
                    player.friendshipDirection === "INCOMING" ? (
                    renderAcceptRejectActions(player.userId, returnTo)
                  ) : player.friendshipStatus === "PENDING" ? (
                    <p className="text-sm text-muted-foreground">Solicitud enviada.</p>
                  ) : (
                    <form action={sendFriendRequestAction}>
                      <input type="hidden" name="targetUserId" value={player.userId} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton pendingLabel="Enviando..." className="rounded-full">
                        Anadir amigo
                      </SubmitButton>
                    </form>
                  )
                }
              />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Search className="size-5" />}
            eyebrow="Sin resultados"
            title="No hemos encontrado jugadores con ese filtro"
            description="Prueba otra zona o busca por nombre, barrio o municipio para localizar nuevas mesas."
            compact
          />
        )}
      </section>
    </div>
  );
}
