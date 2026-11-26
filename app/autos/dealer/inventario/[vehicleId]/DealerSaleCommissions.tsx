"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  commissionErrorMessage,
  listDealerSaleCommissions,
  listDealerSalespeople,
  type DealerSalesperson,
  paySaleCommission,
  registerSaleCommission,
  type DealerSaleCommissions as DealerSaleCommissionsData,
  type SaleCommissionCashAccount,
} from "@/lib/dealer-management/vehicle-sale";
import { fetchVehicleMargins } from "@/lib/dealer/vehicle-economics";
import { normalizaImporte } from "@/lib/dealer-management/vehicle-manual";
import { avisarProgreso } from "@/lib/dealer/pasos-tarea";

const FIELD = "mt-1 min-h-11 w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function amountForDisplay(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    : value;
}

export function DealerSaleCommissions({
  vehicleId,
  dealerId,
  tenantId,
  currency,
  timeZone,
}: {
  vehicleId: string;
  dealerId: string;
  tenantId: string;
  currency?: string | null;
  timeZone?: string;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<DealerSaleCommissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [salespersonId, setSalespersonId] = useState("");
  const [amount, setAmount] = useState("");
  const [commissionCurrency, setCommissionCurrency] = useState(currency ?? "");
  const [salespeople, setSalespeople] = useState<DealerSalesperson[]>([]);
  const [peopleReady, setPeopleReady] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const sellerEmail = (id: string) => salespeople.find((person) => person.user_id === id)?.email ?? "Vendedor no asignado";

  useEffect(() => {
    let active = true;
    setPeopleReady(false);
    setPeopleError("");
    setSalespeople([]);
    setSalespersonId("");
    setCommissionCurrency("");
    if (!dealerId || !tenantId || !vehicleId) return;
    void Promise.all([
      listDealerSalespeople(tenantId, dealerId),
      currency ? Promise.resolve(currency) : fetchVehicleMargins(vehicleId, tenantId).then((rows) => {
        const currencies = [...new Set(rows.map((row) => row.currency))];
        if (currencies.length !== 1) throw new Error("Moneda de venta desconocida");
        return currencies[0];
      }),
    ]).then(([people, saleCurrency]) => {
      if (!active) return;
      setSalespeople(people);
      setCommissionCurrency(saleCurrency);
      setPeopleReady(true);
    }).catch(() => {
      if (active) setPeopleError("No se pudieron consultar los vendedores o la moneda de la venta. Revisa tus permisos y los datos del concesionario antes de registrar.");
    });
    return () => { active = false; };
  }, [dealerId, tenantId, vehicleId, currency]);
  const [registering, setRegistering] = useState(false);
  const [cashAccounts, setCashAccounts] = useState<Record<string, SaleCommissionCashAccount | "">>({});
  const [payingId, setPayingId] = useState("");
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});

  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const refresh = useCallback(async () => {
    setLoading(true);
    setListError("");
    if (!tenantId || !dealerId) {
      setData(null);
      setListError("No se pudo identificar el concesionario para consultar las comisiones.");
      setLoading(false);
      return;
    }
    try {
      const result = await listDealerSaleCommissions(tenantId, dealerId, month, zone);
      setData(result);
    } catch (error) {
      setData(null);
      setListError(commissionErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [dealerId, month, tenantId, zone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    if (!peopleReady || !salespeople.some((person) => person.user_id === salespersonId)) {
      setFormError("Elige un vendedor de la lista de correos.");
      return;
    }
    const parsedAmount = normalizaImporte(amount);
    if (!parsedAmount) {
      setFormError("El importe debe ser mayor que cero.");
      return;
    }
    const currencyCode = commissionCurrency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      setFormError("No se pudo determinar la moneda de la venta.");
      return;
    }
    setRegistering(true);
    try {
      await registerSaleCommission(tenantId, vehicleId, {
        salesperson_user_id: salespersonId.trim(),
        amount: parsedAmount,
        currency: currencyCode,
      });
      setSalespersonId("");
      setAmount("");
      setSuccess("Comisión registrada y pendiente de pago.");
      avisarProgreso("comision");
      // La venta puede ser de un mes anterior al filtro actual: muestra el registro recién creado.
      setMonth("");
    } catch (error) {
      setFormError(commissionErrorMessage(error));
    } finally {
      setRegistering(false);
    }
  }

  async function pay(itemId: string) {
    const cashAccount = cashAccounts[itemId];
    if (!cashAccount) {
      setPayErrors((current) => ({ ...current, [itemId]: "Elige efectivo o banco antes de pagar." }));
      return;
    }
    setPayErrors((current) => ({ ...current, [itemId]: "" }));
    setPayingId(itemId);
    try {
      await paySaleCommission(tenantId, itemId, cashAccount);
      setSuccess("Comisión pagada.");
      await refresh();
    } catch (error) {
      setPayErrors((current) => ({ ...current, [itemId]: commissionErrorMessage(error) }));
    } finally {
      setPayingId("");
    }
  }

  return (
    <section data-testid="dealer-sale-commissions" className="space-y-4 rounded-r-sm border border-nk-border bg-nk-surface p-4">
      <div>
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Comisiones de venta</h2>
        <p className="text-sm text-nk-fg-muted">Registra el importe acordado y paga cada comisión desde la cuenta correspondiente.</p>
      </div>

      <form onSubmit={(event) => void submitCommission(event)} className="grid gap-3 md:grid-cols-4" data-testid="sale-commission-form">
        <label className="text-sm text-nk-fg">
          Vendedor
          <select className={FIELD} value={salespersonId} onChange={(event) => setSalespersonId(event.target.value)} required disabled={!peopleReady}>
            <option value="">Selecciona el correo del vendedor</option>
            {salespeople.map((person) => <option key={person.user_id} value={person.user_id}>{person.email}</option>)}
          </select>
        </label>
        <label className="text-sm text-nk-fg">
          Importe de la comisión
          <input className={FIELD} inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        <label className="text-sm text-nk-fg">
          Moneda de la venta
          <input className={FIELD} value={commissionCurrency} readOnly />
        </label>
        <div className="flex items-end">
          <button type="submit" disabled={registering || !peopleReady || !commissionCurrency} className="min-h-11 w-full rounded-full bg-brand-2 px-4 text-sm font-semibold text-white">
            {registering ? "Registrando…" : "Registrar comisión"}
          </button>
        </div>
      </form>
      {peopleError ? <p role="alert">{peopleError}</p> : null}
      {formError ? <p role="alert" data-testid="sale-commission-register-error" className="text-sm text-nk-fg">{formError}</p> : null}
      {success ? <p role="status" data-testid="sale-commission-success" className="text-sm text-nk-fg">{success}</p> : null}

      <div className="max-w-xs">
        <label className="text-sm text-nk-fg">
          Mes de la venta (vacío: todos)
          <input aria-label="Mes de la venta" type="month" className={FIELD} value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
      </div>
      {loading ? <p className="animate-pulse text-sm text-nk-fg-muted">Cargando comisiones…</p> : null}
      {listError ? <p role="alert" data-testid="sale-commission-list-error" className="text-sm text-nk-fg">{listError}</p> : null}

      {data && !loading ? (
        <>
          <div data-testid="sale-commission-summary">
            <h3 className="text-sm font-semibold text-nk-fg">Resumen del concesionario por vendedor y mes</h3>
            {data.summary.length ? (
              <ul className="mt-2 space-y-1 text-sm text-nk-fg">
                {data.summary.map((row) => (
                  <li key={`${row.salesperson_user_id}-${row.month}-${row.currency}`} className="break-words">
                    {sellerEmail(row.salesperson_user_id)} · {row.month} · Pendiente {amountForDisplay(row.pending_amount)} {row.currency} · Pagado {amountForDisplay(row.paid_amount)} {row.currency}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1 text-sm text-nk-fg-muted">No hay comisiones registradas para este mes.</p>}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-nk-fg">Detalle de comisiones del concesionario</h3>
            {data.items.length ? (
              <ul className="mt-2 space-y-3">
                {data.items.map((item) => (
                  <li key={item.id} className="space-y-2 rounded-r-sm border border-nk-border p-3 text-sm text-nk-fg" data-testid={`sale-commission-${item.id}`}>
                    <p className="break-words">{sellerEmail(item.salesperson_user_id)} · {item.month} · {item.amount} {item.currency} · {item.status === "paid" ? "Pagada" : "Pendiente"}</p>
                    {item.status === "pending" ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <label className="flex-1 text-sm">
                          Medio de pago
                          <select
                            aria-label={`Medio de pago de ${sellerEmail(item.salesperson_user_id)}`}
                            required
                            className={FIELD}
                            value={cashAccounts[item.id] ?? ""}
                            onChange={(event) => setCashAccounts((current) => ({ ...current, [item.id]: event.target.value as SaleCommissionCashAccount | "" }))}
                          >
                            <option value="">Selecciona una cuenta</option>
                            <option value="cash">Efectivo</option>
                            <option value="bank">Banco</option>
                          </select>
                        </label>
                        <button type="button" disabled={payingId === item.id} onClick={() => void pay(item.id)} className="min-h-11 self-end rounded-full border border-brand-2 px-4 text-sm font-semibold text-nk-fg">
                          {payingId === item.id ? "Pagando…" : "Pagar comisión"}
                        </button>
                      </div>
                    ) : null}
                    {payErrors[item.id] ? <p role="alert" data-testid={`sale-commission-pay-error-${item.id}`} className="text-sm">{payErrors[item.id]}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
