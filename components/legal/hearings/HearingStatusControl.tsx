"use client";

import { useState } from "react";
import { toast } from "@/components/forge/ui/Toast";
import { usePatchHearingStatus } from "@/hooks/legal/useHearings";
import { humanizeToken } from "@/lib/legal/hearings/hearings-format";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";

/**
 * Inline status changer → PATCH /api/v1/legal/hearings/{hearing_id}/status.
 * The backend validates transitions; on 409/422 we surface its message verbatim
 * (we do NOT assume which transitions are legal in the frontend).
 */
type Props = {
  tenantId: string;
  hearing: HearingOut;
  statuses: string[];
  /** Cosmetic gating; backend 403 remains the authority. */
  disabled?: boolean;
};

export function HearingStatusControl({ tenantId, hearing, statuses, disabled }: Props) {
  const { mutateAsync, isPending } = usePatchHearingStatus(tenantId);
  const [value, setValue] = useState(hearing.status);

  const options = statuses.length ? statuses : [hearing.status];

  const onSelect = async (next: string) => {
    if (next === hearing.status) return;
    const previous = value;
    setValue(next);
    try {
      await mutateAsync({ hearingId: hearing.id, body: { status: next } });
      toast.success("Estado actualizado.");
    } catch (e: unknown) {
      setValue(previous);
      const msg = e instanceof Error ? e.message : "No se pudo cambiar el estado.";
      toast.error(msg);
    }
  };

  return (
    <label className="sr-only-label inline-flex items-center gap-2">
      <span className="sr-only">Cambiar estado de {hearing.title}</span>
      <select
        className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
        value={value}
        disabled={disabled || isPending}
        aria-label={`Cambiar estado de ${hearing.title}`}
        onChange={(e) => void onSelect(e.target.value)}
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {humanizeToken(s)}
          </option>
        ))}
      </select>
    </label>
  );
}
