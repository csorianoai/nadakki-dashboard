"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/forge";
import { listFacturas } from "@/app/hooks/useProyectos";
import { FacturaCreateModal } from "@/components/proyectos/finanzas/FacturaCreateModal";
import { FacturaDetailDrawer } from "@/components/proyectos/finanzas/FacturaDetailDrawer";
import { FacturasTable } from "@/components/proyectos/finanzas/FacturasTable";
import { FilterBar } from "@/components/proyectos/finanzas/FilterBar";
import { FinanzasEmptyState } from "@/components/proyectos/finanzas/EmptyState";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { approveFactura, rejectFactura } from "@/app/hooks/useProyectos";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { Factura } from "@/types/finanzas";

const STATUS_OPTS = [
  { value: "needs_pm_review", label: "Revisión PM" },
  { value: "approved", label: "Aprobada" },
  { value: "rejected", label: "Rechazada" },
  { value: "received", label: "Recibida" },
];

export function FacturasClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [rows, setRows] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Factura | null>(null);
  const [action, setAction] = useState<{ mode: "approve" | "reject"; factura: Factura } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listFacturas(tenantId, proyectoId, {
        search,
        status: statuses.length ? statuses : undefined,
        sort_by: "fecha_emision",
        sort_dir: "desc",
      });
      setRows(res.items);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId, search, statuses]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = (s: string) =>
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const runAction = async (justification: string) => {
    if (!tenantId || !action) return;
    setActionLoading(true);
    try {
      if (action.mode === "approve") {
        await approveFactura(tenantId, action.factura.id, { justification });
        toast.success("Factura aprobada");
      } else {
        await rejectFactura(tenantId, action.factura.id, { justification });
        toast.error("Factura rechazada");
      }
      setAction(null);
      void load();
    } catch (e) {
      toast.error("Error", { description: e instanceof Error ? e.message : "" });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCount = useMemo(() => rows.length, [rows]);

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Facturas"
      description="Registro, validación automática y aprobación PM de facturas de contratistas."
      icon={<Receipt className="h-10 w-10" aria-hidden />}
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)} disabled={!tenantId}>
          + Nueva factura
        </Button>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        statusOptions={STATUS_OPTS}
        selectedStatuses={statuses}
        onToggleStatus={toggleStatus}
      />

      {loading ? (
        <FinanzasLoadingState />
      ) : filteredCount === 0 ? (
        <FinanzasEmptyState
          title="Aún no hay facturas"
          description="Registra la primera factura vinculada a una orden de compra."
          actionLabel="+ Crear primera factura"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <FacturasTable
          rows={rows}
          onView={setSelected}
          onApprove={(f) => setAction({ mode: "approve", factura: f })}
          onReject={(f) => setAction({ mode: "reject", factura: f })}
        />
      )}

      {tenantId ? (
        <FacturaCreateModal
          open={createOpen}
          tenantId={tenantId}
          projectId={proyectoId}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            toast.success("Factura creada — validador ejecutado");
            void load();
          }}
        />
      ) : null}

      <FacturaDetailDrawer
        factura={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUpdated={() => void load()}
      />

      <JustificationModal
        open={!!action}
        title={action?.mode === "approve" ? "Aprobar factura" : "Rechazar factura"}
        confirmLabel={action?.mode === "approve" ? "Aprobar" : "Rechazar"}
        variant={action?.mode === "reject" ? "danger" : "primary"}
        loading={actionLoading}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      />
    </FinanzasPageShell>
  );
}
