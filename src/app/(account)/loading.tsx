import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-8">
        <Skeleton className="h-10 w-52" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-14 w-full max-w-2xl" />
          <Skeleton className="h-6 w-full max-w-xl" />
        </div>
        <Card className="border-border/80 bg-card/95">
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 bg-card/95">
        <CardHeader className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

