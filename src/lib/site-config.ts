export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export const siteConfig = {
  name: "Mus League",
  description:
    "La plataforma para retar, jugar, confirmar resultados y subir ELO en partidas de Mus.",
  tagline:
    "Reta, juega, confirma resultados y sube en el ranking.",
  docsPath: "docs/technical-architecture.md",
};

export const marketingNav: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    description: "La puerta de entrada a Mus League.",
  },
  {
    href: "/dashboard",
    label: "Tu mesa",
    description: "ELO, actividad y retos de tu zona.",
  },
  {
    href: "/leagues",
    label: "Zonas",
    description: "Las zonas donde se mueve la comunidad.",
  },
  {
    href: "/matches",
    label: "Retos",
    description: "Retos abiertos, equipos y partidas en marcha.",
  },
];

export const platformNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Tu ELO, tus ultimas mesas y lo que se mueve a tu alrededor.",
  },
  {
    href: "/leagues",
    label: "Zonas",
    description: "Las zonas amplias donde juegas y encuentras rivales.",
  },
  {
    href: "/matches",
    label: "Retos",
    description: "Retos abiertos, equipos editables y partidas en curso.",
  },
  {
    href: "/rankings",
    label: "Ranking",
    description: "Tu posicion global y el pulso competitivo de cada zona.",
  },
  {
    href: "/profile",
    label: "Perfil",
    description: "Tu identidad, tu zona y tus estadisticas de juego.",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Estado tecnico, integraciones y preparacion del entorno.",
  },
];
