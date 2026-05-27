import { DealsClient } from "@/components/proyectos/finanzas/DealsClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function DealsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealsClient proyectoId={requireProyectoRouteId(id)} />;
}
