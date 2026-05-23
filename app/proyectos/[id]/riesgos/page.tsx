import { RiesgosClient } from "./RiesgosClient";

export default async function RiesgosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RiesgosClient proyectoId={decodeURIComponent(id)} />;
}
