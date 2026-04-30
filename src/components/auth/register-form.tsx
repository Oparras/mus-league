"use client";

import Link from "next/link";

import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/lib/auth/actions";

export function RegisterForm({
  redirectTo,
}: {
  redirectTo?: string | null;
}) {
  return (
    <form action={registerAction} className="space-y-5">
      <QueryMessage />
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

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
          autoComplete="nickname"
          placeholder="Como quieres aparecer en la mesa"
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
          name="email"
          type="email"
          autoComplete="email"
          placeholder="player@musleague.com"
          className="h-11 rounded-2xl px-3"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Contrasena
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimo 8 caracteres"
            className="h-11 rounded-2xl px-3"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Repite la contrasena
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Vuelve a escribirla"
            className="h-11 rounded-2xl px-3"
            required
          />
        </div>
      </div>

      <SubmitButton pendingLabel="Creando cuenta..." className="h-11 w-full rounded-2xl">
        Crear cuenta
      </SubmitButton>

      <p className="text-sm leading-6 text-muted-foreground">
        Si ya tienes mesa abierta,{" "}
        <Link
          href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          inicia sesion
        </Link>
        .
      </p>
    </form>
  );
}
