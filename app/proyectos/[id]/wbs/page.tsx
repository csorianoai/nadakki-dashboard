import { WbsClient } from "./WbsClient";

export default async function WbsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WbsClient proyectoId={decodeURIComponent(id)} />;
}
