import { AccountPanel } from "@/components/auth/account-panel";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectAuthenticatedUsers } from "@/lib/auth/session";

export default async function RegisterPage() {
  await redirectAuthenticatedUsers();

  return (
    <AccountPanel
      title="Crea tu cuenta de Mus League"
      description="Prepara tu perfil, entra en tu zona y empieza a jugar mesas que cuenten de verdad."
    >
      <RegisterForm />
    </AccountPanel>
  );
}
