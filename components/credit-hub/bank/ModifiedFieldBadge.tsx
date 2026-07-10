"use client";

export function ModifiedFieldBadge() {
  return (
    <span
      className="ml-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ color: "var(--ch-warning-text)", background: "var(--ch-warning-soft)" }}
      data-testid="modified-field-badge"
    >
      Modificado
    </span>
  );
}

export function FieldWithModifiedBadge({ label, value, modified }: { label: string; value: string; modified?: boolean }) {
  return (
    <div>
      <div className="ch-eyebrow">{label}</div>
      <div className="ch-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
        {value}
        {modified ? <ModifiedFieldBadge /> : null}
      </div>
    </div>
  );
}
