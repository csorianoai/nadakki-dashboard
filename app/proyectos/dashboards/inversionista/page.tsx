import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { DashboardInvestorClient } from "./DashboardInvestorClient";

export default function DashboardInvestorPage() {
  return (
    <ProyectosTenantGate>
      <DashboardInvestorClient />
    </ProyectosTenantGate>
  );
}
