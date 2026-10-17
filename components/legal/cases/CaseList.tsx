"use client";

import { useMemo, useState } from "react";
import type { CasePriority, CaseState, LegalCase } from "@/lib/legal/cases/case-types";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { CaseCard } from "@/components/legal/cases/CaseCard";

function CaseListSkeleton() {
  return (
    <ul className="grid gap-4 md:grid-cols-2" aria-busy aria-live="polite">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="h-36 animate-pulse rounded-xl bg-zinc-800/50" />
      ))}
    </ul>
  );
}

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
      <div className="space-y-4">
        <p className="text-sm text-zinc-500" aria-live="polite">
          {m.list.loading}
        </p>
        <CaseListSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-red-400" role="alert">
        {m.list.error}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 backdrop-blur-sm"
        role="search"
        aria-label={m.list.filters.search}
      >
        <div className="flex flex-wrap items-center gap-6 text-sm tabular-nums text-zinc-300">
          <span>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.list.stats_total}</span>{" "}
            <span className="font-medium text-zinc-100">{cases.length}</span>
          </span>
          <span>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.list.stats_visible}</span>{" "}
            <span className="font-medium text-zinc-100">{filtered.length}</span>
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-4">
          <label className="flex min-w-[12rem] flex-col gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {m.list.filters.search}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {m.list.filters.state}
            <select
              value={state}
              onChange={(e) => setState(e.target.value as CaseState | "")}
              className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            >
              <option value="">—</option>
              {(Object.keys(m.states) as CaseState[]).map((s) => (
                <option key={s} value={s}>
                  {m.states[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {m.list.filters.priority}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CasePriority | "")}
              className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            >
              <option value="">—</option>
              {(Object.keys(m.priority) as CasePriority[]).map((p) => (
                <option key={p} value={p}>
                  {m.priority[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
            {m.list.filters.type}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 px-3 py-2 text-sm font-normal normal-case tracking-normal text-zinc-100 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
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
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/20 p-10 text-center text-sm text-zinc-500">
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
