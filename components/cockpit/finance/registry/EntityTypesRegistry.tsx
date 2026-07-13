"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import {
  createRegistryEntityType,
  deleteRegistryEntityType,
  fetchRegistryEntityTypes,
  updateRegistryEntityType,
} from "@/lib/cockpit/api/registry";
import type { RegistryEntityType } from "@/lib/cockpit/finance-v3/contracts/registry";
import type { CockpitStructuredWarning } from "@/lib/cockpit/finance-v3/warnings";
import { POPULATION_API_CORES } from "@/lib/cockpit/population-config";
import { RegistryWarningsBanner } from "./RegistryWarningsBanner";
import { SNAKE_CASE } from "./RegistrySubNav";

const inputCls =
  "w-full rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm text-cockpit-text";

type DrawerState = (RegistryEntityType & { core_name: string }) | "new" | null;

export function EntityTypesRegistry() {
  const cores = POPULATION_API_CORES;
  const [coreFilter, setCoreFilter] = useState<string>(cores[0]?.apiName ?? "credit");
  const [rows, setRows] = useState<RegistryEntityType[]>([]);
  const [dataSource, setDataSource] = useState<string>("live");
  const [warnings, setWarnings] = useState<CockpitStructuredWarning[]>([]);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetchRegistryEntityTypes(coreFilter);
    if (r.status === "ok") {
      setRows(r.envelope.data.items);
      setDataSource(r.envelope.data_source);
      setWarnings(r.envelope.warnings ?? []);
    } else {
      setError(r.statusCode === 403 ? "Acceso denegado (403)" : r.error);
      setRows([]);
      setDataSource("error");
    }
    setLoading(false);
  }, [coreFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (form: {
    id?: string;
    core_name: string;
    entity_code: string;
    display_name: string;
    description?: string | null;
    sort_order: number;
  }) => {
    setError(null);
    if (!SNAKE_CASE.test(form.entity_code)) {
      setError("entity_code debe ser snake_case");
      return;
    }
    const result = form.id
      ? await updateRegistryEntityType(form.id, {
          display_name: form.display_name,
          description: form.description ?? null,
          sort_order: form.sort_order,
        })
      : await createRegistryEntityType({
          core_name: form.core_name,
          entity_code: form.entity_code,
          display_name: form.display_name,
          description: form.description ?? null,
          sort_order: form.sort_order,
        });
    if (result.status === "error") {
      setError(result.statusCode === 409 ? "Conflicto: entity_code ya existe en este core" : result.error);
      return;
    }
    setDrawer(null);
    void load();
  };

  const remove = async (id: string) => {
    setError(null);
    const result = await deleteRegistryEntityType(id);
    if (result.status === "error") {
      setError(result.error);
      return;
    }
    setConfirmDelete(null);
    void load();
  };

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando tipos de entidad…</p>;

  return (
    <div className="space-y-4" data-testid="registry-entity-types">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          value={coreFilter}
          onChange={(e) => setCoreFilter(e.target.value)}
        >
          {cores.map((c) => (
            <option key={c.apiName} value={c.apiName}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm text-cockpit-bg"
          onClick={() => setDrawer("new")}
        >
          Agregar tipo de entidad
        </button>
      </div>

      {dataSource === "error" ? <DataTruthBadge level="ERROR" /> : null}
      <RegistryWarningsBanner warnings={warnings} />
      {error ? <p className="text-sm text-cockpit-err">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-cockpit-border">
        <table className="w-full text-sm">
          <thead className="bg-cockpit-surface text-xs uppercase text-cockpit-muted">
            <tr>
              {["Core", "Entity code", "Nombre", "Descripción", "Orden", "Estado", ""].map((h) => (
                <th key={h} className="px-3 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer border-t border-cockpit-border hover:bg-cockpit-border/20"
                onClick={() => setDrawer({ ...r, core_name: r.core })}
              >
                <td className="px-3 py-2">{r.core}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.entity_code}</td>
                <td className="px-3 py-2">{r.display_name}</td>
                <td className="px-3 py-2 text-cockpit-muted">{r.description ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{r.sort_order}</td>
                <td className="px-3 py-2">{r.active ? "Activo" : "Inactivo"}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="text-xs text-cockpit-err" onClick={() => setConfirmDelete(r.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer ? (
        <EntityDrawer
          cores={cores}
          initial={
            drawer === "new"
              ? {
                  core_name: coreFilter,
                  entity_code: "",
                  display_name: "",
                  description: "",
                  sort_order: 0,
                }
              : {
                  id: drawer.id,
                  core_name: drawer.core_name,
                  entity_code: drawer.entity_code,
                  display_name: drawer.display_name,
                  description: drawer.description ?? "",
                  sort_order: drawer.sort_order,
                }
          }
          isNew={drawer === "new"}
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="max-w-sm rounded-xl border border-cockpit-border bg-cockpit-surface p-6">
            <p className="text-sm">¿Eliminar este tipo de entidad? Si está referenciado se desactivará.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg bg-cockpit-err px-3 py-1.5 text-sm text-white"
                onClick={() => void remove(confirmDelete)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EntityDrawer({
  cores,
  initial,
  isNew,
  onClose,
  onSave,
}: {
  cores: typeof POPULATION_API_CORES;
  initial: {
    id?: string;
    core_name: string;
    entity_code: string;
    display_name: string;
    description: string;
    sort_order: number;
  };
  isNew: boolean;
  onClose: () => void;
  onSave: (f: typeof initial) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <aside className="h-full w-full max-w-md border-l border-cockpit-border bg-cockpit-surface p-6">
        <h3 className="mb-4 text-lg font-semibold">{isNew ? "Nuevo tipo" : "Editar tipo"}</h3>
        <div className="space-y-3">
          <select
            className={inputCls}
            value={form.core_name}
            disabled={!isNew}
            onChange={(e) => setForm((p) => ({ ...p, core_name: e.target.value }))}
          >
            {cores.map((c) => (
              <option key={c.apiName} value={c.apiName}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="entity_code"
            value={form.entity_code}
            disabled={!isNew}
            onChange={(e) => setForm((p) => ({ ...p, entity_code: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="display_name"
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
          />
          <textarea
            className={inputCls}
            placeholder="description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <input
            className={inputCls}
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
          />
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm" onClick={() => void onSave(form)}>
            Guardar
          </button>
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </aside>
    </div>
  );
}
