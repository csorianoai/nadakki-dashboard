import { FinanceOverviewClient } from "@/components/proyectos/finanzas/FinanceOverviewClient";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function FinanzasOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinanceOverviewClient proyectoId={requireProyectoRouteId(id)} />;
}
