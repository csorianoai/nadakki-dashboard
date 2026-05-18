"use client";

type UploadProgressProps = {
  percent: number;
  onCancel?: () => void;
  label?: string;
};

export function UploadProgress({ percent, onCancel, label }: UploadProgressProps) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {label ? <p className="text-center text-slate-700">{label}</p> : null}
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuenow={pct}
        aria-valuemax={100}
      >
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] w-full rounded-lg border border-slate-300 py-3 text-sm font-medium text-slate-800"
        >
          Cancelar envío
        </button>
      ) : null}
    </div>
  );
}
