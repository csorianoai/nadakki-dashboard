import { OrdenesCompraClient } from "@/components/proyectos/finanzas/OrdenesCompraClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function OrdenesCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrdenesCompraClient proyectoId={requireProyectoRouteId(id)} />;
}
