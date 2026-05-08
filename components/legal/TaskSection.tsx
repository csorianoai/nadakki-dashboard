"use client";

import { TaskCard } from "@/components/legal/TaskCard";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useTenant } from "@/contexts/TenantContext";
import type { LegalTask } from "@/lib/legal/task-types";
import { tenantSatisfiesTaskFeatures } from "@/lib/legal/task-tenant-features";

type Props = {
  title: string;
  icon: string;
  headerBarClass: string;
  cardLeftBorderClass: string;
  tasks: LegalTask[];
};

export function TaskSection({ title, icon, headerBarClass, cardLeftBorderClass, tasks }: Props) {
  const { isFeatureEnabled } = useTenant();
  const m = useLegalHomeMessages();
  const slug = title.replace(/\s+/g, "-");

  return (
    <section aria-labelledby={`section-${slug}`} className="flex flex-col gap-3">
      <div className={`flex items-center gap-2 border-b-2 pb-2 ${headerBarClass}`}>
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <h2 id={`section-${slug}`} className="text-forge-md font-semibold text-forge-text">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="text-forge-sm text-forge-text-muted">—</p>
        ) : (
          tasks.map((task) => {
            const enabled = tenantSatisfiesTaskFeatures(task, isFeatureEnabled);
            return (
              <TaskCard
                key={task.task_id}
                task={task}
                accentClass={cardLeftBorderClass}
                enabled={enabled}
                lockedMessage={m.plan_locked_tooltip}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
