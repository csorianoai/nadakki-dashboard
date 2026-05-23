import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { DashboardCeoClient } from "./DashboardCeoClient";

export default function DashboardCeoPage() {
  return (
    <ProyectosTenantGate>
      <DashboardCeoClient />
    </ProyectosTenantGate>
  );
}
