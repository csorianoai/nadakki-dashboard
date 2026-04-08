"use client";

import { formatDOP, formatPercentDecimal } from "@/lib/credit-format";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export interface OfferComparisonTableProps {
  offers: Record<string, unknown>[] | null | undefined;
  bestOfferId?: string | null;
  emptyMessage?: string;
  className?: string;
  /** Si se define, muestra botón por fila para descargar PDF de la oferta (fetch + blob + X-Tenant-ID en el cliente). */
  onDownloadOfferPdf?: (offerId: string) => void | Promise<void>;
  pdfLoadingOfferId?: string | null;
}

export function OfferComparisonTable({
  offers,
  bestOfferId,
  emptyMessage = "Sin ofertas aún",
  className,
  onDownloadOfferPdf,
  pdfLoadingOfferId,
}: OfferComparisonTableProps) {
  const list = Array.isArray(offers) ? offers : [];

  if (list.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-slate-500",
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 overflow-hidden",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-xs uppercase text-slate-500">
              <th className="px-3 py-2 w-8" />
              <th className="px-3 py-2">Entidad</th>
              <th className="px-3 py-2">TEA (anual)</th>
              <th className="px-3 py-2">Plazo</th>
              <th className="px-3 py-2">Cuota</th>
              <th className="px-3 py-2">Estado</th>
              {onDownloadOfferPdf && (
                <th className="px-3 py-2 whitespace-nowrap">PDF</th>
              )}
            </tr>
          </thead>
          <tbody>
            {list.map((o, i) => {
              const oid = String(o.offer_id ?? i);
              const isBest = bestOfferId && oid === bestOfferId;
              return (
                <tr
                  key={oid}
                  className={cn(
                    "border-b border-white/5",
                    isBest && "bg-emerald-500/10"
                  )}
                >
                  <td className="px-3 py-2">
                    {isBest && (
                      <Star
                        className="h-4 w-4 text-amber-400 fill-amber-400"
                        aria-label="Mejor oferta"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-100">
                    {String(o.lender_name ?? "—")}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPercentDecimal(
                      o.apr_annual != null ? Number(o.apr_annual) : null
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {o.term_months != null ? `${o.term_months} m` : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatDOP(
                      o.monthly_payment != null
                        ? Number(o.monthly_payment)
                        : null
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
                      {String(o.status ?? "—")}
                    </span>
                  </td>
                  {onDownloadOfferPdf && (
                    <td className="px-3 py-2">
                      {o.offer_id != null && String(o.offer_id) !== "" ? (
                        <button
                          type="button"
                          onClick={() =>
                            onDownloadOfferPdf(String(o.offer_id))
                          }
                          disabled={
                            pdfLoadingOfferId === String(o.offer_id)
                          }
                          className="text-xs text-violet-300 hover:underline disabled:opacity-40"
                        >
                          {pdfLoadingOfferId === String(o.offer_id)
                            ? "…"
                            : "Descargar"}
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
