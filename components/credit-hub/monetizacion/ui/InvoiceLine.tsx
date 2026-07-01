"use client";

type Props = {
  label: string;
  count: number;
  note: string;
  amount: string;
  onDrill?: () => void;
};

export function InvoiceLine({ label, count, note, amount, onDrill }: Props) {
  return (
    <button type="button" className="fm-ui-invoice-line" onClick={onDrill}>
      <span>
        <div className="fm-ui-invoice-line-label">{label}</div>
        <span className="fm-ui-invoice-line-chip">{count} eventos ›</span>
        <div className="fm-ui-invoice-line-note">{note}</div>
      </span>
      <span className="fm-ui-invoice-line-amount">{amount}</span>
    </button>
  );
}
