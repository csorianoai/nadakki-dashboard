"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal } from "@/components/forge";
import { closeDeal, createDeal, listDeals } from "@/app/hooks/useProyectos";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { FilterBar } from "@/components/proyectos/finanzas/FilterBar";
import { FinanzasEmptyState } from "@/components/proyectos/finanzas/EmptyState";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { FinanzasStatusBadge } from "@/components/proyectos/finanzas/StatusBadge";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { useModalBackdrop } from "@/components/proyectos/useModalBackdrop";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { Deal } from "@/types/finanzas";
import { Drawer } from "@/components/forge";

export function DealsClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [rows, setRows] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Deal | null>(null);
  const [closeTarget, setCloseTarget] = useState<Deal | null>(null);
  const [closeLoading, setCloseLoading] = useState(false);
  const [form, setForm] = useState({ titulo: "", contraparte: "", monto: "" });

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listDeals(tenantId, proyectoId, { search });
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
    await createDeal(tenantId, proyectoId, {
      tenant_id: tenantId,
      project_id: proyectoId,
      titulo: form.titulo || "Nuevo deal",
      contraparte: form.contraparte || "Contraparte",
      monto_usd: Number(form.monto) || 0,
      currency: "USD",
      fecha_inicio: new Date().toISOString().slice(0, 10),
    });
    toast.success("Deal creado");
    setCreateOpen(false);
    void load();
  };

  const { overlay, handleClose } = useModalBackdrop(createOpen, () => setCreateOpen(false));

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Deals"
      description="Acuerdos comerciales y joint ventures del proyecto."
      icon={<Briefcase className="h-10 w-10" aria-hidden />}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Nuevo deal</Button>}
    >
      <FilterBar search={search} onSearchChange={setSearch} />
      {loading ? (
        <FinanzasLoadingState />
      ) : !rows.length ? (
        <FinanzasEmptyState title="Sin deals" description="Registra acuerdos comerciales del proyecto." actionLabel="+ Nuevo deal" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Contraparte</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{r.titulo}</td>
                  <td className="px-4 py-3">{r.contraparte}</td>
                  <td className="px-4 py-3"><AmountDisplay amount={r.monto_usd} /></td>
                  <td className="px-4 py-3"><FinanzasStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>Ver</Button>
                      {r.status === "open" ? <Button size="sm" variant="secondary" onClick={() => setCloseTarget(r)}>Cerrar deal</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overlay}
      <Modal open={createOpen} onClose={handleClose} closeOnBackdropClick={false} className="!z-50 backdrop:bg-transparent" title="Nuevo deal"
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={handleClose}>Cancelar</Button><Button onClick={() => void create()}>Guardar</Button></div>}>
        <div className="space-y-3">
          <Input label="Título" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
          <Input label="Contraparte" value={form.contraparte} onChange={(e) => setForm((f) => ({ ...f, contraparte: e.target.value }))} />
          <Input label="Monto USD" type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
        </div>
      </Modal>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.titulo ?? ""} description={detail?.contraparte}>
        {detail ? (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-zinc-500">Monto</dt><dd><AmountDisplay amount={detail.monto_usd} /></dd></div>
            <div><dt className="text-zinc-500">Estado</dt><dd><FinanzasStatusBadge status={detail.status} /></dd></div>
            <div><dt className="text-zinc-500">Inicio</dt><dd>{detail.fecha_inicio}</dd></div>
          </dl>
        ) : null}
      </Drawer>

      <JustificationModal
        open={!!closeTarget}
        title="Cerrar deal"
        confirmLabel="Cerrar deal"
        loading={closeLoading}
        onClose={() => setCloseTarget(null)}
        onConfirm={async (j) => {
          if (!tenantId || !closeTarget) return;
          setCloseLoading(true);
          try {
            await closeDeal(tenantId, closeTarget.id, { justification: j });
            toast.success("Deal cerrado");
            setCloseTarget(null);
            void load();
          } finally {
            setCloseLoading(false);
          }
        }}
      />
    </FinanzasPageShell>
  );
}
