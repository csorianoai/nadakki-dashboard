import { EscenariosClient } from "./EscenariosClient";

export default async function EscenariosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EscenariosClient proyectoId={decodeURIComponent(id)} />;
}
