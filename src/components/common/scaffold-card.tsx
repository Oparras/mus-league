import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ScaffoldCardProps = {
  title: string;
  description: string;
  badge?: string;
  items?: string[];
  footer?: string;
  className?: string;
};

export function ScaffoldCard({
  title,
  description,
  badge,
  items,
  footer,
  className,
}: ScaffoldCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="gap-3">
        {badge ? <Badge variant="secondary">{badge}</Badge> : null}
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {items?.length ? (
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item} className="flex gap-3 leading-6">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
      {footer ? (
        <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
