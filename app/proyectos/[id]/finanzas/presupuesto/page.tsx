import { PresupuestoClient } from "@/components/proyectos/finanzas/PresupuestoClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function PresupuestoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PresupuestoClient proyectoId={requireProyectoRouteId(id)} />;
}
