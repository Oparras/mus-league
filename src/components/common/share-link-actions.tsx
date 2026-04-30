"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircleMore } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareLinkActionsProps = {
  primaryPath: string;
  primaryLabel: string;
  secondaryPath?: string;
  secondaryLabel?: string;
  whatsappPath?: string;
  whatsappText: string;
  className?: string;
};

function getOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function ShareLinkActions({
  primaryPath,
  primaryLabel,
  secondaryPath,
  secondaryLabel,
  whatsappPath,
  whatsappText,
  className,
}: ShareLinkActionsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const whatsappHref = useMemo(() => {
    const shareUrl = new URL(whatsappPath ?? primaryPath, getOrigin()).toString();
    return `https://wa.me/?text=${encodeURIComponent(`${whatsappText} ${shareUrl}`)}`;
  }, [primaryPath, whatsappPath, whatsappText]);

  async function copyLink(path: string, label: string) {
    try {
      const absoluteUrl = new URL(path, getOrigin()).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setHasCopied(true);
      setFeedback(`${label} copiado.`);
    } catch {
      setHasCopied(false);
      setFeedback("No hemos podido copiar el enlace. Intentalo otra vez.");
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          size="lg"
          className="rounded-full"
          onClick={() => copyLink(primaryPath, primaryLabel)}
        >
          {hasCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {primaryLabel}
        </Button>

        {secondaryPath && secondaryLabel ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="rounded-full"
            onClick={() => copyLink(secondaryPath, secondaryLabel)}
          >
            <Copy className="size-4" />
            {secondaryLabel}
          </Button>
        ) : null}

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "rounded-full")}
        >
          <MessageCircleMore className="size-4" />
          Compartir por WhatsApp
        </a>
      </div>

      {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}
    </div>
  );
}
