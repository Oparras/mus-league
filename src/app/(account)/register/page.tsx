import { AccountPanel } from "@/components/auth/account-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectAuthenticatedUsers } from "@/lib/auth/session";

export default async function RegisterPage({
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
      title="Crea tu cuenta de Mus League"
      description="Prepara tu perfil, entra en tu zona y empieza a jugar mesas que cuenten de verdad."
    >
      <RegisterForm redirectTo={redirectTo} />
    </AccountPanel>
  );
}
