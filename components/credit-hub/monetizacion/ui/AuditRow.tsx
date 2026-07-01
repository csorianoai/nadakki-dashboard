"use client";

type Props = {
  type: string;
  id: string;
  detail: string;
  hash: string;
  amount: string;
};

export function AuditRow({ type, id, detail, hash, amount }: Props) {
  return (
    <div className="fm-ui-audit-row">
      <span className="fm-ui-tape-tag">{type}</span>
      <span>
        <span className="fm-mono">{id}</span>
        <span style={{ color: "var(--fm-ink-soft)", marginLeft: 6 }}>{detail}</span>
      </span>
      <span className="fm-ui-audit-hash">{hash}</span>
      <span className="fm-mono" style={{ color: "var(--fm-ink)" }}>
        {amount}
      </span>
    </div>
  );
}
