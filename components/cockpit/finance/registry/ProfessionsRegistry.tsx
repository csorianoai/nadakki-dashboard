"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchCoreRegistry } from "@/lib/cockpit/api/tenantAdmin";
import {
  createProfession,
  deleteProfession,
  listProfessions,
  updateProfession,
} from "@/lib/cockpit/api/financeRegistry";
import { DEMO_PROFESSION_FAMILIES } from "@/lib/cockpit/demo-population";
import type { RegistryProfession } from "@/lib/cockpit/types-finance";
import { SNAKE_CASE } from "./RegistrySubNav";

const inputCls =
  "w-full rounded border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm text-cockpit-text";

export function ProfessionsRegistry() {
  const [cores, setCores] = useState<Array<{ code: string; display_name: string }>>([]);
  const [coreFilter, setCoreFilter] = useState("");
  const [rows, setRows] = useState<RegistryProfession[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [drawer, setDrawer] = useState<RegistryProfession | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await fetchCoreRegistry();
    const list = c.map((x) => ({ code: x.code, display_name: x.display_name }));
    setCores(list);
    const code = coreFilter || list[0]?.code || "credit_hub";
    if (!coreFilter && list[0]) setCoreFilter(list[0].code);
    const r = await listProfessions(code);
    setRows(r.data.professions ?? []);
    setIsDemo(r.isDemo);
  }, [coreFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (form: Omit<RegistryProfession, "id"> & { id?: string }) => {
    setError(null);
    if (!SNAKE_CASE.test(form.role_code)) {
      setError("role_code debe ser snake_case");
      return;
    }
    try {
      if (form.id) await updateProfession(form.id, form);
      else await createProfession(form);
      setDrawer(null);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar profesión?")) return;
    try {
      await deleteProfession(id);
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
          Agregar profesión
        </button>
      </div>
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      {error ? <p className="text-sm text-cockpit-err">{error}</p> : null}
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-cockpit-muted">
          <tr>
            {["Core", "Role", "Familia", "Nombre", "Orden", "Acciones"].map((h) => (
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
              <td className="px-2 py-2 font-mono text-xs">{r.role_code}</td>
              <td className="px-2 py-2">{r.family}</td>
              <td className="px-2 py-2">{r.display_name}</td>
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
        <ProfessionDrawer
          cores={cores}
          initial={
            drawer === "new"
              ? { core_code: coreFilter, role_code: "", family: DEMO_PROFESSION_FAMILIES[0], display_name: "", sort_order: 0 }
              : drawer
          }
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

function ProfessionDrawer({
  cores,
  initial,
  onClose,
  onSave,
}: {
  cores: Array<{ code: string; display_name: string }>;
  initial: Omit<RegistryProfession, "id"> & { id?: string };
  onClose: () => void;
  onSave: (f: Omit<RegistryProfession, "id"> & { id?: string }) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-96 border-l border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-4 font-semibold">{form.id ? "Editar" : "Nueva"} profesión</h3>
        <div className="space-y-3">
          <select className={inputCls} value={form.core_code} onChange={(e) => setForm((p) => ({ ...p, core_code: e.target.value }))}>
            {cores.map((c) => (
              <option key={c.code} value={c.code}>
                {c.display_name}
              </option>
            ))}
          </select>
          <input className={inputCls} placeholder="role_code" value={form.role_code} onChange={(e) => setForm((p) => ({ ...p, role_code: e.target.value }))} />
          <select className={inputCls} value={form.family} onChange={(e) => setForm((p) => ({ ...p, family: e.target.value }))}>
            {DEMO_PROFESSION_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input className={inputCls} placeholder="display_name" value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} />
          <input className={inputCls} type="number" placeholder="sort_order" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} />
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
