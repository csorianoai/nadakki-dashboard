import { MasterPlanClient } from "./MasterPlanClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function MasterPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MasterPlanClient proyectoId={requireProyectoRouteId(id)} />;
}
