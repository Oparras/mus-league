import Link from "next/link";
import { MessageSquareMore, Users } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { ChatThread } from "@/components/chat/chat-thread";
import { ConversationList } from "@/components/chat/conversation-list";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { SectionHeading } from "@/components/common/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCompletedProfile } from "@/lib/auth/session";
import {
  getConversationDetailForUser,
  getConversationsForUser,
} from "@/lib/chat/queries";
import { cn } from "@/lib/utils";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{
    conversation?: string;
  }>;
}) {
  const { appUser } = await requireCompletedProfile();
  const resolvedSearchParams = await searchParams;
  const conversations = await getConversationsForUser(appUser.id);
  const selectedConversationId =
    resolvedSearchParams.conversation && conversations.some((item) => item.id === resolvedSearchParams.conversation)
      ? resolvedSearchParams.conversation
      : conversations[0]?.id;
  const selectedConversation = selectedConversationId
    ? await getConversationDetailForUser(appUser.id, selectedConversationId)
    : null;

  return (
    <div className="space-y-8">
      <QueryMessage />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-sm">
          <SectionHeading
            eyebrow="Chat"
            title="Tus conversaciones de Mus League"
            description="Habla con amigos para cuadrar mesas y sigue el chat de cada reto desde el mismo panel."
          />
        </div>

        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle>Actividad de chat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Conversaciones
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {conversations.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Directos
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {conversations.filter((conversation) => conversation.type === "DIRECT").length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Mesas
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {conversations.filter((conversation) => conversation.type === "CHALLENGE").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {conversations.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border-border/80 bg-card/95">
            <CardHeader>
              <CardTitle>Conversaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ConversationList
                conversations={conversations}
                activeConversationId={selectedConversationId}
                viewerUserId={appUser.id}
              />
            </CardContent>
          </Card>

          {selectedConversation ? (
            <ChatThread
              conversation={selectedConversation}
              viewerUserId={appUser.id}
              returnTo={`/chat?conversation=${selectedConversation.id}`}
            />
          ) : (
            <EmptyStateCard
              icon={<MessageSquareMore className="size-5" />}
              eyebrow="Sin seleccion"
              title="Elige una conversacion"
              description="Selecciona un hilo de la izquierda para ver mensajes y responder desde la app."
              compact
            />
          )}
        </section>
      ) : (
        <EmptyStateCard
          icon={<Users className="size-5" />}
          eyebrow="Todo por empezar"
          title="Todavia no tienes conversaciones"
          description="Abre chat con un amigo o entra en una mesa para que Mus League te cree el hilo automaticamente."
          action={
            <>
              <Link
                href="/friends"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
              >
                Ir a amigos
              </Link>
              <Link
                href="/matches"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}
              >
                Ver retos
              </Link>
            </>
          }
        />
      )}
    </div>
  );
}
