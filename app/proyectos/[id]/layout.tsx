import type { ReactNode } from "react";
import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { ProyectosWorkspaceNav } from "@/components/proyectos/ProyectosWorkspaceNav";

/**
 * Tabs for Detalle, WBS, Riesgos, etc. apply to every route under `/proyectos/[id]/*`.
 */
export default async function ProyectoIdLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proyectoId = decodeURIComponent(id);

  return (
    <ProyectosTenantGate>
      <div className="mx-auto max-w-7xl">
        <ProyectosWorkspaceNav proyectoId={proyectoId} />
        {children}
      </div>
    </ProyectosTenantGate>
  );
}
