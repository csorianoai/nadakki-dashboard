"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/forge";
import {
  cancelOrdenCompra,
  closeOrdenCompra,
  createOrdenCompra,
  issueOrdenCompra,
  listOrdenesCompra,
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
import type { OrdenCompra } from "@/types/finanzas";
import { Drawer } from "@/components/forge";

export function OrdenesCompraClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [rows, setRows] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<OrdenCompra | null>(null);
  const [confirm, setConfirm] = useState<{ mode: "issue" | "cancel" | "close"; row: OrdenCompra } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [form, setForm] = useState({ contratista: "", monto: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listOrdenesCompra(tenantId, proyectoId, { search, sort_by: "fecha_emision", sort_dir: "desc" });
      setRows(res.items);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!tenantId) return;
    await createOrdenCompra(tenantId, proyectoId, {
      tenant_id: tenantId,
      project_id: proyectoId,
      contratista_id: crypto.randomUUID(),
      contratista_nombre: form.contratista || "Contratista",
      monto_total_usd: Number(form.monto) || 0,
      currency: "USD",
      fecha_emision: new Date().toISOString().slice(0, 10),
      line_items: [],
    });
    toast.success("OC creada (draft)");
    setCreateOpen(false);
    void load();
  };

  const { overlay, handleClose } = useModalBackdrop(createOpen, () => setCreateOpen(false));

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Órdenes de compra"
      description="Emisión, cancelación y cierre de órdenes de compra."
      icon={<ShoppingCart className="h-10 w-10" aria-hidden />}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Nueva OC</Button>}
    >
      <FilterBar search={search} onSearchChange={setSearch} />
      {loading ? (
        <FinanzasLoadingState />
      ) : !rows.length ? (
        <FinanzasEmptyState title="Sin órdenes de compra" description="Crea una OC manualmente o conviértela desde cotización." actionLabel="+ Nueva OC" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Número OC</th>
                <th className="px-4 py-3">Contratista</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{r.numero_oc}</td>
                  <td className="px-4 py-3">{r.contratista_nombre}</td>
                  <td className="px-4 py-3"><AmountDisplay amount={r.monto_total_usd} /></td>
                  <td className="px-4 py-3"><FinanzasStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>Ver</Button>
                      {r.status === "draft" ? <Button size="sm" onClick={() => setConfirm({ mode: "issue", row: r })}>Emitir OC</Button> : null}
                      {r.status === "issued" ? (
                        <>
                          <Button size="sm" variant="danger" onClick={() => setConfirm({ mode: "cancel", row: r })}>Cancelar</Button>
                          <Button size="sm" variant="secondary" onClick={() => setConfirm({ mode: "close", row: r })}>Cerrar</Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overlay}
      <Modal open={createOpen} onClose={handleClose} closeOnBackdropClick={false} className="!z-50 backdrop:bg-transparent" title="Nueva OC"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={handleClose}>Cancelar</Button><Button onClick={() => void create()}>Guardar</Button></div>}>
        <div className="space-y-3">
          <Input label="Contratista" value={form.contratista} onChange={(e) => setForm((f) => ({ ...f, contratista: e.target.value }))} />
          <Input label="Monto USD" type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
        </div>
      </Modal>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.numero_oc ?? ""} description={detail?.contratista_nombre}>
        {detail ? (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-zinc-500">Monto</dt><dd><AmountDisplay amount={detail.monto_total_usd} /></dd></div>
            <div><dt className="text-zinc-500">Estado</dt><dd><FinanzasStatusBadge status={detail.status} /></dd></div>
            <div><dt className="text-zinc-500">Fecha emisión</dt><dd>{detail.fecha_emision}</dd></div>
          </dl>
        ) : null}
      </Drawer>

      <JustificationModal
        open={!!confirm && confirm.mode !== "issue"}
        title={confirm?.mode === "cancel" ? "Cancelar OC" : "Cerrar OC"}
        confirmLabel="Confirmar"
        variant="danger"
        loading={confirmLoading}
        onClose={() => setConfirm(null)}
        onConfirm={async (j) => {
          if (!tenantId || !confirm) return;
          setConfirmLoading(true);
          try {
            if (confirm.mode === "cancel") await cancelOrdenCompra(tenantId, confirm.row.id, { justification: j });
            else await closeOrdenCompra(tenantId, confirm.row.id, { justification: j });
            toast.success("OC actualizada");
            setConfirm(null);
            void load();
          } finally {
            setConfirmLoading(false);
          }
        }}
      />

      <Modal
        open={!!confirm && confirm.mode === "issue"}
        onClose={() => setConfirm(null)}
        title="Emitir orden de compra"
        description={`¿Emitir ${confirm?.row.numero_oc}? Se registrará evento PO_ISSUED.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!tenantId || !confirm) return;
                await issueOrdenCompra(tenantId, confirm.row.id, {});
                toast.success("OC emitida");
                setConfirm(null);
                void load();
              }}
            >
              Emitir
            </Button>
          </div>
        }
      >
        <p className="text-sm text-zinc-400">Esta acción cambia el estado a <strong className="text-emerald-300">issued</strong>.</p>
      </Modal>
    </FinanzasPageShell>
  );
}
