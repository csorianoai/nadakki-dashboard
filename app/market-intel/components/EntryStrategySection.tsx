"use client";

interface EntryStrategySectionProps {
  entryStrategy?: Record<string, unknown>;
}

function renderValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map((v) => renderValue(v)).join(", ");
  return JSON.stringify(value);
}

export function EntryStrategySection({ entryStrategy }: EntryStrategySectionProps) {
  if (!entryStrategy || Object.keys(entryStrategy).length === 0) return null;

  const entries = Object.entries(entryStrategy).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return null;

  return (
    <section
      className="rounded-forge-lg border border-[var(--mee-accent)]/25 bg-[var(--mee-accent-soft)]/40 p-4 shadow-forge-xs"
      aria-labelledby="entry-strategy-title"
    >
      <h3 id="entry-strategy-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Estrategia de entrada
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-forge-md border border-forgeGray-200/80 bg-white/80 px-3 py-2">
            <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="mt-1 text-forge-sm text-forgeGray-800">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
