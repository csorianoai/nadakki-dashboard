"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";
import { useTenant } from "@/contexts/TenantContext";
import { tokenStorage } from "@/lib/auth/token-storage";
import { decodeJWT } from "@/lib/auth/jwt-decode";
import { formatEntero, formatMoneda, formatPorcentaje, LOCALE_POR_DEFECTO } from "@/lib/dcc/formato";
import ConectarGoogleAds from "@/components/google-ads/ConectarGoogleAds";

/** Rangos que acepta el backend (services/marketing_google_ads_metrics.py:9 DATE_RANGES). */
export const RANGOS: { valor: string; etiqueta: string }[] = [
  { valor: "TODAY", etiqueta: "Hoy" },
  { valor: "YESTERDAY", etiqueta: "Ayer" },
  { valor: "LAST_7_DAYS", etiqueta: "Últimos 7 días" },
  { valor: "LAST_14_DAYS", etiqueta: "Últimos 14 días" },
  { valor: "LAST_30_DAYS", etiqueta: "Últimos 30 días" },
  { valor: "THIS_MONTH", etiqueta: "Este mes" },
  { valor: "LAST_MONTH", etiqueta: "Mes pasado" },
];

interface Cuenta {
  customer_id: string;
  name: string | null;
  currency_code: string | null;
  manager: boolean | null;
  readable: boolean;
}
interface Campana {
  id: string;
  name: string | null;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
}

const MSG_LECTURA = "No pudimos leer las métricas de Google Ads ahora. Inténtalo de nuevo en unos minutos.";

