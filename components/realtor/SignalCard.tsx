import type { RadarSignal } from "@/lib/realtor/types";
import { StatusBadge } from "./StatusBadge";

export function SignalCard({ signal }: { signal: RadarSignal }) {
  const max = Math.max(1, ...signal.points.map((p) => p.value));
  return (
    <article data-testid="signal-card" className="rounded border p-4" aria-label={signal.title}>
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{signal.title}</h3>
        <StatusBadge status={signal.status} />
      </header>
      <dl className="mt-2 text-sm">
        <div><dt className="inline font-medium">Tipo de señal: </dt><dd className="inline">{signal.signalType}</dd></div>
        <div><dt className="inline font-medium">Fuente: </dt><dd className="inline">{signal.source}</dd></div>
        <div><dt className="inline font-medium">Fecha: </dt><dd className="inline">{signal.asOf}</dd></div>
      </dl>
      {signal.points.length > 0 ? (
        <ul className="mt-3 space-y-1" aria-label={`Gráfico: ${signal.title} (${signal.unit})`}>
          {signal.points.map((p) => (
            <li key={p.label} className="flex items-center gap-2 text-xs">
              <span className="w-8">{p.label}</span>
              <span
                className="h-3 rounded bg-current opacity-60"
                style={{ width: `${Math.round((p.value / max) * 100)}%` }}
                role="img"
                aria-label={`${p.label}: ${p.value} ${signal.unit}`}
              />
              <span>{p.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-sm">{signal.note}</p>
    </article>
  );
}
