import Link from "next/link";

import { marketingNav, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-lg space-y-2">
          <p className="font-heading text-lg font-semibold">{siteConfig.name}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            La comunidad donde las mesas se organizan rapido, los resultados se
            confirman sin lios y el ELO pone a cada pareja en su sitio.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
