import { FacturasClient } from "@/components/proyectos/finanzas/FacturasClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function FacturasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FacturasClient proyectoId={requireProyectoRouteId(id)} />;
}
