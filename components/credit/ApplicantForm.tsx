"use client";

import type { ApplicantPayload } from "@/lib/credit-api";
import { useState, type FormEvent } from "react";

export interface ApplicantFormProps {
  initial?: Partial<ApplicantPayload>;
  onSubmit: (data: ApplicantPayload) => void;
  submitLabel?: string;
  disabled?: boolean;
}

/** Validación de cédula dominicana (Luhn módulo 10) */
function validarCedula(cedula: string): boolean {
  const digits = cedula.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  const weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  const total = digits.split("").reduce((sum, d, i) => {
    const val = parseInt(d, 10) * weights[i]!;
    return sum + (val >= 10 ? val - 9 : val);
  }, 0);
  return total % 10 === 0;
}

function formatCedula(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

const PROVINCIAS_RD = [
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "San Cristóbal",
  "La Vega",
  "San Pedro de Macorís",
  "La Romana",
  "Puerto Plata",
  "Espaillat",
  "Duarte",
  "María Trinidad Sánchez",
  "Sánchez Ramírez",
  "Monseñor Nouel",
  "Monte Plata",
  "Hato Mayor",
  "San José de Ocoa",
  "Peravia",
  "Azua",
  "San Juan",
  "Elías Piña",
  "Bahoruco",
  "Barahona",
  "Independencia",
  "Pedernales",
  "Jimaní",
  "Dajabón",
  "Montecristi",
  "Santiago Rodríguez",
  "Valverde",
  "Hermanas Mirabal",
  "Samaná",
  "El Seibo",
  "La Altagracia",
  "San Rafael del Yuma",
];

type RefRow = {
  nombre: string;
  telefono: string;
  relacion: string;
  tipo: "personal" | "comercial";
};

export function ApplicantForm({
  initial,
  onSubmit,
  submitLabel = "Guardar solicitante",
  disabled = false,
}: ApplicantFormProps) {
  const [nombre, setNombre] = useState(
    initial?.nombre_completo ?? initial?.name ?? ""
  );
  const [cedula, setCedula] = useState(
    initial?.cedula ?? initial?.national_id ?? ""
  );
  const [fechaNac, setFechaNac] = useState(initial?.fecha_nacimiento ?? "");
  const [estadoCivil, setEstadoCivil] = useState(initial?.estado_civil ?? "");
  const [nacionalidad, setNacionalidad] = useState(
    initial?.nacionalidad ?? "Dominicana"
  );
  const [telefono, setTelefono] = useState(initial?.telefono_celular ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [direccion, setDireccion] = useState(initial?.direccion ?? "");
  const [sector, setSector] = useState(initial?.sector ?? "");
  const [municipio, setMunicipio] = useState(initial?.municipio ?? "");
  const [provincia, setProvincia] = useState(initial?.provincia ?? "");
  const [tipoEmpleo, setTipoEmpleo] = useState(
    initial?.tipo_empleo ?? initial?.employment_status ?? ""
  );
  const [empleador, setEmpleador] = useState(initial?.nombre_empleador ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [antiguedad, setAntiguedad] = useState(
    String(initial?.antiguedad_empleo_meses ?? "")
  );
  const [ingreso, setIngreso] = useState(
    String(initial?.ingreso_mensual_declarado ?? initial?.monthly_income ?? "")
  );
  const [otrosIngresos, setOtrosIngresos] = useState(
    String(initial?.otros_ingresos ?? "0")
  );
  const [montoSolicitado, setMontoSolicitado] = useState(
    String(initial?.monto_solicitado ?? "")
  );
  const [plazo, setPlazo] = useState(String(initial?.plazo_meses ?? "48"));
  const [inicial, setInicial] = useState(
    initial?.inicial_disponible != null
      ? String(initial.inicial_disponible)
      : ""
  );
  const [refs, setRefs] = useState<RefRow[]>([
    { nombre: "", telefono: "", relacion: "", tipo: "personal" },
    { nombre: "", telefono: "", relacion: "", tipo: "personal" },
    { nombre: "", telefono: "", relacion: "", tipo: "comercial" },
    { nombre: "", telefono: "", relacion: "", tipo: "comercial" },
    { nombre: "", telefono: "", relacion: "", tipo: "comercial" },
  ]);
  const [autorizaBuro, setAutorizaBuro] = useState(
    initial?.autoriza_buro ?? false
  );
  const [aceptaPolitica, setAceptaPolitica] = useState(
    initial?.acepta_politica_datos ?? false
  );
  const [coNombre, setCoNombre] = useState(initial?.co_borrower_name ?? "");
  const [coIngreso, setCoIngreso] = useState(
    String(initial?.co_borrower_monthly_income ?? "")
  );
  const [coCedula, setCoCedula] = useState("");
  const [coEmail, setCoEmail] = useState("");
  const [coDireccion, setCoDireccion] = useState("");
  const [coTelefono, setCoTelefono] = useState("");
  const [coRefs, setCoRefs] = useState<RefRow[]>([
    { nombre: "", telefono: "", relacion: "", tipo: "personal" },
    { nombre: "", telefono: "", relacion: "", tipo: "personal" },
  ]);
  const [cedulaError, setCedulaError] = useState("");

  function updateRef(i: number, field: keyof RefRow, val: string) {
    setRefs((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );
  }

  function updateCoRef(i: number, field: keyof RefRow, val: string) {
    setCoRefs((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );
  }

  function onCedulaChange(val: string) {
    const formatted = formatCedula(val);
    setCedula(formatted);
    const digits = val.replace(/\D/g, "");
    if (digits.length === 11) {
      setCedulaError(validarCedula(val) ? "" : "Cédula inválida");
    } else {
      setCedulaError("");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!autorizaBuro || !aceptaPolitica) return;
    if (cedulaError) return;
    const digits = cedula.replace(/\D/g, "");
    const payload: ApplicantPayload = {
      nombre_completo: nombre.trim() || undefined,
      cedula: digits || undefined,
      fecha_nacimiento: fechaNac || undefined,
      estado_civil: estadoCivil || undefined,
      nacionalidad,
      telefono_celular: telefono.trim() || undefined,
      email: email.trim() || undefined,
      direccion: direccion.trim() || undefined,
      sector: sector.trim() || undefined,
      municipio: municipio.trim() || undefined,
      provincia: provincia || undefined,
      tipo_empleo: tipoEmpleo || undefined,
      nombre_empleador: empleador.trim() || undefined,
      cargo: cargo.trim() || undefined,
      antiguedad_empleo_meses: antiguedad
        ? parseInt(antiguedad, 10)
        : undefined,
      ingreso_mensual_declarado: ingreso ? parseFloat(ingreso) : undefined,
      otros_ingresos: otrosIngresos ? parseFloat(otrosIngresos) : 0,
      monto_solicitado: montoSolicitado ? parseFloat(montoSolicitado) : undefined,
      plazo_meses: plazo ? parseInt(plazo, 10) : 48,
      inicial_disponible: inicial ? parseFloat(inicial) : 0,
      referencias: refs
        .filter((r) => r.nombre.trim())
        .map((r) => ({
          nombre: r.nombre,
          telefono: r.telefono,
          relacion: r.relacion,
          tipo: r.tipo,
        })),
      autoriza_buro: autorizaBuro,
      acepta_politica_datos: aceptaPolitica,
      firma_digital: new Date().toISOString(),
      name: nombre.trim() || undefined,
      monthly_income: ingreso ? parseFloat(ingreso) : undefined,
      national_id: digits || undefined,
      employment_status: tipoEmpleo || undefined,
      co_borrower_name: coNombre.trim() || undefined,
      co_borrower_monthly_income:
        coNombre.trim() && coIngreso.trim()
          ? parseFloat(coIngreso)
          : undefined,
      co_borrower_cedula: coNombre.trim() ? coCedula || undefined : undefined,
      co_borrower_email: coNombre.trim() ? coEmail || undefined : undefined,
      co_borrower_direccion: coNombre.trim()
        ? coDireccion || undefined
        : undefined,
      co_borrower_telefono: coNombre.trim()
        ? coTelefono || undefined
        : undefined,
      co_borrower_referencias: coNombre.trim()
        ? coRefs.filter((r) => r.nombre.trim())
        : undefined,
    };
    onSubmit(payload);
  }

  const fieldClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500";
  const selectClass =
    "w-full rounded-lg border border-white/20 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const optClass = "bg-slate-700 text-slate-100";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1";
  const sectionClass =
    "rounded-xl border border-white/8 bg-white/3 p-4 space-y-3";
  const sectionTitle =
    "text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={sectionClass}>
        <p className={sectionTitle}>Identidad</p>
        <div>
          <label className={labelClass}>Nombre completo *</label>
          <input
            className={fieldClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={disabled}
            required
            placeholder="Ej: Juan Carlos Pérez García"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cédula de identidad *</label>
            <input
              className={`${fieldClass} ${cedulaError ? "border-red-500" : ""}`}
              value={cedula}
              onChange={(e) => onCedulaChange(e.target.value)}
              disabled={disabled}
              placeholder="000-0000000-0"
              maxLength={13}
            />
            {cedulaError ? (
              <p className="text-xs text-red-400 mt-1">{cedulaError}</p>
            ) : null}
          </div>
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input
              type="date"
              className={fieldClass}
              value={fechaNac}
              onChange={(e) => setFechaNac(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Estado civil</label>
            <select
              className={selectClass}
              value={estadoCivil}
              onChange={(e) => setEstadoCivil(e.target.value)}
              disabled={disabled}
            >
              <option value="" className={optClass}>
                Seleccionar...
              </option>
              <option value="SOLTERO" className={optClass}>
                Soltero/a
              </option>
              <option value="CASADO" className={optClass}>
                Casado/a
              </option>
              <option value="UNION_LIBRE" className={optClass}>
                Unión libre
              </option>
              <option value="DIVORCIADO" className={optClass}>
                Divorciado/a
              </option>
              <option value="VIUDO" className={optClass}>
                Viudo/a
              </option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nacionalidad</label>
            <input
              className={fieldClass}
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Contacto</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Teléfono celular *</label>
            <input
              className={fieldClass}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={disabled}
              placeholder="809-000-0000"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Correo electrónico *</label>
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
              placeholder="nombre@email.com"
              required
            />
          </div>
        </div>
      </div>
      <div className={sectionClass}>
        <p className={sectionTitle}>Domicilio</p>
        <div>
          <label className={labelClass}>Dirección *</label>
          <input
            className={fieldClass}
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            disabled={disabled}
            placeholder="Calle, número, apartamento"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Sector</label>
            <input
              className={fieldClass}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={disabled}
              placeholder="Ej: Naco"
            />
          </div>
          <div>
            <label className={labelClass}>Municipio</label>
            <input
              className={fieldClass}
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              disabled={disabled}
              placeholder="Ej: Santo Domingo"
            />
          </div>
          <div>
            <label className={labelClass}>Provincia</label>
            <select
              className={selectClass}
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              disabled={disabled}
            >
              <option value="" className={optClass}>
                Seleccionar...
              </option>
              {PROVINCIAS_RD.map((p) => (
                <option key={p} value={p} className={optClass}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Empleo</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipo de empleo *</label>
            <select
              className={selectClass}
              value={tipoEmpleo}
              onChange={(e) => setTipoEmpleo(e.target.value)}
              disabled={disabled}
              required
            >
              <option value="" className={optClass}>
                Seleccionar...
              </option>
              <option value="ASALARIADO" className={optClass}>
                Asalariado
              </option>
              <option value="INDEPENDIENTE" className={optClass}>
                Independiente / Freelance
              </option>
              <option value="PENSIONADO" className={optClass}>
                Pensionado / Jubilado
              </option>
              <option value="EMPRESARIO" className={optClass}>
                Empresario / Dueño
              </option>
              <option value="OTRO" className={optClass}>
                Otro
              </option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Empleador / Empresa</label>
            <input
              className={fieldClass}
              value={empleador}
              onChange={(e) => setEmpleador(e.target.value)}
              disabled={disabled}
              placeholder="Nombre de la empresa"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Cargo / Posición</label>
            <input
              className={fieldClass}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              disabled={disabled}
              placeholder="Ej: Gerente de ventas"
            />
          </div>
          <div>
            <label className={labelClass}>Antigüedad (meses)</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={antiguedad}
              onChange={(e) => setAntiguedad(e.target.value)}
              disabled={disabled}
              placeholder="Ej: 24"
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Ingresos mensuales</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Ingreso neto mensual (RD$) *</label>
            <input
              type="number"
              min={0}
              step={100}
              className={fieldClass}
              value={ingreso}
              onChange={(e) => setIngreso(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: 75000"
            />
          </div>
          <div>
            <label className={labelClass}>Otros ingresos (RD$)</label>
            <input
              type="number"
              min={0}
              step={100}
              className={fieldClass}
              value={otrosIngresos}
              onChange={(e) => setOtrosIngresos(e.target.value)}
              disabled={disabled}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Codeudor (opcional)</p>
        <p className="text-xs text-slate-500 -mt-2 mb-3">
          Solo se envía al servidor si completas el nombre del codeudor.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Nombre completo codeudor</label>
            <input
              className={fieldClass}
              value={coNombre}
              onChange={(e) => setCoNombre(e.target.value)}
              placeholder="Opcional"
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelClass}>Cédula de identidad</label>
            <input
              className={fieldClass}
              value={coCedula}
              onChange={(e) => setCoCedula(e.target.value)}
              placeholder="000-0000000-0"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Correo electrónico</label>
            <input
              type="email"
              className={fieldClass}
              value={coEmail}
              onChange={(e) => setCoEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              disabled={disabled}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono celular</label>
            <input
              className={fieldClass}
              value={coTelefono}
              onChange={(e) => setCoTelefono(e.target.value)}
              placeholder="809-000-0000"
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Dirección de residencia</label>
          <input
            className={fieldClass}
            value={coDireccion}
            onChange={(e) => setCoDireccion(e.target.value)}
            placeholder="Calle, número, sector, municipio"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelClass}>Ingreso mensual codeudor (RD$)</label>
            <input
              type="number"
              min={0}
              step={100}
              className={fieldClass}
              value={coIngreso}
              onChange={(e) => setCoIngreso(e.target.value)}
              placeholder="Opcional"
              disabled={disabled}
            />
          </div>
        </div>

        {coNombre.trim() ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Referencias del codeudor
            </p>
            {coRefs.map((ref, i) => (
              <div key={i}>
                <p className="text-xs text-slate-500 mb-1">
                  Referencia {i + 1}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    className={fieldClass}
                    value={ref.nombre}
                    onChange={(e) =>
                      updateCoRef(i, "nombre", e.target.value)
                    }
                    placeholder="Nombre completo"
                    disabled={disabled}
                  />
                  <input
                    className={fieldClass}
                    value={ref.telefono}
                    onChange={(e) =>
                      updateCoRef(i, "telefono", e.target.value)
                    }
                    placeholder="Teléfono"
                    disabled={disabled}
                  />
                  <input
                    className={fieldClass}
                    value={ref.relacion}
                    onChange={(e) =>
                      updateCoRef(i, "relacion", e.target.value)
                    }
                    placeholder="Relación"
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Datos del préstamo</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Monto solicitado (RD$) *</label>
            <input
              type="number"
              min={0}
              step={1000}
              className={fieldClass}
              value={montoSolicitado}
              onChange={(e) => setMontoSolicitado(e.target.value)}
              disabled={disabled}
              required
              placeholder="Ej: 600000"
            />
          </div>
          <div>
            <label className={labelClass}>Plazo (meses)</label>
            <select
              className={selectClass}
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
              disabled={disabled}
            >
              {[12, 24, 36, 48, 60, 72, 84].map((m) => (
                <option key={m} value={m} className={optClass}>
                  {m} meses
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Inicial disponible (RD$)</label>
            <input
              type="number"
              min={0}
              step={1000}
              className={fieldClass}
              value={inicial}
              onChange={(e) => setInicial(e.target.value)}
              disabled={disabled}
              placeholder="Ej: 150000 (opcional)"
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <p className={sectionTitle}>Referencias personales (mínimo 2)</p>
        {refs.slice(0, 2).map((ref, i) => (
          <div key={i}>
            <p className="text-xs text-slate-500 mb-2">
              Referencia personal {i + 1}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                className={fieldClass}
                value={ref.nombre}
                onChange={(e) => updateRef(i, "nombre", e.target.value)}
                placeholder="Nombre completo"
                disabled={disabled}
              />
              <input
                className={fieldClass}
                value={ref.telefono}
                onChange={(e) => updateRef(i, "telefono", e.target.value)}
                placeholder="Teléfono"
                disabled={disabled}
              />
              <input
                className={fieldClass}
                value={ref.relacion}
                onChange={(e) => updateRef(i, "relacion", e.target.value)}
                placeholder="Familiar, Amigo..."
                disabled={disabled}
              />
            </div>
          </div>
        ))}

        <p
          className={sectionTitle}
          style={{ marginTop: "12px" }}
        >
          Referencias comerciales (3)
        </p>
        <p className="text-xs text-slate-500 -mt-2 mb-2">
          Empresas, proveedores o clientes que puedan certificar su actividad
          económica
        </p>
        {refs.slice(2).map((ref, j) => {
          const i = j + 2;
          return (
            <div key={i}>
              <p className="text-xs text-slate-500 mb-2">
                Referencia comercial {j + 1}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className={fieldClass}
                  value={ref.nombre}
                  onChange={(e) => updateRef(i, "nombre", e.target.value)}
                  placeholder="Empresa o nombre"
                  disabled={disabled}
                />
                <input
                  className={fieldClass}
                  value={ref.telefono}
                  onChange={(e) => updateRef(i, "telefono", e.target.value)}
                  placeholder="Teléfono"
                  disabled={disabled}
                />
                <input
                  className={fieldClass}
                  value={ref.relacion}
                  onChange={(e) => updateRef(i, "relacion", e.target.value)}
                  placeholder="Proveedor, Cliente, Banco..."
                  disabled={disabled}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Autorizaciones requeridas
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autorizaBuro}
            onChange={(e) => setAutorizaBuro(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 accent-violet-500"
          />
          <span className="text-sm text-slate-300">
            <strong className="text-slate-100">
              Autorizo consulta al buró de crédito.
            </strong>{" "}
            Autorizo a la institución financiera a consultar mi historial crediticio
            en la Central de Riesgo de la Superintendencia de Bancos de la República
            Dominicana y/o entidades de información crediticia, conforme a la Ley
            172-13.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={aceptaPolitica}
            onChange={(e) => setAceptaPolitica(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 accent-violet-500"
          />
          <span className="text-sm text-slate-300">
            <strong className="text-slate-100">
              Acepto la política de tratamiento de datos.
            </strong>{" "}
            Declaro que los datos proporcionados son verídicos y autorizo su uso
            para fines de evaluación crediticia, conforme a la normativa vigente.
          </span>
        </label>
        {(!autorizaBuro || !aceptaPolitica) && (
          <p className="text-xs text-amber-400">
            Ambas autorizaciones son obligatorias para continuar.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          disabled ||
          !autorizaBuro ||
          !aceptaPolitica ||
          !!cedulaError
        }
        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitLabel}
      </button>
    </form>
  );
}
