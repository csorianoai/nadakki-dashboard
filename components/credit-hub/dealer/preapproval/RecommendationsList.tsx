"use client";

interface Props {
  items: string[];
  heading: string;
}

export function RecommendationsList({ items, heading }: Props) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-forge-border bg-forge-surface-elevated/40 p-4">
      <h3 className="mb-2 text-sm font-semibold text-forge-text">{heading}</h3>
      <ul className="space-y-2 text-sm text-forge-text-muted">
        {items.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-forge-primary">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
