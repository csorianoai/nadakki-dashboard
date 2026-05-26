import { AnalisisClient } from "./AnalisisClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function AnalisisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalisisClient proyectoId={requireProyectoRouteId(id)} />;
}
