import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { PortafolioClient } from "./PortafolioClient";

export default function PortafolioPage() {
  return (
    <ProyectosTenantGate>
      <PortafolioClient />
    </ProyectosTenantGate>
  );
}
