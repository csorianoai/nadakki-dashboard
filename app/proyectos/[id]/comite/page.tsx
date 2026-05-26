import { ComiteInversionPanel } from "@/components/proyectos/ComiteInversionPanel";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function ComitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComiteInversionPanel proyectoId={requireProyectoRouteId(id)} />;
}
