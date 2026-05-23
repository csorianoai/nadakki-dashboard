"use client";

import Link from "next/link";
import { Activity, FolderKanban, Plug } from "lucide-react";
import { Badge, Button, Card, DataTable, KpiCard } from "@/components/forge";
import { useProyectoHealth, useProyectos } from "@/hooks/projects/useProyectos";
import { ProjectsApiError } from "@/lib/projects/projectsClient";
import type { Proyecto } from "@/lib/projects/types";

function displayName(row: Proyecto): string {
  return row.name ?? row.title ?? "—";
}

export default function ProyectosDashboardPage() {
  const { data: proyectos, isPending, isError, error } = useProyectos();
  const health = useProyectoHealth();

  const rows = proyectos ?? [];
  const activeCount = rows.filter((p) =>
    typeof p.state === "string" ? p.state === "ACTIVE" : false,
  ).length;

  let errorDetail: string | undefined;
  if (isError && error instanceof ProjectsApiError) {
    errorDetail = error.message;
  }

  const healthLabel =
    health.data === undefined
      ? health.isPending
        ? "…"
        : health.isError
          ? "Sin respuesta"
          : "—"
      : "OK";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-forge-xs font-semibold uppercase tracking-wider text-forgeBrand-600">
            Projects Core
          </p>
          <h1 className="font-display text-forge-2xl font-semibold tracking-tight text-forgeGray-900">
            Proyectos
          </h1>
          <p className="mt-2 max-w-2xl text-forge-sm text-forgeGray-600">
            Panel inicial: cartera en tabla y KPIs locales. Las llamadas van a `/api/v1/proyectos` con rewrites hacia backend
            cuando esté disponible.
          </p>
        </div>
        <Link href="/proyectos/new">
          <Button variant="primary" type="button" className="min-h-11">
            Nuevo proyecto
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Proyectos listados"
          value={isPending ? "…" : String(rows.length)}
          icon={FolderKanban}
          hint="Desde React Query (`useProyectos`)"
        />
        <KpiCard
          label="En estado ACTIVE"
          value={isPending ? "…" : String(activeCount)}
          icon={Activity}
          hint="Conteo en cliente (placeholder)"
        />
        <KpiCard
          label="Salud `/health`"
          value={healthLabel}
          icon={Plug}
          hint="GET `/api/v1/proyectos/health`"
        />
      </div>

      {isError ? (
        <Card variant="outlined" className="border-forgeDanger-200 bg-forgeDanger-50/80">
          <p className="text-forge-sm font-medium text-forgeGray-900">No se pudo cargar el listado</p>
          <p className="mt-1 text-forge-xs text-forgeGray-600">
            {errorDetail ??
              "Comprueba sesión / tenant u omite hasta que backend responda (scaffold paralelo)."}
          </p>
        </Card>
      ) : null}

      <Card className="p-4 md:p-5">
        <h2 className="font-display text-forge-md font-semibold text-forgeGray-900">Cartera</h2>
        <p className="mb-4 text-forge-xs text-forgeGray-500">Columnas stub — alinear al contrato OpenAPI.</p>

        <DataTable<Proyecto>
          columns={[
            {
              id: "id",
              header: "ID",
              cell: (row) => (
                <span className="font-forgeMono text-forgeGray-700">{row.id || "—"}</span>
              ),
            },
            {
              id: "name",
              header: "Nombre",
              cell: (row) => <span className="text-forgeGray-900">{displayName(row)}</span>,
            },
            {
              id: "state",
              header: "Estado",
              cell: (row) =>
                row.state ? (
                  <Badge variant="neutral" className="font-forgeMono text-[10px]">
                    {row.state}
                  </Badge>
                ) : (
                  <span className="text-forgeGray-400">—</span>
                ),
            },
            {
              id: "updated",
              header: "Actualizado",
              cell: (row) => (
                <span className="text-forgeGray-600">{row.updated_at ?? row.created_at ?? "—"}</span>
              ),
            },
          ]}
          rows={rows}
          getRowId={(row) => row.id || displayName(row)}
          loading={isPending}
          skeletonRowCount={6}
          emptyLabel="Sin proyectos"
          emptyDescription="Lista vacía o backend aún no expone colección para este tenant."
        />
      </Card>
    </div>
  );
}
