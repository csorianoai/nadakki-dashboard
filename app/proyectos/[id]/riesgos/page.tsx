import { RiesgosClient } from "./RiesgosClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function RiesgosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RiesgosClient proyectoId={requireProyectoRouteId(id)} />;
}
