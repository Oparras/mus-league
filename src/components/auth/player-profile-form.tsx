"use client";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  completeProfileAction,
  signOutAction,
  updateProfileAction,
} from "@/lib/auth/actions";

type PlayerProfileFormProps = {
  mode: "onboarding" | "profile";
  leagueOptions: {
    id: string;
    slug: string;
    name: string;
    pathLabel: string;
    depth: number;
  }[];
  initialValues: {
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    city?: string | null;
    preferredLeagueId?: string | null;
    email: string;
  };
  redirectTo?: string | null;
};

export function PlayerProfileForm({
  mode,
  leagueOptions,
  initialValues,
  redirectTo,
}: PlayerProfileFormProps) {
  const action =
    mode === "onboarding" ? completeProfileAction : updateProfileAction;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5">
        <QueryMessage />
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="displayName"
              className="text-sm font-medium text-foreground"
            >
              Nombre visible
            </label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={initialValues.displayName}
              autoComplete="nickname"
              className="h-11 rounded-2xl px-3"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo
            </label>
            <Input
              id="email"
              value={initialValues.email}
              className="h-11 rounded-2xl px-3"
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium text-foreground">
            URL del avatar
          </label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            defaultValue={initialValues.avatarUrl ?? ""}
            placeholder="https://..."
            className="h-11 rounded-2xl px-3"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Opcional. Usa una imagen publica con la que quieras presentarte.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="city" className="text-sm font-medium text-foreground">
              Ubicacion habitual
            </label>
            <Input
              id="city"
              name="city"
              defaultValue={initialValues.city ?? ""}
              placeholder="Getafe, Chamberi, Leganes centro..."
              className="h-11 rounded-2xl px-3"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="preferredLeagueId"
              className="text-sm font-medium text-foreground"
            >
              Zona preferida
            </label>
            <Select
              id="preferredLeagueId"
              name="preferredLeagueId"
              defaultValue={initialValues.preferredLeagueId ?? ""}
              required
            >
              <option value="" disabled>
                Elige tu zona
              </option>
              {leagueOptions.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.pathLabel}
                </option>
              ))}
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              Elige la zona amplia donde mas juegas y quieres recibir actividad.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-foreground">
            Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={initialValues.bio ?? ""}
            placeholder="Cuenta tu estilo de juego, cuando sueles poder quedar o que tipo de mesa te gusta."
          />
        </div>

        <SubmitButton
          pendingLabel={mode === "onboarding" ? "Guardando perfil..." : "Actualizando perfil..."}
          className="h-11 w-full rounded-2xl"
        >
          {mode === "onboarding" ? "Guardar y entrar" : "Guardar cambios"}
        </SubmitButton>
      </form>

      {mode === "profile" ? (
        <form action={signOutAction}>
          <SubmitButton
            pendingLabel="Cerrando sesion..."
            variant="outline"
            className="h-11 w-full rounded-2xl border border-border bg-background text-foreground hover:bg-secondary"
          >
            Cerrar sesion
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
