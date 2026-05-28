"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Modal, Select } from "@/components/forge";
import {
  approveCotizacion,
  convertCotizacionToPO,
  createContratista,
  createCotizacion,
  FinanzasApiError,
  listContratistas,
  listCotizaciones,
  rejectCotizacion,
} from "@/app/hooks/useProyectos";
import type { Contratista } from "@/app/hooks/useProyectos";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { FilterBar } from "@/components/proyectos/finanzas/FilterBar";
import { FinanzasEmptyState } from "@/components/proyectos/finanzas/EmptyState";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { FinanzasStatusBadge } from "@/components/proyectos/finanzas/StatusBadge";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { useModalBackdrop } from "@/components/proyectos/useModalBackdrop";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { Cotizacion } from "@/types/finanzas";
import { Drawer } from "@/components/forge";

export function CotizacionesClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [rows, setRows] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Cotizacion[]>([]);
  const [detail, setDetail] = useState<Cotizacion | null>(null);
  const [convertTarget, setConvertTarget] = useState<Cotizacion | null>(null);
  const [action, setAction] = useState<{ mode: "approve" | "reject"; row: Cotizacion } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [form, setForm] = useState({ numero: "", contratista_id: "", categoria: "", monto: "" });
  const [newContratista, setNewContratista] = useState({ razon_social: "", tax_id: "" });
  const [creatingContratista, setCreatingContratista] = useState(false);
  const [showContratistaForm, setShowContratistaForm] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listCotizaciones(tenantId, proyectoId, {
        search,
        sort_by: "fecha_emision",
        sort_dir: "desc",
      });
      setRows(res.items);
      try {
        const ctrs = await listContratistas(tenantId);
        setContratistas(ctrs);
      } catch {
        setContratistas([]);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!createOpen) {
      setShowContratistaForm(false);
      setNewContratista({ razon_social: "", tax_id: "" });
    }
  }, [createOpen]);

  const selectedContratista = contratistas.find((c) => c.id === form.contratista_id);

  const registerContratista = async () => {
    if (!tenantId) return;
    if (!newContratista.razon_social.trim() || !newContratista.tax_id.trim()) {
      toast.error("Razón social y RNC/tax ID son obligatorios");
      return;
    }
    setCreatingContratista(true);
    try {
      const created = await createContratista(tenantId, {
        razon_social: newContratista.razon_social.trim(),
        tax_id: newContratista.tax_id.trim(),
        pais_origen: "DO",
      });
      setContratistas((prev) => [...prev, created]);
      setForm((f) => ({ ...f, contratista_id: created.id }));
      setNewContratista({ razon_social: "", tax_id: "" });
      setShowContratistaForm(false);
      toast.success("Contratista registrado");
    } catch (e) {
      toast.error("No se pudo registrar el contratista", {
        description: e instanceof FinanzasApiError ? e.message : e instanceof Error ? e.message : "",
      });
    } finally {
      setCreatingContratista(false);
    }
  };

  const create = async () => {
    if (!tenantId) return;
    if (!form.contratista_id) {
      toast.error("Selecciona un contratista");
      return;
    }
    try {
      await createCotizacion(tenantId, proyectoId, {
        tenant_id: tenantId,
        project_id: proyectoId,
        contratista_id: form.contratista_id,
        contratista_nombre: selectedContratista?.nombre_comercial || selectedContratista?.razon_social || "",
        numero_cotizacion: form.numero || `COT-${Date.now()}`,
        categoria: form.categoria || "General",
        monto_total_usd: Number(form.monto) || 0,
        currency: "USD",
        fecha_emision: new Date().toISOString().slice(0, 10),
        line_items: [],
      });
      toast.success("Cotización registrada");
      setCreateOpen(false);
      setForm({ numero: "", contratista_id: "", categoria: "", monto: "" });
      void load();
    } catch (e) {
      toast.error("No se pudo crear la cotización", {
        description: e instanceof FinanzasApiError ? e.message : e instanceof Error ? e.message : "",
      });
    }
  };

  const { overlay, handleClose } = useModalBackdrop(createOpen, () => setCreateOpen(false));

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Cotizaciones"
      description="Recepción, aprobación y conversión a orden de compra."
      icon={<FileSpreadsheet className="h-10 w-10" aria-hidden />}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Nueva cotización</Button>}
    >
      <FilterBar search={search} onSearchChange={setSearch} />
      {loading ? (
        <FinanzasLoadingState />
      ) : !rows.length ? (
        <FinanzasEmptyState title="Sin cotizaciones" description="Registra cotizaciones de contratistas." actionLabel="+ Nueva cotización" onAction={() => setCreateOpen(true)} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Contratista</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{r.numero_cotizacion}</td>
                  <td className="px-4 py-3">{r.contratista_nombre}</td>
                  <td className="px-4 py-3">{r.categoria}</td>
                  <td className="px-4 py-3"><AmountDisplay amount={r.monto_total_usd} /></td>
                  <td className="px-4 py-3"><FinanzasStatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>Ver</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected((s) => (s.find((x) => x.id === r.id) ? s.filter((x) => x.id !== r.id) : [...s, r]))}>
                        {selected.find((x) => x.id === r.id) ? "Quitar" : "Comparar"}
                      </Button>
                      {r.status === "received" ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setAction({ mode: "approve", row: r })}>Aprobar</Button>
                          <Button size="sm" variant="danger" onClick={() => setAction({ mode: "reject", row: r })}>Rechazar</Button>
                        </>
                      ) : null}
                      {r.status === "approved" ? (
                        <Button size="sm" onClick={() => setConvertTarget(r)}>Convertir a OC</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected.length >= 2 ? (
        <div className="mt-6 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
          <h3 className="text-sm font-bold text-sky-200">Comparación ({selected.length})</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selected.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 p-3">
                <p className="font-semibold text-white">{c.numero_cotizacion}</p>
                <p className="text-xs text-zinc-400">{c.contratista_nombre} · {c.categoria}</p>
                <p className="mt-2"><AmountDisplay amount={c.monto_total_usd} emphasize /></p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {overlay}
      <Modal open={createOpen} onClose={handleClose} closeOnBackdropClick={false} className="!z-50 backdrop:bg-transparent" title="Nueva cotización"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button onClick={() => void create()} disabled={!form.contratista_id}>Guardar</Button>
          </div>
        }>
        <div className="space-y-3">
          <Input label="Número" value={form.numero} onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))} />
          {contratistas.length ? (
            <Select
              label="Contratista"
              value={form.contratista_id}
              onChange={(e) => setForm((f) => ({ ...f, contratista_id: e.target.value }))}
              options={[
                { value: "", label: "— Seleccionar contratista —", disabled: true },
                ...contratistas.map((c) => ({
                  value: c.id,
                  label: c.nombre_comercial || c.razon_social,
                })),
              ]}
            />
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
              <p className="text-sm text-amber-100">
                Primero agrega un contratista al tenant antes de crear una cotización.
              </p>
              {showContratistaForm ? (
                <>
                  <Input
                    label="Razón social"
                    value={newContratista.razon_social}
                    onChange={(e) => setNewContratista((f) => ({ ...f, razon_social: e.target.value }))}
                  />
                  <Input
                    label="RNC / Tax ID"
                    value={newContratista.tax_id}
                    onChange={(e) => setNewContratista((f) => ({ ...f, tax_id: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={creatingContratista}
                    onClick={() => void registerContratista()}
                  >
                    {creatingContratista ? "Registrando…" : "Registrar contratista"}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setShowContratistaForm(true)}>
                  + Crear contratista
                </Button>
              )}
            </div>
          )}
          <Input label="Categoría" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
          <Input label="Monto USD" type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} />
        </div>
      </Modal>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.numero_cotizacion ?? ""} description={detail?.contratista_nombre}>
        {detail ? (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-zinc-500">Monto</dt><dd><AmountDisplay amount={detail.monto_total_usd} /></dd></div>
            <div><dt className="text-zinc-500">Estado</dt><dd><FinanzasStatusBadge status={detail.status} /></dd></div>
          </dl>
        ) : null}
      </Drawer>

      <ConvertPOModal target={convertTarget} tenantId={tenantId} onClose={() => setConvertTarget(null)} onDone={() => { setConvertTarget(null); void load(); }} />

      <JustificationModal
        open={!!action}
        title={action?.mode === "approve" ? "Aprobar cotización" : "Rechazar cotización"}
        confirmLabel={action?.mode === "approve" ? "Aprobar" : "Rechazar"}
        variant={action?.mode === "reject" ? "danger" : "primary"}
        loading={actionLoading}
        onClose={() => setAction(null)}
        onConfirm={async (j) => {
          if (!tenantId || !action) return;
          setActionLoading(true);
          try {
            if (action.mode === "approve") await approveCotizacion(tenantId, action.row.id, { justification: j });
            else await rejectCotizacion(tenantId, action.row.id, { justification: j });
            toast.success("Cotización actualizada");
            setAction(null);
            void load();
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </FinanzasPageShell>
  );
}

function ConvertPOModal({
  target,
  tenantId,
  onClose,
  onDone,
}: {
  target: Cotizacion | null;
  tenantId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const open = !!target;
  const { overlay, handleClose } = useModalBackdrop(open, onClose, loading);

  useEffect(() => {
    if (target) {
      setMonto(String(target.monto_total_usd));
      setNotas("");
    }
  }, [target]);

  const submit = async () => {
    if (!tenantId || !target) return;
    setLoading(true);
    try {
      await convertCotizacionToPO(tenantId, target.id, {
        monto_total_usd: Number(monto) || target.monto_total_usd,
        notas,
      });
      toast.success("Orden de compra creada desde cotización");
      onDone();
    } catch (e) {
      toast.error("Error", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {overlay}
      <Modal open={open} onClose={handleClose} closeOnBackdropClick={false} className="!z-50 backdrop:bg-transparent" title="Convertir a OC"
        description="Campos heredados editables antes de crear la orden de compra."
        footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={handleClose}>Cancelar</Button><Button onClick={() => void submit()} disabled={loading}>Crear OC</Button></div>}>
        <div className="space-y-3">
          <Input label="Monto USD" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} />
          <Input label="Notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
