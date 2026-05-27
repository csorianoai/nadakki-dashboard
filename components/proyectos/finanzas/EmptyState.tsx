import type { ReactNode } from "react";
import { Button } from "@/components/forge";

export function FinanzasEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 px-6 py-14 text-center">
      {icon ? <div className="text-amber-300">{icon}</div> : null}
      <div>
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction} className="min-h-11">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
