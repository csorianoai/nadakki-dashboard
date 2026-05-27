"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal, Select } from "@/components/forge";
import {
  confirmPago,
  createPago,
  listFacturas,
  listPagos,
  reversePago,
} from "@/app/hooks/useProyectos";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { FilterBar } from "@/components/proyectos/finanzas/FilterBar";
import { FinanzasEmptyState } from "@/components/proyectos/finanzas/EmptyState";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { FinanzasStatusBadge } from "@/components/proyectos/finanzas/StatusBadge";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { useModalBackdrop } from "@/components/proyectos/useModalBackdrop";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { Factura, Pago } from "@/types/finanzas";

export function PagosClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [rows, setRows] = useState<Pago[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Pago | null>(null);
  const [reverseTarget, setReverseTarget] = useState<Pago | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [form, setForm] = useState({ factura_id: "", monto: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [pagos, facs] = await Promise.all([
        listPagos(tenantId, proyectoId, { search, sort_by: "created_at", sort_dir: "desc" }),
        listFacturas(tenantId, proyectoId, { status: ["approved"] }),
      ]);
      setRows(pagos.items);
      setFacturas(facs.items);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedFactura = facturas.find((f) => f.id === form.factura_id);
  const maxMonto = selectedFactura?.saldo_pendiente_usd ?? 0;

  const create = async () => {
    if (!tenantId) return;
    const monto = Number(form.monto) || 0;
    if (monto > maxMonto) {
      toast.error("Sobrepago", { description: `El monto máximo es ${maxMonto.toLocaleString("es-DO")} USD` });
      return;
    }
    try {
      await createPago(tenantId, proyectoId, {
        tenant_id: tenantId,
        project_id: proyectoId,
        factura_id: form.factura_id,
        monto_usd: monto,
        currency: "USD",
        metodo_pago: "transferencia",
      });
      toast.success("Pago registrado (pending)");
      setCreateOpen(false);
      void load();
    } catch (e) {
      toast.error("Error al crear pago", { description: e instanceof Error ? e.message : "" });
    }
  };

  const { overlay, handleClose } = useModalBackdrop(createOpen, () => setCreateOpen(false));

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Pagos"
      description="Registro, confirmación y reversión de pagos contra facturas aprobadas."
      icon={<HandCoins className="h-10 w-10" aria-hidden />}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Nuevo pago</Button>}
    >
      <FilterBar search={search} onSearchChange={setSearch} />
      {loading ? (
        <FinanzasLoadingState />
      ) : !rows.length ? (
        <FinanzasEmptyState title="Sin pagos" description="Registra pagos contra facturas aprobadas." actionLabel="+ Nuevo pago" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{r.numero_pago}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.factura_id.slice(0, 8)}…</td>
                  <td className="px-4 py-3"><AmountDisplay amount={r.monto_usd} /></td>
                  <td className="px-4 py-3"><FinanzasStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status === "pending" ? <Button size="sm" onClick={() => setConfirmTarget(r)}>Confirmar</Button> : null}
                      {r.status === "paid" ? <Button size="sm" variant="danger" onClick={() => setReverseTarget(r)}>Revertir</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overlay}
      <Modal open={createOpen} onClose={handleClose} closeOnBackdropClick={false} className="!z-50 backdrop:bg-transparent" title="Nuevo pago"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={handleClose}>Cancelar</Button><Button onClick={() => void create()} disabled={!form.factura_id}>Guardar</Button></div>}>
        <div className="space-y-3">
          <Select
            label="Factura aprobada"
            value={form.factura_id}
            onChange={(e) => setForm((f) => ({ ...f, factura_id: e.target.value }))}
            options={[{ value: "", label: "Seleccionar…" }, ...facturas.map((f) => ({ value: f.id, label: `${f.numero_factura} — saldo ${f.saldo_pendiente_usd}` }))]}
          />
          <Input label={`Monto USD (máx ${maxMonto})`} type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
        </div>
      </Modal>

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Confirmar pago"
        description={`Confirmar ${confirmTarget?.numero_pago} por ${confirmTarget?.monto_usd} USD`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!tenantId || !confirmTarget) return;
                try {
                  await confirmPago(tenantId, confirmTarget.id, { actor_id: "dashboard-user" });
                  toast.success("Pago confirmado");
                  setConfirmTarget(null);
                  void load();
                } catch (e) {
                  toast.error("Error al confirmar", { description: e instanceof Error ? e.message : "" });
                }
              }}
            >
              Confirmar pago
            </Button>
          </div>
        }
      >
        <p className="text-sm text-zinc-400">Se emitirá evento PAYMENT_CONFIRMED.</p>
      </Modal>

      <JustificationModal
        open={!!reverseTarget}
        title="Revertir pago"
        description="Motivo obligatorio (mín. 10 caracteres)."
        confirmLabel="Revertir"
        variant="danger"
        loading={reverseLoading}
        onClose={() => setReverseTarget(null)}
        onConfirm={async (reason) => {
          if (!tenantId || !reverseTarget) return;
          setReverseLoading(true);
          try {
            await reversePago(tenantId, reverseTarget.id, { reason });
            toast.warning("Pago revertido");
            setReverseTarget(null);
            void load();
          } catch (e) {
            toast.error("Error", { description: e instanceof Error ? e.message : "" });
          } finally {
            setReverseLoading(false);
          }
        }}
      />
    </FinanzasPageShell>
  );
}
