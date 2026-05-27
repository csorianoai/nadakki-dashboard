import {
  CheckCircle2,
  FileText,
  HandCoins,
  Receipt,
  RotateCcw,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import type { EconomicEvent } from "@/types/finanzas";

const EVENT_ICON: Record<string, ReactNode> = {
  QUOTE_APPROVED: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  QUOTE_REJECTED: <XCircle className="h-4 w-4 text-rose-400" />,
  PO_ISSUED: <ShoppingCart className="h-4 w-4 text-sky-400" />,
  PO_CANCELLED: <XCircle className="h-4 w-4 text-rose-400" />,
  PO_CLOSED: <CheckCircle2 className="h-4 w-4 text-zinc-400" />,
  INVOICE_VALIDATED: <FileText className="h-4 w-4 text-amber-400" />,
  INVOICE_APPROVED: <Receipt className="h-4 w-4 text-emerald-400" />,
  INVOICE_REJECTED: <XCircle className="h-4 w-4 text-rose-400" />,
  PAYMENT_REGISTERED: <HandCoins className="h-4 w-4 text-emerald-400" />,
  PAYMENT_CONFIRMED: <HandCoins className="h-4 w-4 text-emerald-400" />,
  PAYMENT_REVERSED: <RotateCcw className="h-4 w-4 text-zinc-400" />,
  DEAL_CLOSED: <CheckCircle2 className="h-4 w-4 text-zinc-400" />,
};

export function EconomicEventsTimeline({
  events,
  compact = false,
}: {
  events: EconomicEvent[];
  compact?: boolean;
}) {
  if (!events.length) {
    return <p className="text-sm text-zinc-500">Sin eventos económicos registrados.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((evt) => (
        <li key={evt.id} className="relative flex gap-3 pl-1">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            {EVENT_ICON[evt.event_type] ?? <FileText className="h-4 w-4 text-zinc-400" />}
          </div>
          <div className="min-w-0 flex-1 border-b border-white/5 pb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-zinc-100">{evt.description}</p>
              <AmountDisplay amount={evt.amount_usd} className="text-xs" />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              {evt.event_type.replace(/_/g, " ")} · {new Date(evt.occurred_at).toLocaleString("es-DO")}
              {!compact && evt.actor_id ? ` · ${evt.actor_id}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
