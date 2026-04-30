"use client";

import type { ReactNode } from "react";

export function LegalEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
      <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
