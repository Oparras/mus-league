"use client";

import { useState, type ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareMore,
  Shield,
  Swords,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOutAction } from "@/lib/auth/actions";
import { platformNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const navIcons = {
  "/dashboard": LayoutDashboard,
  "/leagues": Layers3,
  "/matches": Swords,
  "/chat": MessageSquareMore,
  "/notifications": BellRing,
  "/rankings": Trophy,
  "/profile": UserRound,
  "/friends": Users,
  "/admin": Shield,
} as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationList({
  pathname,
  onNavigate,
  compact = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <nav className={compact ? "space-y-1.5" : "space-y-2"}>
      {platformNav.map((item) => {
        const Icon = navIcons[item.href as keyof typeof navIcons];
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex rounded-2xl border border-transparent transition-colors",
              compact ? "px-3 py-2.5" : "px-4 py-3",
              active
                ? "border-primary/20 bg-primary/8 text-foreground"
                : "text-muted-foreground hover:border-border/80 hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  compact
                    ? "mt-0.5 flex size-8 items-center justify-center rounded-xl border"
                    : "mt-0.5 flex size-9 items-center justify-center rounded-xl border",
                  active
                    ? "border-primary/20 bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className={compact ? "space-y-0.5" : "space-y-1"}>
                <p className="font-medium">{item.label}</p>
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    compact ? "leading-4" : "leading-5",
                  )}
                >
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

type AppShellProps = {
  children: ReactNode;
  currentUser: {
    displayName: string;
    avatarUrl?: string | null;
    preferredZone: string;
  };
  unreadNotificationCount: number;
};

export function AppShell({
  children,
  currentUser,
  unreadNotificationCount,
}: AppShellProps) {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const currentRoute =
    platformNav.find((item) => isActive(pathname, item.href)) ?? platformNav[0];

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border/60 bg-sidebar/90 lg:flex lg:flex-col">
          <div className="space-y-6 px-6 py-8">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  ML
                </span>
                <div>
                  <p className="font-heading text-base font-semibold">
                    {siteConfig.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Mus competitivo 2vs2</p>
                </div>
              </Link>
              <Badge variant="secondary">Mesa abierta</Badge>
            </div>

            <NavigationList pathname={pathname} />
          </div>

          <div className="mt-auto px-6 py-8">
            <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <p className="font-heading text-sm font-semibold text-foreground">
                Juega con ventaja
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sigue tus retos, revisa tu ranking y encuentra jugadores de tu
                zona sin salir de la misma mesa.
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-6 lg:px-10">
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full lg:hidden"
                    />
                  }
                >
                  <Menu />
                  <span className="sr-only">Abrir navegacion</span>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex h-dvh max-h-screen w-[320px] max-w-[88vw] flex-col overflow-hidden p-0"
                >
                  <SheetHeader className="shrink-0 border-b border-border/60 pr-14">
                    <SheetTitle>{siteConfig.name}</SheetTitle>
                    <SheetDescription>
                      Accede rapido a tu zona, tus retos y tu posicion en el ranking.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                    <NavigationList
                      pathname={pathname}
                      onNavigate={() => setIsMobileNavOpen(false)}
                      compact
                    />
                  </div>
                  <SheetFooter className="shrink-0 border-t border-border/60 bg-background/95">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileNavOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-3"
                    >
                      <Avatar size="sm">
                        {currentUser.avatarUrl ? (
                          <AvatarImage
                            src={currentUser.avatarUrl}
                            alt={currentUser.displayName}
                          />
                        ) : null}
                        <AvatarFallback>ML</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {currentUser.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {currentUser.preferredZone}
                        </p>
                      </div>
                    </Link>
                    <form action={signOutAction} className="w-full">
                      <Button
                        type="submit"
                        variant="outline"
                        size="lg"
                        className="w-full rounded-2xl"
                      >
                        <LogOut className="size-4" />
                        Cerrar sesion
                      </Button>
                    </form>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Plataforma
                </p>
                <h1 className="font-heading text-lg font-semibold">
                  {currentRoute.label}
                </h1>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <Badge variant="outline" className="hidden rounded-full md:inline-flex">
                  Zona en juego
                </Badge>
                <Link
                  href="/notifications"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "relative rounded-full",
                  )}
                >
                  <BellRing className="size-4" />
                  {unreadNotificationCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {unreadNotificationCount > 0
                      ? `Abrir notificaciones. Tienes ${unreadNotificationCount} pendientes.`
                      : "Abrir notificaciones"}
                  </span>
                </Link>
                <Separator orientation="vertical" className="hidden h-8 md:block" />
                <Link href="/profile" className="flex items-center gap-3">
                  <Avatar size="sm">
                    {currentUser.avatarUrl ? (
                      <AvatarImage
                        src={currentUser.avatarUrl}
                        alt={currentUser.displayName}
                      />
                    ) : null}
                    <AvatarFallback>ML</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-right md:block">
                    <p className="text-sm font-medium text-foreground">
                      {currentUser.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {currentUser.preferredZone}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
