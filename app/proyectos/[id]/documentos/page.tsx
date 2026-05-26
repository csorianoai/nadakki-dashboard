import { DocumentosClient } from "./DocumentosClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentosClient proyectoId={requireProyectoRouteId(id)} />;
}
