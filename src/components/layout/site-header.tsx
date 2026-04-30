"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { marketingNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            ML
          </span>
          <div className="space-y-0.5">
            <p className="font-heading text-sm font-semibold">{siteConfig.name}</p>
            <p className="text-xs text-muted-foreground">{siteConfig.tagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                isActive(pathname, item.href) &&
                  "bg-secondary text-secondary-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "rounded-full",
            )}
          >
            Iniciar sesion
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full")}
          >
            Crear cuenta
          </Link>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="rounded-full md:hidden"
              />
            }
          >
            <Menu />
            <span className="sr-only">Abrir navegacion</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px]">
            <SheetHeader>
              <SheetTitle>{siteConfig.name}</SheetTitle>
              <SheetDescription>{siteConfig.tagline}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
              {marketingNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl border border-border/70 px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-secondary/60",
                    isActive(pathname, item.href) && "border-primary/40 bg-secondary",
                  )}
                >
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              ))}
              <div className="mt-4 grid gap-3">
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
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
