import { ComiteInversionPanel } from "@/components/proyectos/ComiteInversionPanel";

export default async function ComitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComiteInversionPanel proyectoId={decodeURIComponent(id)} />;
}
