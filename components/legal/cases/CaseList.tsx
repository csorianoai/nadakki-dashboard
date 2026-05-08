"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CasePriority, CaseState, LegalCase } from "@/lib/legal/cases/case-types";
import { daysUntil } from "@/lib/legal/cases/deadline-formatter";
import { CaseCommandRow } from "@/components/legal/cases/CaseCommandRow";
import { CasesListSkeleton } from "@/components/legal/cases/CasesListSkeleton";
import { CommandBar, type CommandBarChip } from "@/components/legal/cases/CommandBar";
import { EmptyStateRevolution } from "@/components/legal/cases/EmptyStateRevolution";
import { StatsRibbon } from "@/components/legal/cases/StatsRibbon";
import { useLegalCasesMessages } from "@/hooks/useLegalCasesMessages";
import { useCaseStats } from "@/hooks/legal/useCaseStats";

const ROW_BATCH = 50;

function deadlineDueWithinDays(c: LegalCase, horizon: number): boolean {
  for (const d of c.deadlines ?? []) {
    if (d.status !== "active") continue;
    const days = daysUntil(d.effective_deadline_date);
    if (days >= 0 && days <= horizon) return true;
  }
  return false;
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
  const lm = m.list.revolution;
  const [state, setState] = useState<CaseState | "">("");
  const [priority, setPriority] = useState<CasePriority | "">("");
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q.trim().toLowerCase());

  const [presetActive, setPresetActive] = useState(false);
  const [presetDeadlines, setPresetDeadlines] = useState(false);
  const [presetHot, setPresetHot] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ROW_BATCH);

  const stats = useCaseStats(cases);

  useEffect(() => {
    setVisibleCount(ROW_BATCH);
  }, [cases, state, priority, type, deferredQ, presetActive, presetDeadlines, presetHot]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (state && c.state !== state) return false;
      if (priority && c.priority !== priority) return false;
      if (type && c.case_type !== type) return false;
      if (deferredQ) {
        const bag = `${c.title} ${c.case_number_internal}`.toLowerCase();
        if (!bag.includes(deferredQ)) return false;
      }
      if (presetActive && (c.state === "CLOSED" || c.state === "ARCHIVED")) return false;
      if (presetDeadlines && !deadlineDueWithinDays(c, 7)) return false;
      if (presetHot && c.priority !== "high" && c.priority !== "critical") return false;
      return true;
    });
  }, [cases, state, priority, type, deferredQ, presetActive, presetDeadlines, presetHot]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const chips: CommandBarChip[] = useMemo(
    () => [
      {
        id: "preset-active",
        active: presetActive,
        label: lm.preset.active_only,
        onToggle: () => setPresetActive((v) => !v),
      },
      {
        id: "preset-deadlines",
        active: presetDeadlines,
        label: lm.preset.deadlines_week,
        onToggle: () => setPresetDeadlines((v) => !v),
      },
      {
        id: "preset-hot",
        active: presetHot,
        label: lm.preset.priority_hot,
        onToggle: () => setPresetHot((v) => !v),
      },
    ],
    [lm.preset.active_only, lm.preset.deadlines_week, lm.preset.priority_hot, presetActive, presetDeadlines, presetHot]
  );

  if (loading) {
    return (
      <div className="space-y-6" aria-live="polite">
        <div className="h-16 animate-pulse rounded-2xl bg-zinc-900/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-900/60" />
          ))}
        </div>
        <CasesListSkeleton />
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
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">{m.list.title}</h1>
            <p className="text-sm text-zinc-400">{lm.subtitle}</p>
          </div>
        </div>
        <CommandBar query={q} onQuery={setQ} chips={chips} />
      </header>

      <StatsRibbon stats={stats} labels={lm.stats} />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-lg">
        <button
          type="button"
          aria-expanded={advancedOpen}
          className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left text-sm font-semibold text-zinc-200 outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-cyan-500"
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          <span>{lm.filters_panel.toggle_advanced}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">{lm.filters_panel.advanced_hint}</span>
        </button>

        {advancedOpen ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                <span className="mb-3 block">{m.list.filters.state}</span>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value as CaseState | "")}
                  aria-label={m.list.filters.state}
                  className="w-full rounded-xl border border-zinc-700/90 bg-gradient-to-br from-zinc-950 to-zinc-900 px-3 py-3 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <option value="">—</option>
                  {(Object.keys(m.states) as CaseState[]).map((s) => (
                    <option key={s} value={s}>
                      {(m.states as Record<string, string>)[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                <span className="mb-3 block">{m.list.filters.priority}</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CasePriority | "")}
                  aria-label={m.list.filters.priority}
                  className="w-full rounded-xl border border-zinc-700/90 bg-gradient-to-br from-zinc-950 to-zinc-900 px-3 py-3 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <option value="">—</option>
                  {(Object.keys(m.priority) as CasePriority[]).map((p) => (
                    <option key={p} value={p}>
                      {(m.priority as Record<string, string>)[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                <span className="mb-3 block">{m.list.filters.type}</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  aria-label={m.list.filters.type}
                  className="w-full rounded-xl border border-zinc-700/90 bg-gradient-to-br from-zinc-950 to-zinc-900 px-3 py-3 text-xs text-white outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <option value="">—</option>
                  {(Object.keys(m.case_types) as Array<keyof typeof m.case_types>).map((t) => (
                    <option key={t} value={t}>
                      {(m.case_types as Record<string, string>)[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {state || priority || type ? (
              <button
                type="button"
                className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest text-zinc-300 ring-1 ring-zinc-700 transition hover:text-white"
                onClick={() => {
                  setState("");
                  setPriority("");
                  setType("");
                }}
              >
                {lm.filters_panel.clear_advanced}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <EmptyStateRevolution headline={lm.empty.title} body={lm.empty.body} messages={lm.empty} />
      ) : (
        <>
          <motion.ul
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.05, delayChildren: 0.04 },
              },
            }}
          >
            {visibleRows.map((legalCase, index) => (
              <motion.li
                key={legalCase.case_id}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.2, delay: Math.min(index * 0.035, 0.45), ease: [0.33, 1, 0.68, 1] },
                  },
                }}
                className="list-none overflow-hidden rounded-xl"
              >
                <CaseCommandRow legalCase={legalCase} />
              </motion.li>
            ))}
          </motion.ul>
          {filtered.length > visibleCount ? (
            <div className="text-center">
              <button
                type="button"
                className="rounded-full px-10 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 ring-1 ring-zinc-700 transition hover:text-white hover:ring-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                onClick={() => setVisibleCount((prev) => Math.min(prev + ROW_BATCH, filtered.length))}
              >
                {lm.load_more}
              </button>
              <p className="mt-3 text-[11px] text-zinc-500">{lm.load_more_hint}</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
