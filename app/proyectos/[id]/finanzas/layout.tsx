import type { ReactNode } from "react";
import { FinanzasSubNav } from "@/components/proyectos/finanzas/FinanzasSubNav";
import { requireProyectoRouteId } from "@/lib/projects/requireProyectoRouteId";

export default async function FinanzasLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyectoId = requireProyectoRouteId(id);

  return (
    <div>
      <FinanzasSubNav proyectoId={proyectoId} />
      {children}
    </div>
  );
}
