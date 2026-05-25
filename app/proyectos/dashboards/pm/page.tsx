import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { DashboardPmClient } from "./DashboardPmClient";

export default function DashboardPmPage() {
  return (
    <ProyectosTenantGate>
      <DashboardPmClient />
    </ProyectosTenantGate>
  );
}
