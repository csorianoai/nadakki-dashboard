"use client";

type Props = {
  subtotal: string;
  itbis: string;
  total: string;
};

export function InvoiceTotals({ subtotal, itbis, total }: Props) {
  return (
    <div className="fm-ui-invoice-totals">
      <div className="fm-ui-invoice-total-row">
        <span>Subtotal</span>
        <span className="fm-mono">{subtotal}</span>
      </div>
      <div className="fm-ui-invoice-total-row">
        <span>ITBIS 18%</span>
        <span className="fm-mono">{itbis}</span>
      </div>
      <div className="fm-ui-invoice-total-row fm-ui-invoice-total-row--grand">
        <span>Total a pagar</span>
        <span>{total}</span>
      </div>
    </div>
  );
}
