"use client";

import Link from "next/link";

import { loginAction } from "@/lib/auth/actions";
import { QueryMessage } from "@/components/auth/query-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";

export function LoginForm({
  redirectTo,
}: {
  redirectTo?: string | null;
}) {
  return (
    <form action={loginAction} className="space-y-5">
      <QueryMessage />
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

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

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Contrasena
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Tu contrasena"
          className="h-11 rounded-2xl px-3"
          required
        />
      </div>

      <SubmitButton pendingLabel="Entrando..." className="h-11 w-full rounded-2xl">
        Iniciar sesion
      </SubmitButton>

      <p className="text-sm leading-6 text-muted-foreground">
        Si todavia no juegas en Mus League,{" "}
        <Link
          href={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          crea tu cuenta
        </Link>
        .
      </p>
    </form>
  );
}
