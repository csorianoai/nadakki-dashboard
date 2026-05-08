"use client";

import { TaskSection } from "@/components/legal/TaskSection";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import type { LegalTask } from "@/lib/legal/task-types";

const SECTIONS = [
  {
    sectionEs: "Contratos",
    titleKey: "section_contratos" as const,
    icon: "📄",
    headerBarClass: "border-forgeInfo-500",
    cardLeftBorderClass: "border-forgeInfo-500",
  },
  {
    sectionEs: "Litigios",
    titleKey: "section_litigios" as const,
    icon: "⚖️",
    headerBarClass: "border-forge-warning",
    cardLeftBorderClass: "border-forge-warning",
  },
  {
    sectionEs: "Compliance",
    titleKey: "section_compliance" as const,
    icon: "🛡️",
    headerBarClass: "border-forge-success",
    cardLeftBorderClass: "border-forge-success",
  },
  {
    sectionEs: "Investigación",
    titleKey: "section_investigacion" as const,
    icon: "🔍",
    headerBarClass: "border-forgeViz-5",
    cardLeftBorderClass: "border-forgeViz-5",
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
          <div className="h-8 w-40 animate-pulse rounded-forge-sm bg-forgeSurface-sunken" />
          <div className="h-[120px] animate-pulse rounded-forge-lg bg-forgeSurface-sunken" />
          <div className="h-[120px] animate-pulse rounded-forge-lg bg-forgeSurface-sunken" />
        </div>
      ))}
    </div>
  );
}

function TaskLauncherError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const m = useLegalHomeMessages();
  return (
    <div className="rounded-forge-lg border border-forgeInk-200 bg-forgeSurface-card p-6 text-center">
      <p className="text-forge-md font-semibold text-forge-text">{m.error_state_title}</p>
      <p className="mt-2 text-forge-sm text-forge-text-muted">{message || m.error_state_body}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-4 rounded-forge-md bg-forgeBrand-600 px-4 py-2 text-forge-sm font-medium text-white hover:bg-forgeBrand-700"
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
    <div className="rounded-forge-lg border border-forgeInk-200 bg-forgeSurface-card p-8 text-center">
      <p className="text-forge-md font-semibold text-forge-text">{m.empty_state_title}</p>
      <p className="mt-2 text-forge-sm text-forge-text-muted">{m.empty_state_body}</p>
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
