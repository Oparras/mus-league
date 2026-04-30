import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="max-w-xl space-y-6 rounded-[2rem] border border-border/70 bg-card/90 p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          404
        </p>
        <div className="space-y-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            No hemos encontrado esta ruta
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Esta direccion no apunta a ninguna pantalla activa de Mus League.
            Puedes volver al inicio o abrir directamente tu dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
            Volver al inicio
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full",
            )}
          >
            Abrir dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
