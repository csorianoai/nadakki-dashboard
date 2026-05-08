"use client";

import { TaskSection } from "@/components/legal/TaskSection";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import type { LegalTask } from "@/lib/legal/task-types";

const SECTIONS = [
  {
    sectionEs: "Contratos",
    titleKey: "section_contratos" as const,
    icon: "📄",
    headerBarClass: "border-violet-500",
    cardLeftBorderClass: "border-violet-500",
  },
  {
    sectionEs: "Litigios",
    titleKey: "section_litigios" as const,
    icon: "⚖️",
    headerBarClass: "border-indigo-500",
    cardLeftBorderClass: "border-indigo-500",
  },
  {
    sectionEs: "Compliance",
    titleKey: "section_compliance" as const,
    icon: "🛡️",
    headerBarClass: "border-emerald-500",
    cardLeftBorderClass: "border-emerald-500",
  },
  {
    sectionEs: "Investigación",
    titleKey: "section_investigacion" as const,
    icon: "🔍",
    headerBarClass: "border-amber-500",
    cardLeftBorderClass: "border-amber-500",
  },
] as const;

type Props = {
  tasks: LegalTask[];
  loading: boolean;
  error: Error | null;
  onRetry?: () => void;
};

function TaskLauncherSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {SECTIONS.map((s) => (
        <div key={s.sectionEs} className="flex flex-col gap-3">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800/80" />
          <div className="h-[120px] animate-pulse rounded-xl bg-zinc-800/60" />
          <div className="h-[120px] animate-pulse rounded-xl bg-zinc-800/60" />
        </div>
      ))}
    </div>
  );
}

function TaskLauncherError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const m = useLegalHomeMessages();
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-6 text-center">
      <p className="text-base font-semibold text-zinc-100">{m.error_state_title}</p>
      <p className="mt-2 text-sm text-zinc-500">{message || m.error_state_body}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white brightness-100 transition-all hover:brightness-110"
          onClick={onRetry}
        >
          {m.retry}
        </button>
      ) : null}
    </div>
  );
}

function TaskLauncherEmpty() {
  const m = useLegalHomeMessages();
  return (
    <div className="rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/20 p-8 text-center">
      <p className="text-base font-semibold text-zinc-100">{m.empty_state_title}</p>
      <p className="mt-2 text-sm text-zinc-500">{m.empty_state_body}</p>
    </div>
  );
}

export function TaskLauncher({ tasks, loading, error, onRetry }: Props) {
  const m = useLegalHomeMessages();

  if (loading) return <TaskLauncherSkeleton />;
  if (error) return <TaskLauncherError message={error.message} onRetry={onRetry} />;
  if (tasks.length === 0) return <TaskLauncherEmpty />;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {SECTIONS.map((section) => (
        <TaskSection
          key={section.sectionEs}
          title={m[section.titleKey]}
          icon={section.icon}
          headerBarClass={section.headerBarClass}
          cardLeftBorderClass={section.cardLeftBorderClass}
          tasks={tasks.filter((t) => t.section_es === section.sectionEs)}
        />
      ))}
    </div>
  );
}
