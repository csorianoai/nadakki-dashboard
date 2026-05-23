import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { MasterPlanClient } from "./MasterPlanClient";

export default async function MasterPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProyectosTenantGate>
      <MasterPlanClient proyectoId={decodeURIComponent(id)} />
    </ProyectosTenantGate>
  );
}
