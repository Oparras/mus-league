"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <Card className="w-full max-w-xl border-border/80 bg-card/95">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
            <CircleAlert className="size-5" />
          </div>
          <CardTitle>No hemos podido cargar este acceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            Ha ocurrido un problema al preparar esta pantalla de acceso. Puedes
            reintentar la carga ahora mismo.
          </p>
          <Button onClick={() => reset()} className="rounded-2xl">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

