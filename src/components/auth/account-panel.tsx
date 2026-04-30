import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/site-config";

type AccountPanelProps = {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
};

export function AccountPanel({
  title,
  description,
  footer,
  children,
}: AccountPanelProps) {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            ML
          </span>
          <div className="space-y-0.5">
            <p className="font-heading text-base font-semibold">{siteConfig.name}</p>
            <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
          </div>
        </Link>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Acceso de jugador
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-sm">
          <p className="font-heading text-lg font-semibold">Lo que te espera dentro</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Encontrar retos abiertos en tu zona y sentarte en la mesa en segundos.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Configurar parejas, cerrar marcadores y dejar cada partida bien validada.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Seguir tu ELO, tus estadisticas y el pulso competitivo de tu zona.</span>
            </li>
          </ul>
        </div>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {children}
          {footer ? (
            <div className="border-t border-border/70 pt-4 text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
