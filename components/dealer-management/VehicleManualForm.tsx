"use client";

/**
 * Formulario de alta manual de vehiculo.
 *
 * Precio, referencia, dominio y n.o de stock se escriben con el contrato P2 del
 * backend (#1545, #1564). La moneda del precio es la funcional del tenant
 * (`localeDeTenant`, #517) y no se envia: la pone el servidor. La de la
 * referencia la escribe el dealer y tiene que ser otra.
 *
 * Lo que el contrato todavia no acepta (puertas, cilindrada, cilindros) se pinta
 * deshabilitado con "Próximamente" en vez de una casilla que se guardaria en la
 * nada.
 *
 * Los errores van junto a su campo y en español: el formulario es `noValidate`
 * para que el navegador no pinte su globo en otro idioma, y el `reason_code`
 * del backend se traduce al campo que hay que corregir (`MOTIVO_EN_CAMPO`).
 */

import { DetalleTecnico } from "@/app/autos/dealer/inventario/DetalleTecnico";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { PasoTarea } from "@/lib/dealer/pasos-tarea";
import { conCondicion, validateFiscal } from "@/lib/dealer-management/compra-fiscal";
import {
  VehiclePurchaseSection,
  type VehiclePurchaseSectionProps,
} from "@/components/dealer-management/VehiclePurchaseSection";
import {
  centavos,
  MENSAJE_ALTA,
  PURCHASE_EMPTY,
  validatePurchase,
  type PurchaseErrors,
  type PurchaseForm,
} from "@/lib/dealer-management/vehicle-purchase";
import { useAcquisitionModes } from "@/lib/dealer-management/acquisition-modes";
import { localeDeTenant } from "@/lib/dealer-management/formato";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import {
  MOTIVO_EN_CAMPO,
  PENDING_FIELD_NOTE,
  VEHICLE_CONDITIONS,
  VEHICLE_FORM_EMPTY,
  VEHICLE_PENDING_FIELDS,
  VEHICLE_STATUS_LABEL,
  paisDeLocale,
  validateVehicleForm,
  vehiclePriceFields,
  type VehicleFormErrors,
  type VehicleManualForm as VehicleForm,
} from "@/lib/dealer-management/vehicle-manual";

const FIELD_CLASS =
  "mt-1 min-h-11 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 text-sm text-nk-fg disabled:cursor-not-allowed disabled:opacity-60";

const LABEL_CLASS = "block text-sm font-semibold text-nk-fg";

type TextField = {
  name: keyof VehicleForm;
  label: string;
  required?: boolean;
  maxLength?: number;
  ayuda?: string;
  inputMode?: "numeric" | "decimal";
};

const IDENTIDAD: TextField[] = [
  { name: "make", label: "Marca", required: true, maxLength: 50 },
  { name: "model", label: "Modelo", required: true, maxLength: 50 },
  { name: "year", label: "Año", required: true, inputMode: "numeric" },
  { name: "trim", label: "Versión", maxLength: 50 },
  { name: "vin", label: "VIN", maxLength: 17 },
  { name: "mileage_km", label: "Kilómetros", inputMode: "numeric" },
];

const FICHA: TextField[] = [
  { name: "fuel_type", label: "Combustible", maxLength: 30 },
  { name: "transmission", label: "Transmisión", maxLength: 30 },
  { name: "drivetrain", label: "Tracción", maxLength: 30 },
  { name: "body_type", label: "Carrocería", maxLength: 30 },
  { name: "exterior_color", label: "Color exterior", maxLength: 30 },
  { name: "interior_color", label: "Color interior", maxLength: 30 },
  { name: "province", label: "Provincia", maxLength: 100 },
  { name: "municipality", label: "Localidad", maxLength: 100 },
];

/** Lo que el formulario sabe de si mismo: los datos y los errores que daria el boton Crear si se tocara ahora. */
export type EstadoAltaAuto = {
  form: VehicleForm;
  purchase: PurchaseForm;
  erroresAuto: VehicleFormErrors;
  erroresCompra: PurchaseErrors;
};

