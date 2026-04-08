"use client";

export interface ScoreGaugeProps {
  score: number | null | undefined;
  className?: string;
}

/** Verde &gt; 700, amarillo 500–700, rojo &lt; 500 */
export function ScoreGauge({ score, className = "" }: ScoreGaugeProps) {
  if (score == null || Number.isNaN(Number(score))) {
    return (
      <div
        className={`rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-400 text-sm ${className}`}
      >
        Sin puntaje disponible
      </div>
    );
  }
  const s = Number(score);
  const clamped = Math.max(0, Math.min(1000, s));
  const pct = (clamped / 1000) * 100;
  let color = "from-red-500 to-red-700";
  let label = "Riesgo elevado";
  if (s > 700) {
    color = "from-emerald-500 to-teal-600";
    label = "Perfil favorable";
  } else if (s >= 500) {
    color = "from-amber-400 to-orange-500";
    label = "Revisión sugerida";
  }

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-6 ${className}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        Puntaje motor (0–1000)
      </p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-semibold text-slate-50 tabular-nums">
          {s.toFixed(1)}
        </span>
        <span className="text-sm text-slate-400 mb-1">{label}</span>
      </div>
      <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
