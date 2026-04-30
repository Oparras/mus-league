import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/80 bg-card/95">
          <CardContent className="space-y-4 p-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full max-w-2xl" />
            <Skeleton className="h-6 w-full max-w-3xl" />
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-card/95">
          <CardHeader className="space-y-3">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border/80 bg-card/95">
            <CardHeader className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

