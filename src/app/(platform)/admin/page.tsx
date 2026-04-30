import { CheckCircle2, CircleDashed } from "lucide-react";

import { ScaffoldCard } from "@/components/common/scaffold-card";
import { SectionHeading } from "@/components/common/section-heading";
import { getRuntimeStatus } from "@/lib/config/server-env";

const adminTracks = [
  {
    badge: "Supervision",
    title: "Mesas y actividad bajo control",
    description:
      "Este espacio queda preparado para revisar el pulso general de la plataforma y detectar incidencias antes de que afecten a las mesas.",
    items: [
      "Retos abiertos, mesas en curso y resultados pendientes de revisar.",
      "Partidas disputadas que necesitan una mirada mas de cerca.",
      "Senales rapidas para saber si el servicio esta listo para seguir jugando.",
    ],
  },
  {
    badge: "Territorio",
    title: "Zonas listas para crecer",
    description:
      "Mus League ya distingue la zona principal del jugador y el lugar concreto de cada reto para ordenar mejor la actividad.",
    items: [
      "Ranking global para toda la comunidad.",
      "Zonas amplias para organizar jugadores y retos cercanos.",
      "Ubicaciones concretas dentro de cada mesa cuando haga falta afinar el encuentro.",
    ],
  },
  {
    badge: "Mantenimiento",
    title: "Readiness del servicio",
    description:
      "La vista resume si las piezas clave del servicio estan listas para sostener registro, retos, resultados y clasificacion.",
    items: [
      "Acceso de jugadores disponible.",
      "Persistencia lista para guardar mesas, resultados y ELO.",
      "Espacio preparado para ampliar operativa sin romper el flujo principal.",
    ],
  },
];

export default function AdminPage() {
  const runtimeStatus = getRuntimeStatus();
  const statusRows = [
    {
      label: "Partidas y perfiles",
      value: runtimeStatus.database,
      description: "La capa de datos principal esta lista para mover jugadores, retos, resultados y clasificaciones.",
    },
    {
      label: "Cambios de estructura",
      value: runtimeStatus.directDatabase,
      description: "El canal de mantenimiento del esquema esta disponible para evolucionar la plataforma con seguridad.",
    },
    {
      label: "Acceso de jugadores",
      value: runtimeStatus.supabaseBrowser,
      description: "El acceso web y la sesion de juego pueden operar con normalidad desde la interfaz.",
    },
    {
      label: "Operaciones internas",
      value: runtimeStatus.supabaseAdmin,
      description: "Las tareas internas quedan listas para automatizaciones y mantenimiento cuando se necesiten.",
    },
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Admin"
        title="Centro de control de Mus League"
        description="Una vista rapida para comprobar que la plataforma esta lista para seguir moviendo mesas, resultados y clasificacion."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {statusRows.map((row) => (
          <div
            key={row.label}
            className="rounded-[1.75rem] border border-border/70 bg-card/90 p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {row.label}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {row.description}
                </p>
              </div>
              <span className="mt-1">
                {row.value ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <CircleDashed className="size-5 text-muted-foreground" />
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {adminTracks.map((track) => (
          <ScaffoldCard
            key={track.title}
            badge={track.badge}
            title={track.title}
            description={track.description}
            items={track.items}
          />
        ))}
      </div>
    </div>
  );
}
