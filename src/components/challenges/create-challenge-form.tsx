"use client";

import { MapPinned } from "lucide-react";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { EmptyStateCard } from "@/components/common/empty-state-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createChallengeAction } from "@/lib/challenges/actions";
import { getMatchFormatOptions } from "@/lib/challenges/constants";

type CreateChallengeFormProps = {
  defaultLeagueId?: string | null;
  leagueOptions: {
    id: string;
    slug: string;
    name: string;
    pathLabel: string;
    depth: number;
  }[];
};

const formatOptions = getMatchFormatOptions();

export function CreateChallengeForm({
  defaultLeagueId,
  leagueOptions,
}: CreateChallengeFormProps) {
  if (leagueOptions.length === 0) {
    return (
      <EmptyStateCard
        icon={<MapPinned className="size-5" />}
        eyebrow="Sin zonas activas"
        title="Todavia no puedes abrir un reto"
        description="En cuanto haya zonas disponibles, desde aqui podras proponer mesa y empezar a reunir jugadores."
        compact
      />
    );
  }

  return (
    <form action={createChallengeAction} className="space-y-5">
      <QueryMessage />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="leagueId" className="text-sm font-medium text-foreground">
            Zona
          </label>
          <Select id="leagueId" name="leagueId" defaultValue={defaultLeagueId ?? ""} required>
            <option value="" disabled>
              Selecciona una zona
            </option>
            {leagueOptions.map((league) => (
              <option key={league.id} value={league.id}>
                {league.pathLabel}
              </option>
            ))}
          </Select>
          <p className="text-xs leading-5 text-muted-foreground">
            Elige el area amplia donde quieres mover el reto.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="matchFormat" className="text-sm font-medium text-foreground">
            Tipo de partida
          </label>
          <Select id="matchFormat" name="matchFormat" defaultValue={formatOptions[0]?.value} required>
            {formatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-2">
          <label htmlFor="locationName" className="text-sm font-medium text-foreground">
            Lugar propuesto
          </label>
          <Input
            id="locationName"
            name="locationName"
            placeholder="Móstoles, Bar La Plaza o Casa de Pedro"
            className="h-11 rounded-2xl px-3"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Opcional. Puedes indicar municipio, barrio, bar o punto de encuentro.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Nota para la mesa
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Ejemplo: mesa seria, ritmo agil y cierre limpio del resultado."
            className="min-h-24"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="proposedAt" className="text-sm font-medium text-foreground">
            Fecha y hora
          </label>
          <Input
            id="proposedAt"
            name="proposedAt"
            type="datetime-local"
            className="h-11 rounded-2xl px-3"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Opcional. Si la dejas vacia, el reto saldra como horario flexible.
          </p>
        </div>
      </div>

      <SubmitButton pendingLabel="Creando reto..." className="h-11 rounded-2xl px-5">
        Crear reto
      </SubmitButton>
    </form>
  );
}
