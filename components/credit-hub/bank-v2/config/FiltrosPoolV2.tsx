"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { apiFetch } from "@/lib/api/fetch-client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { MarcaDcc } from "@/lib/dcc/marca";

type Config = Record<string, unknown>;
const RUTA = "/api/v2/credit/pool-filters";
const CAMPO = "h-9 w-full rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-3 text-sm";
const lista = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
const texto = (v: unknown) => (Array.isArray(v) ? v.map(String).join(", ") : typeof v === "number" || typeof v === "string" ? String(v) : "");

/** La misma configuracion que arma la pantalla actual a partir del formulario. */
export function configDesdeFormulario(form: FormData): Config {
  const c: Config = {};
  const v = (k: string) => String(form.get(k) ?? "").trim();
  if (v("vehicle_year_min")) c.vehicle_year_min = Number.parseInt(v("vehicle_year_min"), 10);
  if (v("vehicle_year_max")) c.vehicle_year_max = Number.parseInt(v("vehicle_year_max"), 10);
  if (v("vehicle_condition")) c.vehicle_condition = v("vehicle_condition");
  if (v("amount_min")) c.amount_min = Number.parseFloat(v("amount_min"));
  if (v("amount_max")) c.amount_max = Number.parseFloat(v("amount_max"));
  if (v("term_months_max")) c.term_months_max = Number.parseInt(v("term_months_max"), 10);
  for (const k of ["vehicle_makes_include", "vehicle_makes_exclude", "provinces_include", "provinces_exclude"]) {
    const l = lista(v(k));
    if (l.length) c[k] = l;
  }
  return c;
}

/**
 * Filtros de pool (bank-v2). Las mismas tres llamadas que /credit/pool-filters
 * (GET, PUT con { filter_config } y DELETE), con apiFetch y la cabecera de
 * tenant. Errores en llano; el codigo del prestamista solo en el tooltip.
 */
export function FiltrosPoolV2({ marca }: { marca: MarcaDcc }) {
  const { apiTenantId } = useTenant();
  const [estado, setEstado] = useState<"cargando" | "error" | "listo">("cargando");
  const [config, setConfig] = useState<Config>({});
  const [prestamista, setPrestamista] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const moneda = marca.formato.currency;

  const llamar = async (method: "GET" | "PUT" | "DELETE", body?: Config) => {
    const res = await apiFetch(RUTA, {
      method,
      headers: { Accept: "application/json", "X-Tenant-ID": apiTenantId!, ...(body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store",
      ...(body ? { body: JSON.stringify({ filter_config: body }) } : {}),
    });
    const t = await res.text();
    if (!res.ok) throw new Error(String(res.status));
    const data = (t ? JSON.parse(t) : {}) as { lender_code?: string; filter_config?: Config };
    setConfig(data.filter_config ?? {});
    if (data.lender_code) setPrestamista(data.lender_code);
  };

  const cargar = async () => {
    setEstado("cargando");
    try {
      await llamar("GET");
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  };
  useEffect(() => {
    if (apiTenantId) void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiTenantId]);

  const accion = async (method: "PUT" | "DELETE", body?: Config) => {
    setOcupado(true);
    setAviso(null);
    try {
      await llamar(method, body);
      setAviso(method === "PUT" ? "Filtros guardados." : "Se quitaron todos los filtros: el pool vuelve a estar completo.");
    } catch {
      setAviso("No pudimos guardar el cambio. Vuelve a intentarlo.");
    } finally {
      setOcupado(false);
      setConfirmar(false);
    }
  };

  const guardar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void accion("PUT", configDesdeFormulario(new FormData(e.currentTarget)));
  };

  const campo = (name: string, etiqueta: string, tipo: "number" | "text" = "text", ayuda?: string) => (
    <label className="grid gap-1 text-sm">
      {etiqueta}
      <input name={name} type={tipo} defaultValue={texto(config[name])} placeholder={ayuda} className={CAMPO} />
    </label>
  );

  return (
    <DccPageMarco titulo="Filtros de pool" marca={marca}>
      <DccSeccion titulo="Qué solicitudes recibe tu institución" icono={SlidersHorizontal} meta={prestamista ? "configuración de tu institución" : null}>
        {estado === "error" ? (
          <DccEstado estado="error" detalle="No pudimos cargar los filtros" onReintentar={() => void cargar()} />
        ) : estado === "cargando" ? (
          <DccEstado estado="cargando" />
        ) : (
          <form key={JSON.stringify(config)} onSubmit={guardar} className="grid gap-5" title={prestamista ?? undefined}>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className={`mb-2 text-xs font-semibold uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>Vehículo</legend>
              {campo("vehicle_year_min", "Año mínimo", "number", "2020")}
              {campo("vehicle_year_max", "Año máximo", "number", "2026")}
              <label className="grid gap-1 text-sm">
                Condición
                <select name="vehicle_condition" defaultValue={texto(config.vehicle_condition)} className={CAMPO}>
                  <option value="">Cualquiera</option>
                  <option value="new">Nuevo</option>
                  <option value="used">Usado</option>
                </select>
              </label>
              {campo("vehicle_makes_include", "Marcas incluidas (separadas por coma)", "text", "Toyota, Honda")}
              {campo("vehicle_makes_exclude", "Marcas excluidas (separadas por coma)", "text", "Kia")}
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className={`mb-2 text-xs font-semibold uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>Zona y monto</legend>
              {campo("provinces_include", "Provincias incluidas (separadas por coma)", "text", "Santiago, Santo Domingo")}
              {campo("provinces_exclude", "Provincias excluidas (separadas por coma)", "text", "Barahona")}
              {campo("amount_min", `Monto mínimo${moneda ? ` (${moneda})` : ""}`, "number", "300000")}
              {campo("amount_max", `Monto máximo${moneda ? ` (${moneda})` : ""}`, "number", "5000000")}
              {campo("term_months_max", "Plazo máximo (meses)", "number", "72")}
            </fieldset>
            {aviso ? (
              <p role="status" className={`text-sm ${DCC_CLASSES.muted}`}>
                {aviso}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={ocupado} className={DCC_CLASSES.actionButton}>
                Guardar filtros
              </button>
              {confirmar ? (
                <>
                  <span className="self-center text-sm text-[var(--dcc-error-fg)]">¿Quitar todos los filtros?</span>
                  <button type="button" disabled={ocupado} onClick={() => void accion("DELETE")} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--dcc-error-fg)] bg-[var(--dcc-surface)] px-3 text-sm font-semibold text-[var(--dcc-error-fg)] hover:bg-[var(--dcc-error-bg)] focus-visible:outline-none focus-visible:shadow-[var(--dcc-focus)]">
                    Sí, quitar
                  </button>
                  <button type="button" onClick={() => setConfirmar(false)} className={DCC_CLASSES.quietButton}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmar(true)} className={DCC_CLASSES.quietButton}>
                  Restablecer pool completo
                </button>
              )}
            </div>
          </form>
        )}
      </DccSeccion>
    </DccPageMarco>
  );
}
