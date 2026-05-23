import { AuditProjectClient } from "./AuditProjectClient";

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AuditProjectClient proyectoId={decodeURIComponent(id)} />;
}
