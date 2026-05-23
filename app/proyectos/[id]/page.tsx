"use client";

import { use } from "react";
import { Button, Card, Skeleton } from "@/components/forge";
import { ProyectoCommandCenterView } from "@/components/proyectos/ProyectoCommandCenterView";
import { ProyectosWorkspaceNav } from "@/components/proyectos/ProyectosWorkspaceNav";
import { useProyecto } from "@/hooks/projects/useProyectos";
import { ProjectsApiError } from "@/lib/projects/projectsClient";

export default function ProyectoCommandCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useProyecto(decodeURIComponent(id));

  if (query.isPending) {
    return <Skeleton className="min-h-[28rem] w-full rounded-forge-lg" />;
  }

  if (query.isError || !query.data) {
    const detail = query.error instanceof ProjectsApiError ? query.error.message : undefined;
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <p className="text-forge-sm font-medium text-forgeDanger-700">No se pudo cargar este proyecto.</p>
        {detail ? <p className="mt-2 text-forge-xs text-forgeGray-600">{detail}</p> : null}
        <Button type="button" variant="secondary" className="mt-6 min-h-11" onClick={() => void query.refetch()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <>
      <ProyectosWorkspaceNav proyectoId={query.data.id} />
      <ProyectoCommandCenterView proyecto={query.data} />
    </>
  );
}
