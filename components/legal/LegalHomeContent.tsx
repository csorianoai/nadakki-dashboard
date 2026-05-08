"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, Plus, ScrollText, Search, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { LegalStatusStrip } from "@/components/legal/LegalStatusStrip";
import { RecentActivityList } from "@/components/legal/RecentActivityList";
import { TaskLauncher } from "@/components/legal/TaskLauncher";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { useLegalRecentActivity } from "@/hooks/useLegalRecentActivity";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { cn } from "@/lib/utils";

const quickCardBase =
  "group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 to-zinc-900/60 p-6 shadow-sm transition-all hover:scale-[1.005] hover:border-violet-500/35 hover:shadow-md hover:shadow-violet-950/20";

export default function LegalHomeContent() {
  const m = useLegalHomeMessages();
  const { settings } = useTenant();
  const auth = useAuth();
  const { effectiveTenantId } = useLegalEffectiveTenantId();
  const { tasks, loading, error, refetch } = useLegalTasks("do");
  const recent = useLegalRecentActivity(effectiveTenantId, 5);
  const casesQ = useLegalCases(effectiveTenantId);

  const showAdmin = auth.role === "admin" || auth.role === "owner";
  const caseTotal = casesQ.data?.cases?.length ?? null;

  return (
    <div id="main-content" className="flex min-h-[calc(100vh-10rem)] flex-col space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 md:p-8"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.hero_kicker}</p>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">{m.title}</h1>
            <p className="text-sm text-zinc-400">{m.hero_description}</p>
            <p className="text-sm text-zinc-500">
              <span className="font-medium text-zinc-300">{m.tenant_label}:</span> {settings.name}
            </p>
            {showAdmin ? (
              <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                {m.admin_badge}
              </span>
            ) : null}
          </div>
          <div className="grid min-w-[12rem] gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.stat_cases_total}</p>
              <p className="mt-1 text-2xl font-medium tabular-nums tracking-tight text-zinc-100">
                {casesQ.isLoading ? "…" : caseTotal ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.stat_recent_feed}</p>
              <p className="mt-1 text-2xl font-medium tabular-nums tracking-tight text-zinc-100">
                {recent.loading ? "…" : String(recent.entries.length)}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <LegalStatusStrip tenantId={effectiveTenantId} />

      <section aria-labelledby="legal-quick">
        <h2 id="legal-quick" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {m.quick_title}
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <li>
            <Link href="/legal/cases/new" className={cn(quickCardBase, "ring-1 ring-transparent")}>
              <Plus className="h-8 w-8 text-violet-400" aria-hidden />
              <span className="mt-4 block text-base font-medium text-zinc-100">{m.quick_new_case}</span>
              <span className="mt-1 text-sm text-zinc-500">{m.quick_new_case_desc}</span>
            </Link>
          </li>
          <li>
            <Link href="/legal/cases" className={quickCardBase}>
              <Briefcase className="h-8 w-8 text-indigo-400" aria-hidden />
              <span className="mt-4 block text-base font-medium text-zinc-100">{m.quick_cases_list}</span>
              <span className="mt-1 text-sm text-zinc-500">{m.quick_cases_list_desc}</span>
            </Link>
          </li>
          <li>
            <Link href="/legal/research" className={quickCardBase}>
              <Search className="h-8 w-8 text-violet-400" aria-hidden />
              <span className="mt-4 block text-base font-medium text-zinc-100">{m.quick_research}</span>
              <span className="mt-1 text-sm text-zinc-500">{m.quick_research_desc}</span>
            </Link>
          </li>
          <li>
            <Link href="/legal/audit" className={quickCardBase}>
              <ScrollText className="h-8 w-8 text-amber-400/90" aria-hidden />
              <span className="mt-4 block text-base font-medium text-zinc-100">{m.quick_audit}</span>
              <span className="mt-1 text-sm text-zinc-500">{m.quick_audit_desc}</span>
            </Link>
          </li>
        </ul>
        <div className="mt-4">
          <Link
            href="/legal/config"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/40 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900/80"
          >
            <Settings className="h-4 w-4 text-zinc-500" aria-hidden />
            {m.quick_config}
            <span className="text-zinc-500">— {m.quick_config_desc}</span>
          </Link>
        </div>
      </section>

      <main className="space-y-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-medium tracking-tight text-zinc-100">{m.main_heading}</h2>
        <p className="text-sm text-zinc-500">{m.main_subheading}</p>
        <TaskLauncher tasks={tasks} loading={loading} error={error} onRetry={() => void refetch()} />
      </main>

      <section className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.recent_activity}</h3>
        <div className="mt-4">
          <RecentActivityList entries={recent.entries} loading={recent.loading} />
        </div>
      </section>
    </div>
  );
}
