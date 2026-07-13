"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchCoreRegistry } from "@/lib/cockpit/api/tenantAdmin";
import {
  createEntityType,
  deleteEntityType,
  listEntityTypes,
  updateEntityType,
} from "@/lib/cockpit/api/financeRegistry";
import type { RegistryEntityType } from "@/lib/cockpit/types-finance";
import { SNAKE_CASE } from "./RegistrySubNav";

const inputCls =
  "w-full rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm text-cockpit-text";

export function EntityTypesRegistry() {
  const [cores, setCores] = useState<Array<{ code: string; display_name: string }>>([]);
  const [coreFilter, setCoreFilter] = useState("");
  const [rows, setRows] = useState<RegistryEntityType[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [drawer, setDrawer] = useState<RegistryEntityType | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await fetchCoreRegistry();
    const list = c.map((x) => ({ code: x.code, display_name: x.display_name }));
    setCores(list);
    const code = coreFilter || list[0]?.code || "credit_hub";
    if (!coreFilter && list[0]) setCoreFilter(list[0].code);
    const r = await listEntityTypes(code);
    setRows(r.data.entity_types ?? []);
    setIsDemo(r.isDemo);
  }, [coreFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (form: Omit<RegistryEntityType, "id"> & { id?: string }) => {
    setError(null);
    if (!SNAKE_CASE.test(form.entity_code)) {
      setError("entity_code debe ser snake_case");
      return;
    }
    try {
      if (form.id) await updateEntityType(form.id, form);
      else await createEntityType(form);
      setDrawer(null);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar tipo de entidad?")) return;
    try {
      await deleteEntityType(id);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          value={coreFilter}
          onChange={(e) => setCoreFilter(e.target.value)}
        >
          {cores.map((c) => (
            <option key={c.code} value={c.code}>
              {c.display_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded bg-cockpit-accent px-4 py-2 text-sm text-cockpit-bg"
          onClick={() => setDrawer("new")}
        >
          Agregar tipo
        </button>
      </div>
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      {error ? <p className="text-sm text-cockpit-err">{error}</p> : null}
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-cockpit-muted">
          <tr>
            {["Core", "Código", "Nombre", "Descripción", "Orden", "Acciones"].map((h) => (
              <th key={h} className="px-2 py-2 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-cockpit-border">
              <td className="px-2 py-2">{r.core_code}</td>
              <td className="px-2 py-2 font-mono text-xs">{r.entity_code}</td>
              <td className="px-2 py-2">{r.display_name}</td>
              <td className="px-2 py-2 text-cockpit-muted">{r.description ?? "—"}</td>
              <td className="px-2 py-2 font-cockpitMono tabular-nums">{r.sort_order}</td>
              <td className="px-2 py-2 space-x-2">
                <button type="button" className="text-xs text-cockpit-accent" onClick={() => setDrawer(r)}>
                  Editar
                </button>
                <button type="button" className="text-xs text-cockpit-err" onClick={() => void remove(r.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {drawer ? (
        <EntityDrawer
          cores={cores}
          initial={
            drawer === "new"
              ? { core_code: coreFilter, entity_code: "", display_name: "", description: "", sort_order: 0 }
              : drawer
          }
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function EntityDrawer({
  cores,
  initial,
  onClose,
  onSave,
}: {
  cores: Array<{ code: string; display_name: string }>;
  initial: Omit<RegistryEntityType, "id"> & { id?: string };
  onClose: () => void;
  onSave: (f: Omit<RegistryEntityType, "id"> & { id?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-96 border-l border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-4 font-semibold">{form.id ? "Editar" : "Nuevo"} tipo de entidad</h3>
        <div className="space-y-3">
          <select className={inputCls} value={form.core_code} onChange={(e) => setForm((p) => ({ ...p, core_code: e.target.value }))}>
            {cores.map((c) => (
              <option key={c.code} value={c.code}>
                {c.display_name}
              </option>
            ))}
          </select>
          <input className={inputCls} placeholder="entity_code" value={form.entity_code} onChange={(e) => setForm((p) => ({ ...p, entity_code: e.target.value }))} />
          <input className={inputCls} placeholder="display_name" value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} />
          <input className={inputCls} placeholder="description" value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <input className={inputCls} type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} />
        </div>
        <div className="mt-4 flex gap-2">
          <button type="button" className="rounded bg-cockpit-accent px-3 py-1 text-sm" onClick={() => void onSave(form)}>
            Guardar
          </button>
          <button type="button" className="rounded border border-cockpit-border px-3 py-1 text-sm" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </aside>
    </div>
  );
}
