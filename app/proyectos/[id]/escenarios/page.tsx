import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { EscenariosClient } from "./EscenariosClient";

export default async function EscenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProyectosTenantGate>
      <EscenariosClient proyectoId={decodeURIComponent(id)} />
    </ProyectosTenantGate>
  );
}
