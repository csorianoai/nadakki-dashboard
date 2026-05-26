import { EscenariosClient } from "./EscenariosClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function EscenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EscenariosClient proyectoId={requireProyectoRouteId(id)} />;
}
