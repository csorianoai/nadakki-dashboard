import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { RiesgosClient } from "./RiesgosClient";

export default async function RiesgosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProyectosTenantGate>
      <RiesgosClient proyectoId={decodeURIComponent(id)} />
    </ProyectosTenantGate>
  );
}
