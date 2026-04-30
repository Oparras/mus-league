import { MatchFormat } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { getMatchFormatLabel } from "@/lib/challenges/constants";
import { cn } from "@/lib/utils";

export function MatchFormatBadge({
  format,
  className,
}: {
  format: MatchFormat;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-border/80 bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {getMatchFormatLabel(format)}
    </Badge>
  );
}
