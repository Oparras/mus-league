import { AccountPanel } from "@/components/auth/account-panel";
import { LoginForm } from "@/components/auth/login-form";
import { redirectAuthenticatedUsers } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = resolvedSearchParams.redirectTo ?? null;

  await redirectAuthenticatedUsers(redirectTo);

  return (
    <AccountPanel
      title="Vuelve a tu mesa"
      description="Entra para seguir tus retos, cerrar resultados pendientes y defender tu ELO."
    >
      <LoginForm redirectTo={redirectTo} />
    </AccountPanel>
  );
}
