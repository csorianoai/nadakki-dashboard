import { CotizacionesClient } from "@/components/proyectos/finanzas/CotizacionesClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function CotizacionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CotizacionesClient proyectoId={requireProyectoRouteId(id)} />;
}
