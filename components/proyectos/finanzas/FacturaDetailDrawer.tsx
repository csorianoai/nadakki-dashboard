"use client";

import { Drawer, Button } from "@/components/forge";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { FinanzasStatusBadge } from "@/components/proyectos/finanzas/StatusBadge";
import { FacturaApprovalActions } from "@/components/proyectos/finanzas/FacturaApprovalActions";
import type { Factura } from "@/types/finanzas";

export function FacturaDetailDrawer({
  factura,
  open,
  onClose,
  onUpdated,
}: {
  factura: Factura | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  if (!factura) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={factura.numero_factura}
      description={factura.contratista_nombre}
      footer={
        <div className="flex flex-wrap gap-2">
          <FacturaApprovalActions factura={factura} onUpdated={onUpdated} />
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <dl className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <FinanzasStatusBadge status={factura.validation_status} />
          <FinanzasStatusBadge status={factura.payment_status} />
        </div>
        <div>
          <dt className="text-zinc-500">Monto total</dt>
          <dd className="mt-1"><AmountDisplay amount={factura.monto_total_usd} emphasize /></dd>
        </div>
        <div>
          <dt className="text-zinc-500">Saldo pendiente</dt>
          <dd className="mt-1"><AmountDisplay amount={factura.saldo_pendiente_usd} /></dd>
        </div>
        {factura.validation_reason_codes.length ? (
          <div>
            <dt className="text-zinc-500">Códigos de validación</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {factura.validation_reason_codes.map((c) => (
                <span key={c} className="rounded bg-orange-500/15 px-2 py-0.5 text-xs text-orange-200">
                  {c.replace(/_/g, " ")}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="mb-2 text-zinc-500">Líneas</dt>
          <dd>
            <ul className="space-y-2">
              {factura.line_items.map((li) => (
                <li key={li.id} className="rounded border border-white/10 px-3 py-2">
                  <p className="font-medium text-zinc-100">{li.description}</p>
                  <p className="text-xs text-zinc-500">
                    {li.quantity} × <AmountDisplay amount={li.unit_price_usd} className="inline text-xs" />
                  </p>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </Drawer>
  );
}
