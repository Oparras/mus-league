import Link from "next/link";
import { MessageSquareMore, Swords, UserRound } from "lucide-react";

import {
  getConversationCounterpart,
  getConversationDescription,
  getConversationTitle,
  type ConversationListItem,
} from "@/lib/chat/queries";
import { cn } from "@/lib/utils";

export function ConversationList({
  conversations,
  activeConversationId,
  viewerUserId,
}: {
  conversations: ConversationListItem[];
  activeConversationId?: string | null;
  viewerUserId: string;
}) {
  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const counterpart = getConversationCounterpart(conversation, viewerUserId);
        const latestMessage = conversation.messages[0] ?? null;
        const active = conversation.id === activeConversationId;

        return (
          <Link
            key={conversation.id}
            href={`/chat?conversation=${conversation.id}`}
            className={cn(
              "flex gap-3 rounded-2xl border px-4 py-4 transition-colors",
              active
                ? "border-primary/30 bg-primary/10"
                : "border-border/70 bg-background/60 hover:border-primary/20 hover:bg-secondary/50",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border",
                active
                  ? "border-primary/25 bg-primary text-primary-foreground"
                  : "border-border bg-card text-primary",
              )}
            >
              {conversation.type === "DIRECT" ? (
                counterpart?.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={counterpart.user.avatarUrl}
                    alt={counterpart.user.displayName}
                    className="size-full rounded-2xl object-cover"
                  />
                ) : (
                  <UserRound className="size-4" />
                )
              ) : (
                <Swords className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate font-medium text-foreground">
                  {getConversationTitle(conversation, viewerUserId)}
                </p>
                {latestMessage ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(latestMessage.createdAt)}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {latestMessage
                  ? `${latestMessage.sender.displayName}: ${latestMessage.body}`
                  : getConversationDescription(conversation, viewerUserId)}
              </p>
            </div>
          </Link>
        );
      })}

      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-sm leading-6 text-muted-foreground">
          <div className="mb-3 flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <MessageSquareMore className="size-4" />
          </div>
          Tus conversaciones apareceran aqui cuando abras chat con un amigo o entres en una mesa.
        </div>
      ) : null}
    </div>
  );
}
