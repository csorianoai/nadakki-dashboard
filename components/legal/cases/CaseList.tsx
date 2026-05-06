"use client";

import { useMemo, useState } from "react";
import type { CasePriority, CaseState, LegalCase } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseCard } from "@/components/legal/cases/CaseCard";

export function CaseList({
  cases,
  loading,
  error,
}: {
  cases: LegalCase[];
  loading?: boolean;
  error?: Error | null;
}) {
  const m = useLegalCasesMessages();
  const [state, setState] = useState<CaseState | "">("");
  const [priority, setPriority] = useState<CasePriority | "">("");
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (state && c.state !== state) return false;
      if (priority && c.priority !== priority) return false;
      if (type && c.case_type !== type) return false;
      if (q.trim()) {
        const n = `${c.title} ${c.case_number_internal}`.toLowerCase();
        if (!n.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [cases, state, priority, type, q]);

  if (loading) {
    return (
      <p className="text-forgeInk-500" aria-live="polite">
        {m.list.loading}
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-forgeDanger-700" role="alert">
        {m.list.error}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-end gap-3 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card p-4"
        role="search"
        aria-label={m.list.filters.search}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-forgeInk-600">
          {m.list.filters.search}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="min-w-[12rem] rounded-forge-sm border border-forgeInk-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-forgeInk-600">
          {m.list.filters.state}
          <select
            value={state}
            onChange={(e) => setState(e.target.value as CaseState | "")}
            className="rounded-forge-sm border border-forgeInk-200 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {(Object.keys(m.states) as CaseState[]).map((s) => (
              <option key={s} value={s}>
                {m.states[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-forgeInk-600">
          {m.list.filters.priority}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as CasePriority | "")}
            className="rounded-forge-sm border border-forgeInk-200 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {(Object.keys(m.priority) as CasePriority[]).map((p) => (
              <option key={p} value={p}>
                {m.priority[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-forgeInk-600">
          {m.list.filters.type}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-forge-sm border border-forgeInk-200 px-2 py-1.5 text-sm"
          >
            <option value="">—</option>
            {(Object.keys(m.case_types) as Array<keyof typeof m.case_types>).map((t) => (
              <option key={t} value={t}>
                {m.case_types[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-forge-md border border-dashed border-forgeInk-200 p-8 text-center text-forgeInk-600">
          {m.list.empty}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <li key={c.case_id}>
              <CaseCard legalCase={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
