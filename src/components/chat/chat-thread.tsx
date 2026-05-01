import { MessageSquareMore } from "lucide-react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getConversationDescription,
  getConversationTitle,
  type ConversationDetail,
} from "@/lib/chat/queries";
import { sendConversationMessageAction } from "@/lib/chat/actions";
import { cn } from "@/lib/utils";

export function ChatThread({
  conversation,
  viewerUserId,
  returnTo,
  title,
  description,
  compact = false,
}: {
  conversation: ConversationDetail;
  viewerUserId: string;
  returnTo: string;
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  const headerTitle = title ?? getConversationTitle(conversation, viewerUserId);
  const headerDescription =
    description ?? getConversationDescription(conversation, viewerUserId);

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader className="space-y-2">
        <CardTitle>{headerTitle}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{headerDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {conversation.messages.length > 0 ? (
          <div className={cn("space-y-3", compact ? "max-h-[360px] overflow-y-auto pr-1" : "max-h-[480px] overflow-y-auto pr-1")}>
            {conversation.messages.map((message) => {
              const isOwnMessage = message.senderId === viewerUserId;

              return (
                <div
                  key={message.id}
                  className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-3xl border px-4 py-3 text-sm shadow-sm",
                      isOwnMessage
                        ? "border-primary/25 bg-primary text-primary-foreground"
                        : "border-border/70 bg-background/70 text-foreground",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4 text-xs opacity-80">
                      <span>{message.sender.displayName}</span>
                      <span>
                        {new Intl.DateTimeFormat("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(message.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-5 py-6 text-sm leading-6 text-muted-foreground">
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MessageSquareMore className="size-4" />
            </div>
            <p>Todavia no hay mensajes en esta conversacion.</p>
            <p className="mt-2">
              Ideas rapidas: &quot;Donde quedamos?&quot;, &quot;Buena partida&quot;,
              &quot;Revancha cuando quieras&quot;.
            </p>
          </div>
        )}

        <form action={sendConversationMessageAction} className="space-y-3">
          <input type="hidden" name="conversationId" value={conversation.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label htmlFor={`message-${conversation.id}`} className="text-sm font-medium text-foreground">
            Enviar mensaje
          </label>
          <Textarea
            id={`message-${conversation.id}`}
            name="body"
            placeholder="Escribe algo para coordinar la partida o comentar como fue la mesa."
            className="min-h-24"
          />
          <SubmitButton pendingLabel="Enviando..." className="rounded-full">
            Enviar mensaje
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
