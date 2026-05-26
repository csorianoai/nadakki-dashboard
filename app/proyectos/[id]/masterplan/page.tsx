import { MasterPlanPanel } from "@/components/proyectos/MasterPlanPanel";

export default async function MasterPlanComitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MasterPlanPanel proyectoId={decodeURIComponent(id)} />;
}
