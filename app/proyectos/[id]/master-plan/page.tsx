import { MasterPlanClient } from "./MasterPlanClient";

export default async function MasterPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MasterPlanClient proyectoId={decodeURIComponent(id)} />;
}
