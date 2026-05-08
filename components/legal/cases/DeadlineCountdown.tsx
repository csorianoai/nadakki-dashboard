"use client";

import { useDeadlineCountdown } from "@/hooks/legal/useDeadlineCountdown";
import { cn } from "@/lib/utils";

type Props = {
  effectiveDeadlineDate?: string;
  status?: string;
  mutedLabel?: string;
  pulseWhenUrgent?: boolean;
  extraUrgent?: boolean;
  className?: string;
};

export function DeadlineCountdown({
  effectiveDeadlineDate,
  status,
  mutedLabel = "Sin plazo activo",
  pulseWhenUrgent = true,
  extraUrgent,
  className,
}: Props) {
  const part = useDeadlineCountdown(effectiveDeadlineDate, status);

  if (!part) {
    return (
      <p className={cn("text-xs tabular-nums text-zinc-500", className)} role="status">
        {mutedLabel}
      </p>
    );
  }

  const urgentByPriority = Boolean(extraUrgent && part.days !== null && part.days >= 0 && part.days < 3);
  const text = cn(part.textClass, pulseWhenUrgent && urgentByPriority ? "animate-pulse" : null);

  return (
    <p className={cn("max-w-[9rem] text-xs tracking-tight", text, className)} role="status">
      <span className="block truncate">{part.label}</span>
      {effectiveDeadlineDate ? (
        <time dateTime={`${effectiveDeadlineDate}T12:00:00`} className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-zinc-500 tabular-nums">
          {new Date(`${effectiveDeadlineDate}T12:00:00`).toLocaleDateString("es-DO")}
        </time>
      ) : null}
    </p>
  );
}
