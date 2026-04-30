import { ChallengeStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { getChallengeStatusLabel } from "@/lib/challenges/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<ChallengeStatus, string> = {
  OPEN: "border-primary/30 bg-primary/12 text-primary",
  FULL: "border-border bg-secondary text-foreground",
  TEAMS_EDITING: "border-primary/20 bg-primary/10 text-foreground",
  TEAMS_LOCKED: "border-primary/20 bg-primary text-primary-foreground",
  IN_PROGRESS: "border-primary/20 bg-primary text-primary-foreground",
  RESULT_SUBMITTED: "border-border bg-secondary text-foreground",
  CONFIRMED: "border-primary/30 bg-primary/12 text-primary",
  DISPUTED: "border-destructive/30 bg-destructive/12 text-destructive",
  CANCELLED: "border-destructive/30 bg-destructive/12 text-destructive",
};

export function ChallengeStatusBadge({
  status,
  className,
}: {
  status: ChallengeStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-3 py-1 text-[11px] tracking-[0.18em] uppercase", statusStyles[status], className)}
    >
      {getChallengeStatusLabel(status)}
    </Badge>
  );
}
