import { BellRing, CheckCheck, Inbox } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompletedProfile } from "@/lib/auth/session";
import {
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
  openNotificationAction,
} from "@/lib/notifications/actions";
import {
  getNotificationInboxForUser,
  type NotificationItem,
} from "@/lib/notifications/queries";

const notificationTypeLabels: Record<NotificationItem["type"], string> = {
  FRIEND_REQUEST: "Solicitud",
  CHALLENGE_INVITE: "Invitacion",
  CHAT_MESSAGE: "Mensaje",
  RESULT_PENDING_CONFIRMATION: "Resultado pendiente",
  RESULT_DISPUTED: "Resultado en disputa",
};

function formatNotificationDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function NotificationRow({
  notification,
}: {
  notification: NotificationItem;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={notification.readAt ? "outline" : "secondary"}>
              {notificationTypeLabels[notification.type]}
            </Badge>
            {!notification.readAt ? (
              <Badge className="bg-primary/90 text-primary-foreground">Pendiente</Badge>
            ) : null}
          </div>
          <div>
            <p className="font-medium text-foreground">{notification.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {notification.body}
            </p>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatNotificationDate(notification.createdAt)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={openNotificationAction}>
          <input type="hidden" name="notificationId" value={notification.id} />
          <input type="hidden" name="returnTo" value="/notifications" />
          <SubmitButton pendingLabel="Abriendo..." className="rounded-full">
            Abrir
          </SubmitButton>
        </form>

        {!notification.readAt ? (
          <form action={markNotificationAsReadAction}>
            <input type="hidden" name="notificationId" value={notification.id} />
            <input type="hidden" name="returnTo" value="/notifications" />
            <SubmitButton
              pendingLabel="Actualizando..."
              variant="outline"
              className="rounded-full"
            >
              Marcar como leida
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default async function NotificationsPage() {
  const { appUser } = await requireCompletedProfile();
  const inbox = await getNotificationInboxForUser({
    userId: appUser.id,
  });

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <SectionHeading
            eyebrow="Centro de notificaciones"
            title="Todo lo que necesita tu atencion"
            description="Solicitudes, invitaciones, mensajes y resultados pendientes para que no se te escape ninguna mesa."
          />
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Pendientes
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                  {inbox.unread.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Leidas
                </p>
                <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                  {inbox.read.length}
                </p>
              </div>
            </div>

            {inbox.unread.length > 0 ? (
              <form action={markAllNotificationsAsReadAction}>
                <input type="hidden" name="returnTo" value="/notifications" />
                <SubmitButton
                  pendingLabel="Actualizando..."
                  variant="outline"
                  className="w-full rounded-full"
                >
                  Marcar todas como leidas
                </SubmitButton>
              </form>
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Estas al dia. En cuanto pase algo importante en tus mesas o en tu red,
                aparecera aqui.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Pendientes</h2>
          <p className="text-sm text-muted-foreground">{inbox.unread.length} por revisar</p>
        </div>

        {inbox.unread.length > 0 ? (
          <div className="space-y-4">
            {inbox.unread.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<BellRing className="size-5" />}
            eyebrow="Todo despejado"
            title="No tienes avisos pendientes"
            description="Cuando alguien te escriba, te invite o te pida confirmar un resultado, lo veras aqui."
            compact
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-semibold">Leidas</h2>
          <p className="text-sm text-muted-foreground">{inbox.read.length} en historial</p>
        </div>

        {inbox.read.length > 0 ? (
          <div className="space-y-4">
            {inbox.read.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={<Inbox className="size-5" />}
            eyebrow="Sin archivo"
            title="Todavia no has archivado avisos"
            description="Tus notificaciones leidas iran quedando aqui como referencia rapida."
            compact
          />
        )}
      </section>

      {inbox.unread.length === 0 && inbox.read.length === 0 ? (
        <EmptyStateCard
          icon={<CheckCheck className="size-5" />}
          eyebrow="Bandeja vacia"
          title="Mus League te avisara cuando algo se mueva"
          description="Solicitudes de amistad, invitaciones a reto, mensajes y resultados pendientes apareceran en este centro."
          compact
        />
      ) : null}
    </div>
  );
}
