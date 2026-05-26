import { WbsClient } from "./WbsClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function WbsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WbsClient proyectoId={requireProyectoRouteId(id)} />;
}
