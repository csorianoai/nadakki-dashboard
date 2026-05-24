import { AnalisisClient } from "./AnalisisClient";

export default async function AnalisisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalisisClient proyectoId={decodeURIComponent(id)} />;
}
