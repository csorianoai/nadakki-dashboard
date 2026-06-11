"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreateRunBody, RunResponse } from "../lib/types";
import {
  COUNTRY_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
  VERTICAL_OPTIONS,
} from "../lib/constants";
import { RunStatusBadge } from "./RunStatusBadge";

interface RunSelectorProps {
  runs: RunResponse[];
  selectedRunId: string | null;
  onSelect: (runId: string) => void;
  onCreate: (body: CreateRunBody) => Promise<void>;
  creating: boolean;
}

export function RunSelector({
  runs,
  selectedRunId,
  onSelect,
  onCreate,
  creating,
}: RunSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [countryIso, setCountryIso] = useState("DO");
  const [vertical, setVertical] = useState("consumer_credit");
  const [product, setProduct] = useState("personal_loan");
  const [institutionTypes, setInstitutionTypes] = useState<string[]>([
    "commercial_bank",
    "cooperative",
  ]);

  const toggleInstitution = (value: string) => {
    setInstitutionTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleCreate = async () => {
    await onCreate({
      country_iso: countryIso,
      vertical,
      product,
      institution_types: institutionTypes.length ? institutionTypes : undefined,
    });
    setShowForm(false);
  };

  return (
    <aside
      className="flex w-full flex-col gap-4 rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs lg:max-w-xs"
      aria-label="Investigaciones de mercado"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-forge-lg font-semibold text-forgeGray-800">
          Investigaciones
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-forge-sm border border-[var(--mee-accent)] bg-[var(--mee-accent-soft)] px-2.5 py-1.5 text-forge-xs font-medium text-[var(--mee-accent-strong)] transition-colors hover:bg-[var(--mee-accent-soft-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
          aria-expanded={showForm}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Nueva
        </button>
      </div>

      {showForm ? (
        <form
          className="space-y-3 rounded-forge-md border border-dashed border-forgeGray-200 bg-forgeSurface-sunken p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreate();
          }}
        >
          <label className="block text-forge-xs font-medium text-forgeGray-600">
            País
            <select
              value={countryIso}
              onChange={(e) => setCountryIso(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 bg-white px-2 py-1.5 text-forge-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mee-accent)]"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.iso} value={c.iso}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-forge-xs font-medium text-forgeGray-600">
            Vertical
            <select
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 bg-white px-2 py-1.5 text-forge-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mee-accent)]"
            >
              {VERTICAL_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-forge-xs font-medium text-forgeGray-600">
            Producto
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1 w-full rounded-forge-sm border border-forgeGray-200 bg-white px-2 py-1.5 text-forge-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--mee-accent)]"
            >
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-forge-xs font-medium text-forgeGray-600">
              Tipos de institución
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {INSTITUTION_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-forge-sm border border-forgeGray-200 bg-white px-2 py-1 text-forge-xs"
                >
                  <input
                    type="checkbox"
                    checked={institutionTypes.includes(opt.value)}
                    onChange={() => toggleInstitution(opt.value)}
                    className="accent-[var(--mee-accent)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-forge-sm bg-[var(--mee-accent)] px-3 py-2 text-forge-sm font-semibold text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)]"
          >
            {creating ? "Creando…" : "Crear investigación"}
          </button>
        </form>
      ) : null}

      <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto" role="listbox" aria-label="Lista de runs">
        {runs.length === 0 ? (
          <li className="text-forge-sm text-forgeGray-500">Sin investigaciones aún.</li>
        ) : (
          runs.map((run) => {
            const selected = run.id === selectedRunId;
            return (
              <li key={run.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(run.id)}
                  className={`w-full rounded-forge-md border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mee-accent)] ${
                    selected
                      ? "border-[var(--mee-accent)] bg-[var(--mee-accent-soft)]"
                      : "border-forgeGray-200 bg-white hover:border-forgeGray-300 hover:bg-forgeGray-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-forgeGray-800">
                      {run.product.replace(/_/g, " ")}
                    </span>
                    <RunStatusBadge status={run.status} />
                  </div>
                  <p className="mt-1 text-forge-xs text-forgeGray-500">
                    {run.country_iso} · {run.vertical.replace(/_/g, " ")}
                  </p>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
