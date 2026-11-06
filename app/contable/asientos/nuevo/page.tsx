import { AsientoCapabilityGate } from "@/components/contable/AsientoCapabilityGate";
import { CrearAsientoClient } from "@/components/contable/CrearAsientoClient";

export default function CrearAsientoPage() {
  return (
    <AsientoCapabilityGate>
      <CrearAsientoClient />
    </AsientoCapabilityGate>
  );
}
