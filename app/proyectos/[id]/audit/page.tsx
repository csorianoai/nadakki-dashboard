import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { AuditProjectClient } from "./AuditProjectClient";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProyectosTenantGate>
      <AuditProjectClient proyectoId={decodeURIComponent(id)} />
    </ProyectosTenantGate>
  );
}
