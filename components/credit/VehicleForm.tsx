"use client";

import type { VehiclePayload } from "@/lib/credit-api";
import { useState, type FormEvent } from "react";

export interface VehicleFormProps {
  initial?: Partial<VehiclePayload>;
  onSubmit: (data: VehiclePayload) => void;
  submitLabel?: string;
  disabled?: boolean;
}

const currentYear = new Date().getFullYear();

export function VehicleForm({
  initial,
  onSubmit,
  submitLabel = "Guardar vehículo",
  disabled = false,
}: VehicleFormProps) {
  const [marca, setMarca] = useState(initial?.marca ?? initial?.make ?? "");
  const [modelo, setModelo] = useState(initial?.modelo ?? initial?.model ?? "");
  const [version, setVersion] = useState(initial?.version ?? "");
  const [anio, setAnio] = useState(
    String(initial?.anio ?? initial?.year ?? "")
  );
  const [condicion, setCondicion] = useState(initial?.condicion ?? "NUEVO");
  const [transmision, setTransmision] = useState(
    initial?.transmision ?? "AUTOMATICA"
  );
  const [combustible, setCombustible] = useState(
    initial?.combustible ?? "GASOLINA"
  );
  const [color, setColor] = useState(initial?.color ?? "");
  const [km, setKm] = useState(String(initial?.km_odometro ?? "0"));
  const [vin, setVin] = useState(initial?.vin ?? initial?.vin_chasis ?? "");
  const [placa, setPlaca] = useState(initial?.placa ?? "");
  const [precioVenta, setPrecioVenta] = useState(
    String(initial?.precio_venta ?? initial?.vehicle_value ?? "")
  );
  const [valorTasacion, setValorTasacion] = useState(
    String(initial?.valor_tasacion ?? "")
  );
  const [montoPrestamo, setMontoPrestamo] = useState(
    String(initial?.loan_amount_requested ?? "")
  );
  const [tieneGravamen, setTieneGravamen] = useState(
    initial?.tiene_gravamen_previo ?? false
  );
  const [entidadGravamen, setEntidadGravamen] = useState(
    initial?.entidad_gravamen ?? ""
  );
  const [propietario, setPropietario] = useState(
    initial?.propietario_vehiculo ?? "SOLICITANTE"
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const yr = parseInt(anio, 10);
    if (yr < 2000 || yr > currentYear + 1) return;
    if (condicion === "NUEVO" && parseInt(km, 10) > 0) return;
    // Wire payload: backend only accepts VehicleSavePayload (see lib/credit-api).
    onSubmit({
      make: marca.trim() || undefined,
      model: modelo.trim() || undefined,
      year: yr,
      vin: vin.trim() || undefined,
      vehicle_value: precioVenta ? parseFloat(precioVenta) : undefined,
      loan_amount_requested: montoPrestamo
        ? parseFloat(montoPrestamo)
        : undefined,
    });
  }

  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1";
  const sectionClass =
    "rounded-xl border border-white/8 bg-white/3 p-4 space-y-3";
  const sectionTitle =
    "text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={sectionClass}>
        <p className={sectionTitle}>Identificación del vehículo</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Marca *</label>
            <input
              className={fieldClass}
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: Toyota"
            />
          </div>
          <div>
            <label className={labelClass}>Modelo *</label>
            <input
              className={fieldClass}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: Corolla"
            />
          </div>
          <div>
            <label className={labelClass}>Versión / Trim</label>
            <input
              className={fieldClass}
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              disabled={disabled}
              placeholder="Ej: XSE, LE"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Año *</label>
            <input
              type="number"
              min={2000}
              max={currentYear + 1}
              className={fieldClass}
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              disabled={disabled}
              required
              placeholder={String(currentYear)}
            />
          </div>
          <div>
            <label className={labelClass}>Placa</label>
            <input
              className={fieldClass}
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              disabled={disabled}
              placeholder="Ej: A123456"
              maxLength={8}
            />
          </div>
          <div>
            <label className={labelClass}>VIN / Chasis</label>
            <input
              className={fieldClass}
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              disabled={disabled}
              placeholder="17 caracteres"
              maxLength={17}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Color</label>
          <input
            className={fieldClass}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={disabled}
            placeholder="Ej: Blanco perla"
          />
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Características</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Condición *</label>
            <select
              className={fieldClass}
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              disabled={disabled}
            >
              <option value="NUEVO">Nuevo</option>
              <option value="USADO">Usado</option>
              <option value="CERTIFICADO">Certificado (CPO)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Kilometraje</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              disabled={disabled}
              placeholder="0"
            />
            {condicion === "NUEVO" && parseInt(km, 10) > 0 && (
              <p className="text-xs text-red-400 mt-1">
                Un vehículo nuevo no puede tener km &gt; 0
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Transmisión</label>
            <select
              className={fieldClass}
              value={transmision}
              onChange={(e) => setTransmision(e.target.value)}
              disabled={disabled}
            >
              <option value="AUTOMATICA">Automática</option>
              <option value="MANUAL">Manual</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Combustible</label>
            <select
              className={fieldClass}
              value={combustible}
              onChange={(e) => setCombustible(e.target.value)}
              disabled={disabled}
            >
              <option value="GASOLINA">Gasolina</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRICO">Eléctrico</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="GAS">Gas</option>
            </select>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Valores y financiamiento</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Precio de venta (RD$) *</label>
            <input
              type="number"
              min={0}
              step={1000}
              className={fieldClass}
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: 900000"
            />
            <p className="text-xs text-slate-500 mt-1">
              Se envía al API como valor del vehículo
            </p>
          </div>
          <div>
            <label className={labelClass}>Valor de tasación (RD$) *</label>
            <input
              type="number"
              min={0}
              step={1000}
              className={fieldClass}
              value={valorTasacion}
              onChange={(e) => setValorTasacion(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: 870000"
            />
            <p className="text-xs text-slate-500 mt-1">
              Referencia local; no se envía al API actual
            </p>
          </div>
        </div>
        <div className="mt-3">
          <label className={labelClass}>Monto del préstamo solicitado (RD$) *</label>
          <input
            type="number"
            min={0}
            step={1000}
            className={fieldClass}
            value={montoPrestamo}
            onChange={(e) => setMontoPrestamo(e.target.value)}
            disabled={disabled}
            required
            placeholder="Ej: 600000"
          />
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Titularidad y gravamen</p>
        <div>
          <label className={labelClass}>Propietario actual del vehículo</label>
          <select
            className={fieldClass}
            value={propietario}
            onChange={(e) => setPropietario(e.target.value)}
            disabled={disabled}
          >
            <option value="SOLICITANTE">El solicitante</option>
            <option value="CONYUGE">Cónyuge / Pareja</option>
            <option value="TERCERO">Tercero (familiar, amigo)</option>
            <option value="EMPRESA">Empresa</option>
          </select>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={tieneGravamen}
            onChange={(e) => setTieneGravamen(e.target.checked)}
            disabled={disabled}
            className="accent-violet-500"
          />
          <span className="text-sm text-slate-300">
            El vehículo tiene gravamen o prenda activa
          </span>
        </label>
        {tieneGravamen && (
          <div>
            <label className={labelClass}>Institución con gravamen</label>
            <input
              className={fieldClass}
              value={entidadGravamen}
              onChange={(e) => setEntidadGravamen(e.target.value)}
              disabled={disabled}
              placeholder="Nombre del banco o financiera"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || (condicion === "NUEVO" && parseInt(km, 10) > 0)}
        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </form>
  );
}
