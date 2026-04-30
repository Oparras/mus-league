import { Badge } from "@/components/ui/badge";
import type { LeagueType } from "@/generated/prisma/client";

const leagueTypeLabel: Record<LeagueType, string> = {
  GLOBAL: "Todos",
  REGION: "Zona",
  CITY: "Municipio",
  LOCALITY: "Subzona",
};

export function LeagueTypeBadge({ type }: { type: LeagueType }) {
  return <Badge variant="secondary">{leagueTypeLabel[type]}</Badge>;
}
