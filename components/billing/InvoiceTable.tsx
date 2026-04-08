"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  FileDown,
  Receipt,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import {
  BillingApiError,
  downloadInvoicePdf,
  getInvoices,
  type BillingInvoice,
} from "@/lib/api/billing";

function formatMoney(
  cents: number | null | undefined,
  currency: string | null | undefined
): string {
  if (cents == null || Number.isNaN(cents)) return "—";
  const cur = (currency ?? "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency: cur.length === 3 ? cur : "USD",
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${cur}`;
  }
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const t = Date.parse(s);
  if (Number.isNaN(t)) return s;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
    new Date(t)
  );
}

export interface InvoiceTableProps {
  tenantId: string | null;
  refreshKey?: number;
}

export default function InvoiceTable({
  tenantId,
  refreshKey = 0,
}: InvoiceTableProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<BillingInvoice[]>([]);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const tid = tenantId?.trim() ?? "";
    if (!tid) {
      setLoading(false);
      setRows([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getInvoices(tid);
      setRows(list);
    } catch {
      setError("Error de red al cargar facturas.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function onDownload(row: BillingInvoice) {
    const tid = tenantId?.trim() ?? "";
    if (!tid) return;
    setPdfBusyId(row.id);
    setError(null);
    try {
      if (row.invoice_pdf && row.invoice_pdf.startsWith("http")) {
        window.open(row.invoice_pdf, "_blank", "noopener,noreferrer");
        return;
      }
      await downloadInvoicePdf(row.id, tid);
    } catch (e) {
      const msg =
        e instanceof BillingApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "No se pudo descargar el PDF.";
      setError(msg);
    } finally {
      setPdfBusyId(null);
    }
  }

  if (!tenantId?.trim()) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Receipt className="w-5 h-5 text-gray-400" />
        <h2 className="text-xl font-semibold text-white m-0">Facturas</h2>
      </div>

      {error ? (
        <GlassCard className="p-4 border-amber-500/25 bg-amber-500/10">
          <p className="text-amber-100 text-sm m-0 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        </GlassCard>
      ) : null}

      <GlassCard className="border-white/10 overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando facturas…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 px-6 text-center text-gray-400 text-sm">
            No hay facturas visibles todavía. Tras pagos exitosos en Stripe,
            aparecerán aquí cuando el API las exponga.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b border-white/10 text-gray-400 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Factura</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Importe</th>
                  <th className="px-4 py-3 font-medium text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-200">
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.number ?? row.id.slice(0, 12)}
                    </td>
                    <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 capitalize">
                      {row.status ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(
                        row.amount_paid != null
                          ? row.amount_paid
                          : row.amount_due,
                        row.currency
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={pdfBusyId === row.id}
                        onClick={() => void onDownload(row)}
                        className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-medium disabled:opacity-50"
                      >
                        {pdfBusyId === row.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileDown className="w-3.5 h-3.5" />
                        )}
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
