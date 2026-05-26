import { AuditProjectClient } from "./AuditProjectClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditProjectClient proyectoId={requireProyectoRouteId(id)} />;
}