const CAMPOS_AUTO: (keyof VehicleForm)[] = ["make", "model", "year", "trim", "vin", "mileage_km", "condition"];
const CAMPOS_PRECIO: (keyof VehicleForm)[] = [
  "price_amount",
  "display_price_amount",
  "display_price_currency",
  "plate",
  "plate_country",
  "stock_number",
];
const CAMPOS_COMPRA = ["cost", "acquired_on", "currency", "fx_rate", "fx_source", "fx_as_of", "fx_source_detail", "country_code"];

/**
 * Pasos de "Cargar un auto" (pedido de César, 26-nov). Cada `hecho` sale de la misma validacion que usa el boton
 * Crear: un paso queda hecho cuando sus campos ya no darian error. Sin estado (antes del primer render) nada esta hecho.
 */
export function pasosAltaAuto(
  estado: EstadoAltaAuto | null,
  resultado: { creado: boolean; vehicleId: string | null } = { creado: false, vehicleId: null },
): PasoTarea[] {
  const sinError = (errores: Record<string, string | undefined> | undefined, campos: string[]) =>
    !!estado && !!errores && campos.every((c) => !errores[c]);
  const compra = estado?.purchase;
  const erroresFiscales = compra ? validateFiscal(compra, centavos(compra.cost)) : {};
  const fichaEnlace = resultado.vehicleId
    ? `/autos/dealer/inventario/${encodeURIComponent(resultado.vehicleId)}`
    : resultado.creado
      ? "/autos/dealer/inventario"
      : undefined;
  return [
    {
      id: "datos",
      titulo: "Datos del auto: marca, modelo y año",
      hecho: sinError(estado?.erroresAuto, CAMPOS_AUTO),
      ayuda: "Completá marca, modelo y año en «Identificación». VIN y kilómetros son opcionales.",
    },
    {
      id: "precio",
      titulo: "Precio de venta",
      hecho: !!estado?.form.price_amount.trim() && sinError(estado?.erroresAuto, CAMPOS_PRECIO),
      ayuda: "Podés dejarlo para después: sin precio el auto queda en Borrador y no se publica.",
      opcional: true,
    },
    {
      id: "compra",
      titulo: "Costo, fecha y moneda de la compra",
      hecho: sinError(estado?.erroresCompra, CAMPOS_COMPRA),
      ayuda: "Cuánto pagaste, cuándo, en qué país y en qué moneda (con el tipo de cambio si no es tu moneda).",
    },
    {
      id: "modo",
      titulo: "Cómo lo compraste (modo de adquisición)",
      hecho: sinError(estado?.erroresCompra, ["acquisition_mode_code"]),
      ayuda: "Elegí el «Código de adquisición» en la sección Compra.",
    },
    {
      id: "vendedor",
      titulo: "A quién se lo compraste (contacto vendedor)",
      hecho: sinError(estado?.erroresCompra, ["seller_contact_id"]),
      ayuda: "Buscá y elegí al vendedor entre tus contactos.",
    },
    {
      id: "pagos",
      titulo: "Cómo lo pagaste: los pagos suman el costo",
      hecho:
        !!estado &&
        Object.keys(estado.erroresCompra).every((k) => !k.startsWith("payment_")) &&
        !estado.erroresCompra.cost,
      ayuda: "Cargá cada pago (efectivo, transferencia, cheque). La suma tiene que dar el costo.",
    },
    {
      id: "factura",
      titulo: "Factura de la compra (si el vendedor te la dio)",
      hecho: !!compra && conCondicion(compra) && Object.keys(erroresFiscales).length === 0,
      ayuda: "Si el vendedor es una empresa y te dio factura, cargá su número, neto e IVA.",
      opcional: true,
    },
    {
      id: "crear",
      titulo: "Tocar «Crear vehículo»",
      hecho: resultado.creado,
      ayuda: "Se guarda como Borrador: todavía no se publica.",
    },
    {
      id: "fotos",
      titulo: resultado.creado && !resultado.vehicleId
        ? "Buscar el auto en el inventario para subirle fotos y publicarlo"
        : "Subir fotos y publicarlo, en la ficha del auto",
      hecho: false,
      ayuda: "Al crear el auto te llevamos a su ficha: ahí subís las fotos y lo pasás a Disponible.",
      enlace: fichaEnlace,
    },
  ];
}

