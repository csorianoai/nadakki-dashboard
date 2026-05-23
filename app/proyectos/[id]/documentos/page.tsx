import { DocumentosClient } from "./DocumentosClient";

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentosClient proyectoId={decodeURIComponent(id)} />;
}
