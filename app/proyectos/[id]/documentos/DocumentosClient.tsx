"use client";

import { ProyectosDocumentosPanel } from "@/components/proyectos/documentos/ProyectosDocumentosPanel";

export function DocumentosClient({ proyectoId }: { proyectoId: string }) {
  return <ProyectosDocumentosPanel proyectoId={proyectoId} />;
}
