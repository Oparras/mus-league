import Link from "next/link";
import { MapPinned, ShieldCheck, Swords, Trophy } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const productPillars = [
  {
    icon: Swords,
    title: "Reta a tu zona",
    description:
      "Abre un reto, marca el formato y deja claro donde os viene bien jugar.",
  },
  {
    icon: MapPinned,
    title: "Completa la mesa",
    description:
      "Cuatro plazas, equipos editables y sorteo rapido para sacar reyes cuando haga falta.",
  },
  {
    icon: ShieldCheck,
    title: "Cierra el resultado",
    description:
      "El marcador lo propone un equipo y el rival lo confirma antes de entrar en historial.",
  },
  {
    icon: Trophy,
    title: "Sube tu ELO",
    description:
      "Cada partida confirmada mueve tu ranking y deja rastro en tu perfil de jugador.",
  },
];

const playerBenefits = [
  "Retos abiertos por zonas amplias de Madrid.",
  "Ubicacion concreta para proponer bar, casa o municipio.",
  "Lobby 2vs2 editable antes de iniciar la partida.",
  "Historial con marcadores, rivales y variaciones de ELO.",
];

const howItWorks = [
  {
    step: "01",
    title: "Crea tu cuenta",
    description: "Elige tu zona principal y deja lista tu ficha para entrar a jugar.",
  },
  {
    step: "02",
    title: "Abre o acepta un reto",
    description: "Mueve la partida en tu zona y concreta lugar y hora si ya los sabes.",
  },
  {
    step: "03",
    title: "Configura equipos",
    description: "Reparte parejas a mano o aleatoriza antes de poner la mesa en curso.",
  },
  {
    step: "04",
    title: "Confirma y compite",
    description: "Cierra el marcador con el rival y deja que el ELO haga el resto.",
  },
];

export default function HomePage() {
  return (
    <div className="pb-20">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              Mus competitivo, social y bien cerrado
            </Badge>
            <div className="space-y-4">
              <h1 className="font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                La forma elegante de retar, jugar y subir ELO en Mus.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Organiza mesas 2vs2 por zonas, confirma resultados con el rival y
                sigue tu posicion en el ranking sin salir de la misma plataforma.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full",
              )}
            >
              Iniciar sesion
            </Link>
          </div>
        </div>

        <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
          <CardHeader className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Lo que se mueve en Mus League
            </p>
            <CardTitle className="text-2xl">Una plataforma hecha para jugar de verdad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playerBenefits.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto mt-6 w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Como funciona"
          title="De la propuesta al ranking"
          description="Todo el flujo esta pensado para que una mesa se organice rapido, se cierre bien y cuente en la clasificacion."
          align="center"
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {howItWorks.map((item) => (
            <Card key={item.step} className="border-border/80 bg-card/95">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs">
                  {item.step}
                </Badge>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-6">
        <SectionHeading
          eyebrow="Producto"
          title="Pensado para jugadores de Mus"
          description="Cada parte de la app resuelve un momento real: encontrar mesa, fijar equipos, cerrar resultado y competir con contexto."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productPillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <Card key={pillar.title} className="border-border/80 bg-card/95">
                <CardHeader className="space-y-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle>{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {pillar.description}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-20 w-full max-w-6xl px-6">
        <Card className="rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
          <CardContent className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Empieza hoy
              </p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Si tienes pareja, busca rival. Si no, encuentra mesa.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Mus League te deja organizar el reto, cerrar el marcador y ver
                como se mueve tu ranking en cada partida confirmada.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full",
                )}
              >
                Iniciar sesion
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
