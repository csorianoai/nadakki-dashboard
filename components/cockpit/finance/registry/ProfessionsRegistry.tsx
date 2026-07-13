"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import {
  createRegistryProfession,
  deleteRegistryProfession,
  fetchRegistryProfessions,
  updateRegistryProfession,
} from "@/lib/cockpit/api/registry";
import type { RegistryProfession } from "@/lib/cockpit/finance-v3/contracts/registry";
import type { CockpitStructuredWarning } from "@/lib/cockpit/finance-v3/warnings";
import { POPULATION_API_CORES, POPULATION_FAMILIES } from "@/lib/cockpit/population-config";
import { RegistryWarningsBanner } from "./RegistryWarningsBanner";
import { SNAKE_CASE } from "./RegistrySubNav";

const inputCls =
  "w-full rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm text-cockpit-text";

type DrawerState = (RegistryProfession & { core_name: string }) | "new" | null;

export function ProfessionsRegistry() {
  const cores = POPULATION_API_CORES;
  const [coreFilter, setCoreFilter] = useState<string>(cores[0]?.apiName ?? "credit");
  const [rows, setRows] = useState<RegistryProfession[]>([]);
  const [dataSource, setDataSource] = useState<string>("live");
  const [warnings, setWarnings] = useState<CockpitStructuredWarning[]>([]);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const families = useMemo(() => {
    const fromRows = rows.map((r) => r.family);
    const seeded = POPULATION_FAMILIES.map((f) => f.value);
    return Array.from(new Set([...seeded, ...fromRows])).sort();
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const r = await fetchRegistryProfessions(coreFilter);
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
    role_code: string;
    family: string;
    display_name: string;
    sort_order: number;
    description?: string | null;
  }) => {
    setError(null);
    if (!SNAKE_CASE.test(form.role_code)) {
      setError("role_code debe ser snake_case");
      return;
    }
    if (!form.family.trim()) {
      setError("family no puede estar vacío");
      return;
    }
    const result = form.id
      ? await updateRegistryProfession(form.id, {
          family: form.family,
          display_name: form.display_name,
          sort_order: form.sort_order,
          description: form.description ?? null,
        })
      : await createRegistryProfession({
          core_name: form.core_name,
          role_code: form.role_code,
          family: form.family,
          display_name: form.display_name,
          sort_order: form.sort_order,
          description: form.description ?? null,
        });
    if (result.status === "error") {
      setError(result.statusCode === 409 ? "Conflicto: role_code ya existe en este core" : result.error);
      return;
    }
    setDrawer(null);
    void load();
  };

  const remove = async (id: string) => {
    setError(null);
    const result = await deleteRegistryProfession(id);
    if (result.status === "error") {
      setError(result.error);
      return;
    }
    setConfirmDelete(null);
    void load();
  };

  if (loading) return <p className="text-sm text-cockpit-muted">Cargando profesiones…</p>;

  return (
    <div className="space-y-4" data-testid="registry-professions">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm"
          value={coreFilter}
          onChange={(e) => setCoreFilter(e.target.value)}
          data-testid="registry-core-filter"
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
          Agregar profesión
        </button>
      </div>

      {dataSource === "error" ? <DataTruthBadge level="ERROR" /> : null}
      <RegistryWarningsBanner warnings={warnings ?? []} />
      {error ? <p className="text-sm text-cockpit-err">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-cockpit-border">
        <table className="w-full text-sm">
          <thead className="bg-cockpit-surface text-xs uppercase text-cockpit-muted">
            <tr>
              {["Core", "Role code", "Familia", "Nombre", "Orden", "Estado", ""].map((h) => (
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
                <td className="px-3 py-2 font-mono text-xs">{r.role_code}</td>
                <td className="px-3 py-2">{r.family}</td>
                <td className="px-3 py-2">{r.display_name}</td>
                <td className="px-3 py-2 tabular-nums">{r.sort_order}</td>
                <td className="px-3 py-2">{r.active ? "Activo" : "Inactivo"}</td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="text-xs text-cockpit-err"
                    onClick={() => setConfirmDelete(r.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer ? (
        <ProfessionDrawer
          cores={cores}
          families={families}
          initial={
            drawer === "new"
              ? {
                  core_name: coreFilter,
                  role_code: "",
                  family: families[0] ?? "dealers",
                  display_name: "",
                  sort_order: 0,
                  description: null,
                }
              : {
                  id: drawer.id,
                  core_name: drawer.core_name,
                  role_code: drawer.role_code,
                  family: drawer.family,
                  display_name: drawer.display_name,
                  sort_order: drawer.sort_order,
                  description: drawer.description,
                }
          }
          isNew={drawer === "new"}
          onClose={() => setDrawer(null)}
          onSave={save}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          message="¿Eliminar esta profesión? Si está referenciada se desactivará (soft delete)."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void remove(confirmDelete)}
        />
      ) : null}
    </div>
  );
}

function ProfessionDrawer({
  cores,
  families,
  initial,
  isNew,
  onClose,
  onSave,
}: {
  cores: typeof POPULATION_API_CORES;
  families: string[];
  initial: {
    id?: string;
    core_name: string;
    role_code: string;
    family: string;
    display_name: string;
    sort_order: number;
    description?: string | null;
  };
  isNew: boolean;
  onClose: () => void;
  onSave: (f: typeof initial) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [newFamily, setNewFamily] = useState("");
  const [useNewFamily, setUseNewFamily] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" data-testid="registry-profession-drawer">
      <aside className="h-full w-full max-w-md border-l border-cockpit-border bg-cockpit-surface p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">{isNew ? "Nueva profesión" : "Editar profesión"}</h3>
        <div className="space-y-3">
          <label className="block text-xs text-cockpit-muted">
            Core
            <select
              className={`mt-1 ${inputCls}`}
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
          </label>
          <label className="block text-xs text-cockpit-muted">
            Role code
            <input
              className={`mt-1 ${inputCls}`}
              value={form.role_code}
              disabled={!isNew}
              onChange={(e) => setForm((p) => ({ ...p, role_code: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-cockpit-muted">
            Familia
            {useNewFamily ? (
              <input
                className={`mt-1 ${inputCls}`}
                value={newFamily}
                placeholder="nueva_familia"
                onChange={(e) => {
                  setNewFamily(e.target.value);
                  setForm((p) => ({ ...p, family: e.target.value }));
                }}
              />
            ) : (
              <select
                className={`mt-1 ${inputCls}`}
                value={form.family}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setUseNewFamily(true);
                    setNewFamily("");
                  } else {
                    setForm((p) => ({ ...p, family: e.target.value }));
                  }
                }}
              >
                {families.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__new__">+ Crear nueva familia</option>
              </select>
            )}
          </label>
          <label className="block text-xs text-cockpit-muted">
            Display name
            <input
              className={`mt-1 ${inputCls}`}
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-cockpit-muted">
            Sort order
            <input
              className={`mt-1 ${inputCls}`}
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
            />
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm"
            onClick={() => void onSave(form)}
          >
            Guardar
          </button>
          <button type="button" className="rounded-lg border border-cockpit-border px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </aside>
    </div>
  );
}

function ConfirmModal({
  message,
  onCancel,
  onConfirm,
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" data-testid="registry-confirm-modal">
      <div className="max-w-sm rounded-xl border border-cockpit-border bg-cockpit-surface p-6">
        <p className="text-sm">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="rounded-lg bg-cockpit-err px-3 py-1.5 text-sm text-white" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
