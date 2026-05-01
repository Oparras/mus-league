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
  friendOptions: {
    userId: string;
    displayName: string;
    preferredLeagueName: string | null;
    city: string | null;
  }[];
};

const formatOptions = getMatchFormatOptions();

export function CreateChallengeForm({
  defaultLeagueId,
  leagueOptions,
  friendOptions,
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
          <Select
            id="matchFormat"
            name="matchFormat"
            defaultValue={formatOptions[0]?.value}
            required
          >
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
            placeholder="Mostoles, Bar La Plaza o Casa de Pedro"
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

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Invitar amigos</label>
          <p className="text-xs leading-5 text-muted-foreground">
            Opcional. Marca a quien quieres avisar nada mas abrir la mesa.
          </p>
        </div>

        {friendOptions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {friendOptions.map((friend) => (
              <label
                key={friend.userId}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/30"
              >
                <input
                  type="checkbox"
                  name="invitedFriendIds"
                  value={friend.userId}
                  className="mt-1 size-4 rounded border-border bg-background text-primary focus:ring-primary/30"
                />
                <span className="space-y-1">
                  <span className="block font-medium">{friend.displayName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[friend.preferredLeagueName, friend.city].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            eyebrow="Sin amigos"
            title="Todavia no tienes amigos para invitar"
            description="En cuanto montes tu circulo de juego, podras dejar avisadas a tus parejas favoritas al crear un reto."
            compact
          />
        )}
      </div>

      <SubmitButton pendingLabel="Creando reto..." className="h-11 rounded-2xl px-5">
        Crear reto
      </SubmitButton>
    </form>
  );
}
