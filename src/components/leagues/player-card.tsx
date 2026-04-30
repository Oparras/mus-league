import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type PlayerCardProps = {
  displayName: string;
  avatarUrl?: string | null;
  city: string;
  zoneName?: string | null;
  zoneSlug?: string | null;
  bio?: string | null;
  label?: string;
};

export function PlayerCard({
  displayName,
  avatarUrl,
  city,
  zoneName,
  zoneSlug,
  bio,
  label,
}: PlayerCardProps) {
  return (
    <Card className="border-border/70 bg-card/95">
      <CardContent className="flex items-start gap-4 pt-4">
        <Avatar size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{displayName}</p>
            {label ? <Badge variant="outline">{label}</Badge> : null}
          </div>
          <div className="space-y-1 text-sm leading-6 text-muted-foreground">
            <p>{city}</p>
            {zoneName ? (
              zoneSlug ? (
                <Link
                  href={`/leagues/${zoneSlug}`}
                  className="inline-flex text-foreground underline-offset-4 hover:underline"
                >
                  {zoneName}
                </Link>
              ) : (
                <p>{zoneName}</p>
              )
            ) : null}
            <p>{bio || "Todavia no ha escrito nada sobre su estilo de juego."}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