const conGuiones = (id: string) => `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
const esNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Mismo locale que el costo y el CTR: una sola convención de miles/decimales en la tabla. */
const entero = (n: number) => formatEntero(n, LOCALE_POR_DEFECTO) ?? "—";
const decimal = (n: number) =>
  new Intl.NumberFormat(LOCALE_POR_DEFECTO.locale, { maximumFractionDigits: 2 }).format(n);

/** CTR calculado con las cifras recibidas; sin impresiones no hay CTR. */
function ctr(clics: number, impresiones: number): string {
  if (!(impresiones > 0)) return "—";
  // Aquí el front SÍ divide (la tarjeta exige CTR calculado con lo recibido); se reutiliza solo el formato.
  return formatPorcentaje(clics / impresiones, LOCALE_POR_DEFECTO) ?? "—";
}

/** Importe en la moneda de la cuenta; sin moneda (o inválida) no se muestra un importe ambiguo. */
function dinero(micros: number, moneda: string | null): string {
  const codigo = moneda?.trim().toUpperCase() || null;
  try {
    return formatMoneda(micros / 1_000_000, { locale: LOCALE_POR_DEFECTO.locale, currency: codigo }) ?? "—";
  } catch {
    return "—";
  }
}

function leerCampanas(body: unknown): Campana[] | null {
  const lista = (body as { data?: { campaigns?: unknown } } | null)?.data?.campaigns;
  if (!Array.isArray(lista)) return null;
  return lista.map((c: Record<string, unknown>) => ({
    id: String(c.id),
    name: typeof c.name === "string" ? c.name : null,
    impressions: esNum(c.impressions) ? c.impressions : 0,
    clicks: esNum(c.clicks) ? c.clicks : 0,
    cost_micros: esNum(c.cost_micros) ? c.cost_micros : 0,
    conversions: esNum(c.conversions) ? c.conversions : 0,
  }));
}

type EstadoCuentas =
  | { t: "loading" }
  | { t: "sin-conexion" }
  | { t: "error" }
  | { t: "ok"; cuentas: Cuenta[] };
type EstadoDatos =
  | { t: "idle" }
  | { t: "loading" }
  | { t: "sin-conexion" }
  | { t: "error"; mensaje: string }
  | { t: "ok"; filas: Campana[] };

function mensajeDeEstado(status: number): string {
  if (status === 403) return "No tienes permiso para ver las métricas de esta cuenta de Nadakki.";
  if (status === 422) return "El rango de fechas elegido no es válido.";
  return MSG_LECTURA;
}

export default function MetricasGoogleAds() {
  const { tenantId } = useTenant();
  const [cuentas, setCuentas] = useState<EstadoCuentas>({ t: "loading" });
  const [elegida, setElegida] = useState<string>("");
  const [rango, setRango] = useState("LAST_30_DAYS");
  const [datos, setDatos] = useState<EstadoDatos>({ t: "idle" });

  // Usuario de la sesión (claim `sub` del token): la cuenta recordada se guarda por tenant Y usuario.
  const userId = useMemo(() => decodeJWT(tokenStorage.getAccessToken() ?? "")?.sub ?? null, [tenantId]);
  const claveCuenta = tenantId && userId ? `nadakki_gads_cuenta:${tenantId}:${userId}` : null;

  useEffect(() => {
    if (!tenantId) return;
    let vivo = true;
    setCuentas({ t: "loading" });
    setElegida("");
    (async () => {
      try {
        const r = await apiFetch(`/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads/accounts`, {
          headers: { Accept: "application/json" },
        });
        if (!vivo) return;
        if (r.status === 409) return setCuentas({ t: "sin-conexion" });
        const body = r.ok ? await r.json().catch(() => null) : null;
        const lista = body?.data?.accounts;
        if (!Array.isArray(lista)) return setCuentas({ t: "error" });
        const elegibles = (lista as Cuenta[]).filter(
          (c) => c && c.readable === true && c.manager === false && /^\d{10}$/.test(String(c.customer_id)),
        );
        setCuentas({ t: "ok", cuentas: elegibles });
        const guardada = claveCuenta ? window.localStorage.getItem(claveCuenta) : null;
        if (elegibles.length === 1) setElegida(elegibles[0].customer_id);
        else if (guardada && elegibles.some((c) => c.customer_id === guardada)) setElegida(guardada);
      } catch {
        if (vivo) setCuentas({ t: "error" });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [tenantId, claveCuenta]);

  useEffect(() => {
    if (!tenantId || !elegida) {
      setDatos({ t: "idle" });
      return;
    }
    let vivo = true;
    setDatos({ t: "loading" });
    (async () => {
      try {
        const q = new URLSearchParams({ customer_id: elegida, date_range: rango });
        const r = await apiFetch(`/api/v1/tenants/${encodeURIComponent(tenantId)}/google-ads/metrics?${q}`, {
          headers: { Accept: "application/json" },
        });
        if (!vivo) return;
        if (r.status === 409) return setDatos({ t: "sin-conexion" });
        if (!r.ok) return setDatos({ t: "error", mensaje: mensajeDeEstado(r.status) });
        const filas = leerCampanas(await r.json().catch(() => null));
        setDatos(filas ? { t: "ok", filas } : { t: "error", mensaje: MSG_LECTURA });
      } catch {
        if (vivo) setDatos({ t: "error", mensaje: MSG_LECTURA });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [tenantId, elegida, rango]);

  const elegirCuenta = (id: string) => {
    setElegida(id);
    if (claveCuenta && id) window.localStorage.setItem(claveCuenta, id);
  };

  const lista = cuentas.t === "ok" ? cuentas.cuentas : [];
  const cuenta = lista.find((c) => c.customer_id === elegida) ?? null;
  const moneda = cuenta?.currency_code ?? null;

  if (cuentas.t === "sin-conexion" || datos.t === "sin-conexion") {
    return (
      <div className="space-y-3" data-testid="metricas-sin-conexion">
        <p className="text-sm">Conecta tu cuenta de Google Ads para ver las métricas.</p>
        <ConectarGoogleAds />
      </div>
    );
  }

  const tot = datos.t === "ok" ? datos.filas.reduce(
    (a, f) => ({
      impressions: a.impressions + f.impressions,
      clicks: a.clicks + f.clicks,
      cost_micros: a.cost_micros + f.cost_micros,
      conversions: a.conversions + f.conversions,
    }),
    { impressions: 0, clicks: 0, cost_micros: 0, conversions: 0 },
  ) : null;

  return (
    <section data-testid="metricas-google-ads" className="space-y-4">
      {cuentas.t === "loading" && <p className="text-sm text-gray-500">Cargando tus cuentas de Google Ads…</p>}
      {cuentas.t === "error" && (
        <p role="alert" className="text-sm text-red-600">{MSG_LECTURA}</p>
      )}
      {cuentas.t === "ok" && lista.length === 0 && (
        <p className="text-sm">No hay cuentas de Google Ads con datos</p>
      )}
      {cuentas.t === "ok" && lista.length > 0 && (
        <div className="flex flex-wrap items-end gap-4">
          {lista.length === 1 ? (
            <p className="text-sm">
              <strong>{lista[0].name ?? "Cuenta sin nombre"}</strong> · {conGuiones(lista[0].customer_id)}
            </p>
          ) : (
            <label className="text-sm">
              Cuenta
              <select
                className="ml-2 rounded border px-2 py-1 bg-white dark:bg-slate-800"
                value={elegida}
                onChange={(e) => elegirCuenta(e.target.value)}
              >
                <option value="">Elige una cuenta…</option>
                {lista.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {`${c.name ?? "Sin nombre"} · ${conGuiones(c.customer_id)}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm">
            Rango de fechas
            <select
              className="ml-2 rounded border px-2 py-1 bg-white dark:bg-slate-800"
              value={rango}
              onChange={(e) => setRango(e.target.value)}
            >
              {RANGOS.map((r) => (
                <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      {cuentas.t === "ok" && lista.length > 1 && !elegida && (
        <p className="text-sm">Elige una cuenta de Google Ads</p>
      )}
      {datos.t === "loading" && <p className="text-sm text-gray-500">Cargando métricas…</p>}
      {datos.t === "error" && (
        <p role="alert" className="text-sm text-red-600">{datos.mensaje}</p>
      )}
      {datos.t === "ok" && datos.filas.length === 0 && <p className="text-sm">Sin datos en este rango</p>}
      {datos.t === "ok" && tot && datos.filas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Campaña</th>
                <th className="py-2 pr-4">Impresiones</th>
                <th className="py-2 pr-4">Clics</th>
                <th className="py-2 pr-4">CTR</th>
                <th className="py-2 pr-4">Costo</th>
                <th className="py-2">Conversiones</th>
              </tr>
            </thead>
            <tbody>
              {datos.filas.map((f) => (
                <tr key={f.id} className="border-b">
                  <td className="py-2 pr-4">{f.name ?? "Sin nombre"}</td>
                  <td className="py-2 pr-4">{entero(f.impressions)}</td>
                  <td className="py-2 pr-4">{entero(f.clicks)}</td>
                  <td className="py-2 pr-4">{ctr(f.clicks, f.impressions)}</td>
                  <td className="py-2 pr-4">{dinero(f.cost_micros, moneda)}</td>
                  <td className="py-2">{decimal(f.conversions)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4">{entero(tot.impressions)}</td>
                <td className="py-2 pr-4">{entero(tot.clicks)}</td>
                <td className="py-2 pr-4">{ctr(tot.clicks, tot.impressions)}</td>
                <td className="py-2 pr-4">{dinero(tot.cost_micros, moneda)}</td>
                <td className="py-2">{decimal(tot.conversions)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
