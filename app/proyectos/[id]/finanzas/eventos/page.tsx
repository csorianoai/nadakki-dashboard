import { EventosClient } from "@/components/proyectos/finanzas/EventosClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function EventosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventosClient proyectoId={requireProyectoRouteId(id)} />;
}