export type VehicleManualFormProps = {
  initial?: VehicleForm;
  status?: string;
  busy?: boolean;
  errorReasonCode?: string | null;
  ack?: string | null;
  /** Alta con compra (F4C-5): pide costo, pagos, moneda y contacto vendedor. */
  withPurchase?: boolean;
  /** Selector del contacto vendedor (F4C-7). Sin el, la compra va deshabilitada. */
  sellerSelector?: VehiclePurchaseSectionProps["sellerSelector"];
  onSubmit: (form: VehicleForm, purchase?: PurchaseForm) => void;
  /** Avisa cada cambio con los errores que daria Crear ahora (para la lista de pasos de la pantalla). */
  onCambio?: (estado: EstadoAltaAuto) => void;
};

export function VehicleManualForm({
  initial,
  status,
  busy = false,
  errorReasonCode = null,
  ack = null,
  withPurchase = false,
  sellerSelector,
  onSubmit,
  onCambio,
}: VehicleManualFormProps) {
  const [form, setForm] = useState<VehicleForm>(initial ?? VEHICLE_FORM_EMPTY);
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const branding = useDealerManagementBranding();
  const locale = useMemo(() => localeDeTenant(branding.data), [branding.data]);
  /** La etiqueta de la referencia sigue a la moneda que escribe el dealer. */
  const priceFields = useMemo(
    () => vehiclePriceFields(locale.currency, form.display_price_currency.trim() || null),
    [locale.currency, form.display_price_currency],
  );
  const [purchase, setPurchase] = useState<PurchaseForm>(PURCHASE_EMPTY);
  const [purchaseErrors, setPurchaseErrors] = useState<PurchaseErrors>({});
  const estado = status ?? "draft";
  const modos = useAcquisitionModes(withPurchase);
  const motivoServidor = errorReasonCode ? MOTIVO_EN_CAMPO[errorReasonCode] : undefined;
  // El error que viene del servidor se retira cuando el dealer corrige ese campo.
  const [motivoCorregido, setMotivoCorregido] = useState(false);
  useEffect(() => setMotivoCorregido(false), [errorReasonCode]);
  const motivo = motivoCorregido ? undefined : motivoServidor;
  const mensajeAlta = errorReasonCode ? MENSAJE_ALTA[errorReasonCode] : undefined;

  // El pais del dominio se PROPONE con el del tenant; el dealer lo cambia.
  const paisPropuesto = paisDeLocale(branding.data ? locale.locale : null);
  useEffect(() => {
    if (!paisPropuesto) return;
    setForm((previous) => (previous.plate_country ? previous : { ...previous, plate_country: paisPropuesto }));
  }, [paisPropuesto]);

  // Moneda y pais de la compra se PROPONEN con los del tenant; el dealer los cambia.
  useEffect(() => {
    if (!withPurchase || !branding.data) return;
    setPurchase((previous) => ({
      ...previous,
      currency: previous.currency || locale.currency || "",
      country_code: previous.country_code || paisPropuesto || "",
    }));
  }, [withPurchase, branding.data, locale.currency, paisPropuesto]);

  // Mismo calculo que `submit`, sin pintar errores: solo informa a quien escucha.
  const avisar = useRef(onCambio);
  avisar.current = onCambio;
  const monedaCompra = branding.data ? locale.currency : null;
  const conSelector = !!sellerSelector;
  useEffect(() => {
    if (!avisar.current) return;
    avisar.current({
      form,
      purchase,
      erroresAuto: validateVehicleForm(form, locale.currency),
      erroresCompra: withPurchase
        ? conSelector
          ? validatePurchase(purchase, monedaCompra)
          : { purchase: "La compra no está disponible todavía." }
        : {},
    });
  }, [form, purchase, locale.currency, monedaCompra, withPurchase, conSelector]);

  const PRECIO: TextField[] = [
    { name: "price_amount", label: priceFields[0].label, ayuda: priceFields[0].ayuda, inputMode: "decimal" },
    { name: "display_price_amount", label: priceFields[1].label, ayuda: priceFields[1].ayuda, inputMode: "decimal" },
    { name: "display_price_currency", label: "Moneda de la referencia", maxLength: 3, ayuda: "Código de 3 letras." },
    { name: "plate", label: "Dominio", maxLength: 16, ayuda: "La patente del vehículo." },
    { name: "plate_country", label: "País del dominio", maxLength: 2, ayuda: "Código de 2 letras." },
    { name: "stock_number", label: "Número de stock", maxLength: 32, ayuda: "Tu número interno; no se puede repetir." },
  ];

  function errorDe(name: keyof VehicleForm): string | undefined {
    return errors[name] ?? (motivo?.campo === name ? motivo.mensaje : undefined);
  }

  function set(name: keyof VehicleForm, value: string) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!(name in previous)) return previous;
      const { [name]: _quitado, ...resto } = previous;
      return resto;
    });
    if (motivoServidor?.campo === name) setMotivoCorregido(true);
  }

  /** Corregir un campo de la compra borra su error sin esperar a reenviar. */
  function cambiaCompra(next: PurchaseForm) {
    setPurchase((previous) => {
      const cambiados = (Object.keys(next) as (keyof PurchaseForm)[]).filter((k) => next[k] !== previous[k]);
      setPurchaseErrors((errs) => {
        const pagos = cambiados.includes("payment_lines") || cambiados.includes("cost");
        const resto = Object.fromEntries(
          Object.entries(errs).filter(
            ([k]) => !cambiados.includes(k as keyof PurchaseForm) && !(pagos && k.startsWith("payment_")) && k !== "purchase",
          ),
        );
        return Object.keys(resto).length === Object.keys(errs).length ? errs : resto;
      });
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateVehicleForm(form, locale.currency);
    setErrors(found);
    if (withPurchase) {
      // Sin selector de contactos no hay compra valida: no se envia nada (fail-closed).
      const foundPurchase = sellerSelector
        ? validatePurchase(purchase, branding.data ? locale.currency : null)
        : { purchase: "La compra no está disponible todavía." };
      setPurchaseErrors(foundPurchase);
      if (Object.keys(found).length > 0 || Object.keys(foundPurchase).length > 0) return;
      onSubmit(form, purchase);
      return;
    }
    if (Object.keys(found).length > 0) return;
    onSubmit(form);
  }

  function renderText(field: TextField) {
    const error = errorDe(field.name);
    return (
      <label key={field.name} className="block">
        <span className={LABEL_CLASS}>
          {field.label}
          {field.required ? <span aria-hidden> *</span> : null}
        </span>
        <input
          name={field.name}
          value={form[field.name]}
          onChange={(event) => set(field.name, event.target.value)}
          required={field.required}
          disabled={busy}
          maxLength={field.maxLength}
          inputMode={field.inputMode}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${field.name}-error` : undefined}
          className={FIELD_CLASS}
        />
        {field.ayuda && !error ? <span className="mt-1 block text-xs text-nk-fg-muted">{field.ayuda}</span> : null}
        {error ? (
          <span id={`${field.name}-error`} role="alert" className="mt-1 block text-xs font-semibold text-red-600">
            {error}
          </span>
        ) : null}
      </label>
    );
  }

  return (
    <form onSubmit={submit} noValidate data-testid="vehicle-manual-form" data-mode="crear" className="space-y-6">
      <section className="space-y-3 rounded-xl border border-nk-border bg-nk-surface p-4">
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Identificación</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {IDENTIDAD.map(renderText)}
          <label className="block">
            <span className={LABEL_CLASS}>Condición</span>
            <select
              name="condition"
              value={form.condition}
              onChange={(event) => set("condition", event.target.value)}
              disabled={busy}
              className={FIELD_CLASS}
            >
              {VEHICLE_CONDITIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className={LABEL_CLASS}>Estado</span>
            <p data-testid="vehicle-status" className="mt-1 min-h-11 pt-3 text-sm font-bold text-nk-fg">
              {VEHICLE_STATUS_LABEL[estado] ?? estado}
            </p>
          </div>
        </div>
      </section>

      <section data-testid="vehicle-price-fields" className="space-y-3 rounded-xl border border-nk-border bg-nk-surface p-4">
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Precio, dominio y stock</h2>
        <p className="text-sm text-nk-fg-muted">
          Sin precio el vehículo puede quedar en Borrador; para pasarlo a Disponible el precio es obligatorio.
        </p>
        <div className="grid gap-3 md:grid-cols-2">{PRECIO.map(renderText)}</div>
      </section>

      <section className="space-y-3 rounded-xl border border-nk-border bg-nk-surface p-4">
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Ficha técnica y ubicación</h2>
        <div className="grid gap-3 md:grid-cols-2">{FICHA.map(renderText)}</div>
        <label className="block">
          <span className={LABEL_CLASS}>Descripción</span>
          <textarea
            name="description"
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
            disabled={busy}
            maxLength={5000}
            rows={4}
            className="mt-1 w-full max-w-full rounded-r-sm border border-nk-border bg-nk-surface px-3 py-2 text-sm text-nk-fg"
          />
          {errors.description ? (
            <span role="alert" className="mt-1 block text-xs font-semibold text-red-600">
              {errors.description}
            </span>
          ) : null}
        </label>
      </section>

      {withPurchase ? (
        <VehiclePurchaseSection
          value={purchase}
          onChange={cambiaCompra}
          acquisitionModes={modos}
          errors={purchaseErrors}
          functionalCurrency={branding.data ? locale.currency : null}
          busy={busy}
          sellerSelector={sellerSelector}
        />
      ) : null}

      <section
        data-testid="vehicle-pending-fields"
        className="space-y-3 rounded-xl border border-dashed border-nk-border bg-nk-surface-2 p-4"
      >
        <h2 className="font-manrope text-lg font-bold text-nk-fg">Todavía no disponibles</h2>
        <p className="text-sm text-nk-fg-muted">
          El sistema todavía no guarda estos datos: lo que se escriba aquí no se guardaría, así que siguen
          deshabilitados.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {VEHICLE_PENDING_FIELDS.map((field) => (
            <label key={field.name} className="block">
              <span className={LABEL_CLASS}>
                {field.label} · {PENDING_FIELD_NOTE}
              </span>
              <input name={field.name} value="" disabled readOnly className={FIELD_CLASS} />
            </label>
          ))}
        </div>
      </section>

      {purchaseErrors.purchase ? (
        <p role="alert" data-testid="purchase-blocked" className="text-sm font-semibold text-red-600">
          {purchaseErrors.purchase}
        </p>
      ) : null}

      {errorReasonCode && (!motivoServidor || mensajeAlta) ? (
        <div
          role="alert"
          data-testid="vehicle-manual-error"
          data-reason-code={errorReasonCode}
          className="rounded-xl border border-nk-border bg-nk-surface p-4 text-sm text-nk-fg"
        >
          {mensajeAlta ?? "No se pudo guardar el vehículo. Revisa los datos e intenta de nuevo."}
          <DetalleTecnico>
            <span className="block">Código para soporte: {errorReasonCode}</span>
          </DetalleTecnico>
        </div>
      ) : null}

      {ack ? (
        <p role="status" data-testid="vehicle-manual-ack" className="text-sm font-semibold text-nk-fg">
          {ack}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="min-h-11 w-full rounded-full border border-brand-2/40 bg-brand-2/10 px-4 text-sm font-bold text-nk-fg disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Guardando…" : "Crear vehículo"}
      </button>
    </form>
  );
}
