import { CredentialVaultView } from "@/components/activation/CredentialVaultView";

export const metadata = {
  title: "Credenciales - Nadakki",
  description: "Gestión de credenciales de integraciones",
};

export default function CredencialesPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <CredentialVaultView />
    </div>
  );
}
