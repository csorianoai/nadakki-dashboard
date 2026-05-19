"use client";

import type { ApplicationMode } from "@/lib/credit-api";
import type { TermMonths, VehicleCondition, WizardData } from "@/components/credit/compressed-wizard-types";

export const COMPRESSED_STEP_LABELS = [
  "Solicitante",
  "Empleo e ingreso",
  "Vehículo",
  "Operación",
  "Revisión",
] as const;

const TERM_OPTS: TermMonths[] = [24, 36, 48, 60, 72];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-rose-300" role="alert">
      {msg}
    </p>
  );
}

export function estimateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12;
  if (r <= 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

interface StepProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  errors: Partial<Record<string, string>>;
}

export function CompressedWizardStepApplicant({ data, onChange, errors }: StepProps) {
  const a = data.applicant;
  return (
    <div className="space-y-4" data-testid="cw-step-applicant">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Nombre completo *</span>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.fullName}
            onChange={(e) => onChange({ applicant: { ...a, fullName: e.target.value } })}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "err-fullName" : undefined}
          />
          <span id="err-fullName">
            <FieldError msg={errors.fullName} />
          </span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Fecha nacimiento *</span>
          <input
            type="date"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.dob}
            onChange={(e) => onChange({ applicant: { ...a, dob: e.target.value } })}
            aria-invalid={Boolean(errors.dob)}
          />
          <FieldError msg={errors.dob} />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Cédula (solo dígitos) *</span>
        <input
          inputMode="numeric"
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={a.nationalId}
          onChange={(e) =>
            onChange({
              applicant: { ...a, nationalId: e.target.value.replace(/\D/g, "").slice(0, 11) },
            })
          }
          aria-invalid={Boolean(errors.nationalId)}
        />
        <FieldError msg={errors.nationalId} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Teléfono *</span>
          <input
            type="tel"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.phone}
            onChange={(e) => onChange({ applicant: { ...a, phone: e.target.value } })}
            autoComplete="tel"
          />
          <FieldError msg={errors.phone} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Email *</span>
          <input
            type="email"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.email}
            onChange={(e) => onChange({ applicant: { ...a, email: e.target.value } })}
            autoComplete="email"
          />
          <FieldError msg={errors.email} />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Dirección *</span>
        <input
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={a.addressLine}
          onChange={(e) => onChange({ applicant: { ...a, addressLine: e.target.value } })}
        />
        <FieldError msg={errors.addressLine} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Municipio</span>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.municipio ?? ""}
            onChange={(e) => onChange({ applicant: { ...a, municipio: e.target.value } })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Provincia</span>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={a.provincia ?? ""}
            onChange={(e) => onChange({ applicant: { ...a, provincia: e.target.value } })}
          />
        </label>
      </div>
    </div>
  );
}

export function CompressedWizardStepEmployment({ data, onChange, errors }: StepProps) {
  const e = data.employment;
  return (
    <div className="space-y-4" data-testid="cw-step-employment">
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Empleador *</span>
        <input
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={e.employer}
          onChange={(ev) => onChange({ employment: { ...e, employer: ev.target.value } })}
        />
        <FieldError msg={errors.employer} />
      </label>
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Puesto *</span>
        <input
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={e.position}
          onChange={(ev) => onChange({ employment: { ...e, position: ev.target.value } })}
        />
        <FieldError msg={errors.position} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Antigüedad (años) *</span>
          <input
            type="range"
            min={0}
            max={40}
            className="mt-2 w-full accent-violet-500"
            value={e.yearsEmployed}
            onChange={(ev) =>
              onChange({ employment: { ...e, yearsEmployed: Number(ev.target.value) } })
            }
            aria-valuemin={0}
            aria-valuemax={40}
            aria-valuenow={e.yearsEmployed}
          />
          <p className="mt-1 text-xs text-slate-500">{e.yearsEmployed} años</p>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Ingreso mensual (RD$) *</span>
          <input
            type="number"
            min={0}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={e.monthlyIncome || ""}
            onChange={(ev) =>
              onChange({ employment: { ...e, monthlyIncome: Number(ev.target.value) || 0 } })
            }
          />
          <FieldError msg={errors.monthlyIncome} />
        </label>
      </div>
      <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <summary className="cursor-pointer text-sm text-slate-300">Otros ingresos (opcional)</summary>
        <input
          type="number"
          min={0}
          className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={e.otherIncome ?? 0}
          onChange={(ev) =>
            onChange({ employment: { ...e, otherIncome: Number(ev.target.value) || 0 } })
          }
        />
      </details>
    </div>
  );
}

