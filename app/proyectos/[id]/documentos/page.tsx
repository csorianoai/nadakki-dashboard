import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { DocumentosClient } from "./DocumentosClient";

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProyectosTenantGate>
      <DocumentosClient proyectoId={decodeURIComponent(id)} />
    </ProyectosTenantGate>
  );
}
