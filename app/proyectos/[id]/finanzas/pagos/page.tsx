import { PagosClient } from "@/components/proyectos/finanzas/PagosClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function PagosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PagosClient proyectoId={requireProyectoRouteId(id)} />;
}
