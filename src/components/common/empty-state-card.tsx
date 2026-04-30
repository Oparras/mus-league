import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyStateCard({
  icon,
  eyebrow,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardContent
        className={
          compact
            ? "flex flex-col gap-4 px-6 py-6"
            : "flex flex-col gap-5 px-6 py-8 sm:px-8"
        }
      >
        {icon ? (
          <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