interface VehicleStepProps extends StepProps {
  onVinDecode: () => void;
  vinBusy: boolean;
}

export function CompressedWizardStepVehicle({ data, onChange, errors, onVinDecode, vinBusy }: VehicleStepProps) {
  const v = data.vehicle;
  return (
    <div className="space-y-4" data-testid="cw-step-vehicle">
      <label className="block">
        <span className="text-xs font-medium text-slate-400">VIN (17 caracteres)</span>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            className="min-h-[44px] flex-1 rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 font-mono text-sm uppercase text-white"
            value={v.vin ?? ""}
            maxLength={17}
            onChange={(e) => onChange({ vehicle: { ...v, vin: e.target.value.toUpperCase() } })}
            aria-label="VIN"
          />
          <button
            type="button"
            onClick={onVinDecode}
            disabled={vinBusy}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {vinBusy ? "…" : "Decodificar año"}
          </button>
        </div>
        <FieldError msg={errors.vinOrVehicle} />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Año *</span>
          <input
            type="number"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={v.year ?? ""}
            onChange={(e) =>
              onChange({ vehicle: { ...v, year: Number(e.target.value) || undefined } })
            }
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Marca *</span>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={v.make ?? ""}
            onChange={(e) => onChange({ vehicle: { ...v, make: e.target.value } })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Modelo *</span>
          <input
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={v.model ?? ""}
            onChange={(e) => onChange({ vehicle: { ...v, model: e.target.value } })}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Kilometraje</span>
        <input
          type="number"
          min={0}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={v.mileage ?? ""}
          onChange={(e) =>
            onChange({ vehicle: { ...v, mileage: Number(e.target.value) || undefined } })
          }
        />
      </label>
      <fieldset>
        <legend className="text-xs font-medium text-slate-400">Condición *</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {(
            [
              ["new", "Nuevo"],
              ["used", "Usado"],
              ["cpo", "CPO"],
            ] as [VehicleCondition, string][]
          ).map(([val, lab]) => (
            <label
              key={val}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2"
            >
              <input
                type="radio"
                name="vcond"
                checked={v.condition === val}
                onChange={() => onChange({ vehicle: { ...v, condition: val } })}
              />
              <span className="text-sm text-slate-200">{lab}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function CompressedWizardStepDeal({ data, onChange, errors }: StepProps) {
  const d = data.deal;
  const principal = Math.max(0, d.salePrice - d.downPayment);
  const est = estimateMonthlyPayment(principal, 0.09, d.termMonths);
  return (
    <div className="space-y-4" data-testid="cw-step-deal">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Precio venta (RD$) *</span>
          <input
            type="number"
            min={0}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={d.salePrice || ""}
            onChange={(e) =>
              onChange({
                deal: {
                  ...d,
                  salePrice: Number(e.target.value) || 0,
                  estimatedMonthly: estimateMonthlyPayment(
                    Math.max(0, Number(e.target.value) - d.downPayment),
                    0.09,
                    d.termMonths,
                  ),
                },
              })
            }
          />
          <FieldError msg={errors.salePrice} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400">Inicial (RD$) *</span>
          <input
            type="number"
            min={0}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
            value={d.downPayment || ""}
            onChange={(e) => {
              const down = Number(e.target.value) || 0;
              onChange({
                deal: {
                  ...d,
                  downPayment: down,
                  estimatedMonthly: estimateMonthlyPayment(
                    Math.max(0, d.salePrice - down),
                    0.09,
                    d.termMonths,
                  ),
                },
              });
            }}
          />
        </label>
      </div>
      <details className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <summary className="cursor-pointer text-sm text-slate-300">Trade-in (opcional)</summary>
        <input
          type="number"
          min={0}
          className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={d.tradeInValue ?? 0}
          onChange={(e) =>
            onChange({ deal: { ...d, tradeInValue: Number(e.target.value) || 0 } })
          }
        />
      </details>
      <label className="block">
        <span className="text-xs font-medium text-slate-400">Plazo (meses) *</span>
        <select
          className="mt-1 min-h-[44px] w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white"
          value={d.termMonths}
          onChange={(e) => {
            const termMonths = Number(e.target.value) as TermMonths;
            onChange({
              deal: {
                ...d,
                termMonths,
                estimatedMonthly: estimateMonthlyPayment(principal, 0.09, termMonths),
              },
            });
          }}
        >
          {TERM_OPTS.map((t) => (
            <option key={t} value={t}>
              {t} meses
            </option>
          ))}
        </select>
      </label>
      <div
        className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-sm text-teal-100"
        data-testid="cw-estimated-payment"
      >
        <p className="font-semibold">Cuota estimada (9% anual referencial)</p>
        <p className="mt-1 font-mono text-lg">
          RD${" "}
          {est.toLocaleString("es-DO", {
            maximumFractionDigits: 0,
          })}
        </p>
        <p className="mt-1 text-xs text-teal-200/80">Principal a financiar: RD$ {principal.toLocaleString("es-DO")}</p>
      </div>
    </div>
  );
}

const MODE_OPTIONS: { value: ApplicationMode; label: string; desc: string }[] = [
  { value: "AI_ONLY", label: "Solo IA", desc: "Evaluación automática" },
  { value: "BANK_ONLY", label: "Solo banco", desc: "Paquete institucional" },
  { value: "HYBRID", label: "Híbrido", desc: "IA + banco (recomendado)" },
];

export function CompressedWizardStepReview({
  data,
  onChange,
}: Omit<StepProps, "errors"> & { errors?: StepProps["errors"] }) {
  return (
    <div className="space-y-4" data-testid="cw-step-review">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        <h3 className="text-sm font-semibold text-white">Resumen</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Cliente: {data.applicant.fullName} · {data.applicant.phone}
          </li>
          <li>
            Ingreso: RD$ {data.employment.monthlyIncome.toLocaleString("es-DO")}
          </li>
          <li>
            Vehículo: {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}
          </li>
          <li>
            Operación: RD$ {data.deal.salePrice.toLocaleString("es-DO")} · plazo {data.deal.termMonths} meses
          </li>
        </ul>
      </div>
      <fieldset>
        <legend className="text-xs font-medium text-slate-400">Ejecución multi-lender (modo expediente)</legend>
        <div className="mt-2 space-y-2">
          {MODE_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3"
            >
              <input
                type="radio"
                name="cmode"
                checked={data.mode === o.value}
                onChange={() => onChange({ mode: o.value })}
                className="mt-1 accent-violet-500"
              />
              <span>
                <span className="text-sm font-medium text-white">{o.label}</span>
                <span className="ml-2 text-xs text-slate-500">{o.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={data.autoriza_buro}
          onChange={(e) => onChange({ autoriza_buro: e.target.checked })}
          className="mt-1 min-h-[44px] min-w-[44px] accent-violet-500"
        />
        <span>Autorizo consulta buró / centrales de riesgo conforme a política institucional.</span>
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={data.acepta_politica}
          onChange={(e) => onChange({ acepta_politica: e.target.checked })}
          className="mt-1 min-h-[44px] min-w-[44px] accent-violet-500"
        />
        <span>Acepto tratamiento de datos personales (Ley 172-13).</span>
      </label>
    </div>
  );
}
