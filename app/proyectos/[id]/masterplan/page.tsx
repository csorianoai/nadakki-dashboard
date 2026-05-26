import { MasterPlanPanel } from "@/components/proyectos/MasterPlanPanel";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function MasterPlanComitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MasterPlanPanel proyectoId={requireProyectoRouteId(id)} />;
}
