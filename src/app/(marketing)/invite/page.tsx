import Link from "next/link";
import { ArrowRight, MapPin, Swords, Users } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { ChallengeStatusBadge } from "@/components/challenges/challenge-status-badge";
import { MatchFormatBadge } from "@/components/challenges/match-format-badge";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { ShareLinkActions } from "@/components/common/share-link-actions";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedAppContext, withRedirectTo } from "@/lib/auth/session";
import { joinChallengeAction } from "@/lib/challenges/actions";
import {
  formatChallengeProposedAt,
  getChallengeInvitePath,
  getChallengePath,
  getChallengeSeatsLabel,
} from "@/lib/challenges/links";
import {
  getChallengeByInviteCode,
  isChallengeJoinable,
} from "@/lib/challenges/queries";
import { cn } from "@/lib/utils";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const inviteCode = resolvedSearchParams.code?.trim().toUpperCase() ?? "";

  if (!inviteCode) {
    return (
      <section className="mx-auto flex w-full max-w-5xl px-6 py-16">
        <EmptyStateCard
          icon={<Swords className="size-5" />}
          eyebrow="Invitacion no valida"
          title="Ese enlace no trae una mesa lista"
          description="Pide de nuevo la invitacion o vuelve a Mus League para entrar por un reto activo."
          action={
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
              Volver al inicio
            </Link>
          }
        />
      </section>
    );
  }

  const [challenge, context] = await Promise.all([
    getChallengeByInviteCode(inviteCode),
    getAuthenticatedAppContext(),
  ]);

  if (!challenge) {
    return (
      <section className="mx-auto flex w-full max-w-5xl px-6 py-16">
        <EmptyStateCard
          icon={<Swords className="size-5" />}
          eyebrow="Invitacion caducada"
          title="No hemos encontrado esa mesa"
          description="Puede que el reto ya no exista o que el enlace haya quedado viejo. Pide a tu amigo una invitacion nueva."
          action={
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
              Ir a Mus League
            </Link>
          }
        />
      </section>
    );
  }

  const challengePath = getChallengePath(challenge.id);
  const invitePath = challenge.inviteCode
    ? getChallengeInvitePath(challenge.inviteCode)
    : challengePath;
  const participantCount = challenge.participants.length;
  const seatsLabel = getChallengeSeatsLabel(participantCount);
  const viewerIsParticipant = context
    ? challenge.participants.some((participant) => participant.userId === context.appUser.id)
    : false;
  const hasCompletedProfile = Boolean(context?.profile?.preferredLeagueId);
  const canJoin =
    hasCompletedProfile &&
    !viewerIsParticipant &&
    participantCount < 4 &&
    isChallengeJoinable(challenge.status);

  const registerHref = withRedirectTo("/register", challengePath);
  const loginHref = withRedirectTo("/login", challengePath);
  const onboardingHref = withRedirectTo("/onboarding", challengePath);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <ChallengeStatusBadge status={challenge.status} />
              <MatchFormatBadge format={challenge.matchFormat} />
            </div>

            <div className="mt-5 space-y-4">
              <SectionHeading
                eyebrow="Invitacion a una mesa"
                title={challenge.locationName || `Mesa en ${challenge.league.name}`}
                description={
                  challenge.description ||
                  "Te han invitado a una mesa de Mus League. Revisa la zona, las plazas libres y unete si te encaja."
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/80 bg-card/95">
              <CardContent className="pt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Zona
                </p>
                <p className="mt-2 font-medium text-foreground">{challenge.league.name}</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/95">
              <CardContent className="pt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Lugar
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {challenge.locationName || "Por concretar"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/95">
              <CardContent className="pt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Fecha y hora
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {formatChallengeProposedAt(challenge.proposedAt)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card/95">
              <CardContent className="pt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Plazas
                </p>
                <p className="mt-2 font-medium text-foreground">{participantCount}/4</p>
                <p className="mt-1 text-sm text-muted-foreground">{seatsLabel}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Jugadores apuntados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Creador: {challenge.creator.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">{seatsLabel}</p>
                </div>
                <AvatarGroup>
                  {challenge.participants.map((participant) => (
                    <Avatar key={participant.id} size="sm">
                      {participant.user.avatarUrl ? (
                        <AvatarImage
                          src={participant.user.avatarUrl}
                          alt={participant.user.displayName}
                        />
                      ) : null}
                      <AvatarFallback>
                        {participant.user.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {challenge.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <p className="font-medium text-foreground">{participant.user.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {participant.user.profile?.city ?? "Zona por confirmar"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Unete a la mesa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Comparte este enlace con tus amigos o entra tu mismo si la mesa te encaja.</p>
              <p className="font-medium text-foreground">{seatsLabel}</p>

              {!context ? (
                <div className="grid gap-3">
                  <Link
                    href={registerHref}
                    className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                  >
                    Crea cuenta para unirte
                  </Link>
                  <Link
                    href={loginHref}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full",
                    )}
                  >
                    Iniciar sesion
                  </Link>
                </div>
              ) : viewerIsParticipant ? (
                <Link
                  href={challengePath}
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                >
                  Abrir reto
                  <ArrowRight className="size-4" />
                </Link>
              ) : !hasCompletedProfile ? (
                <Link
                  href={onboardingHref}
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
                >
                  Completa tu perfil para unirte
                </Link>
              ) : canJoin ? (
                <form action={joinChallengeAction}>
                  <input type="hidden" name="challengeId" value={challenge.id} />
                  <SubmitButton pendingLabel="Uniendote..." className="h-11 rounded-full px-5">
                    Unirse al reto
                  </SubmitButton>
                </form>
              ) : (
                <Link
                  href={challengePath}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full",
                  )}
                >
                  Ver detalle del reto
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Compartir invitacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>Comparte este enlace con tus amigos y sentaos en la misma mesa sin rodeos.</p>
              <ShareLinkActions
                primaryPath={invitePath}
                primaryLabel="Copiar invitacion"
                secondaryPath={challengePath}
                secondaryLabel="Copiar enlace del reto"
                whatsappPath={invitePath}
                whatsappText={`Te invito a una mesa de Mus League en ${challenge.league.name}.`}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p className="flex items-start gap-3">
                <MapPin className="mt-1 size-4 text-primary" />
                La zona organiza el reto y el lugar concreto sirve para afinar la quedada.
              </p>
              <p className="flex items-start gap-3">
                <Users className="mt-1 size-4 text-primary" />
                La mesa admite hasta cuatro jugadores y no se repiten plazas.
              </p>
              <p className="flex items-start gap-3">
                <Swords className="mt-1 size-4 text-primary" />
                Cuando esteis cuatro, podreis cerrar parejas y arrancar la partida.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
