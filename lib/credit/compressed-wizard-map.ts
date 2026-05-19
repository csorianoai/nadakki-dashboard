import type { ApplicantPayload, ApplicationMode, VehiclePayload } from "@/lib/credit-api";
import type { WizardData } from "@/components/credit/compressed-wizard-types";

export interface WizardSubmitBundle {
  mode: ApplicationMode;
  applicant: ApplicantPayload;
  vehicle: VehiclePayload;
}

/** Maps compressed wizard capture to existing Credit Core save payloads. */
export function wizardDataToCreditPayloads(data: WizardData): WizardSubmitBundle {
  const { applicant, employment, vehicle, deal, mode } = data;
  const months = Math.max(0, Math.round(employment.yearsEmployed * 12));
  const loanHint = Math.max(0, deal.salePrice - deal.downPayment);

  const applicantPayload: ApplicantPayload = {
    nombre_completo: applicant.fullName.trim(),
    fecha_nacimiento: applicant.dob,
    cedula: applicant.nationalId.replace(/\D/g, ""),
    telefono_celular: applicant.phone.trim(),
    email: applicant.email.trim(),
    direccion: applicant.addressLine.trim(),
    municipio: applicant.municipio?.trim() || undefined,
    provincia: applicant.provincia?.trim() || undefined,
    nombre_empleador: employment.employer.trim(),
    cargo: employment.position.trim(),
    antiguedad_empleo_meses: months || undefined,
    ingreso_mensual_declarado: employment.monthlyIncome,
    otros_ingresos: employment.otherIncome ?? 0,
    tipo_empleo: "FORMAL",
    monto_solicitado: loanHint,
    plazo_meses: deal.termMonths,
    inicial_disponible: deal.downPayment,
    autoriza_buro: data.autoriza_buro,
    acepta_politica_datos: data.acepta_politica,
    national_id: applicant.nationalId.replace(/\D/g, ""),
    monthly_income: employment.monthlyIncome,
  };

  const vehiclePayload: VehiclePayload = {
    marca: vehicle.make?.trim() || undefined,
    modelo: vehicle.model?.trim() || undefined,
    anio: vehicle.year ?? undefined,
    vin_chasis: vehicle.vin?.trim().toUpperCase() || undefined,
    km_odometro: vehicle.mileage ?? 0,
    condicion: vehicle.condition === "new" ? "nuevo" : vehicle.condition === "cpo" ? "cpo" : "usado",
    precio_venta: deal.salePrice,
    loan_amount_requested: loanHint,
    vehicle_value: deal.salePrice,
    make: vehicle.make ?? undefined,
    model: vehicle.model ?? undefined,
    year: vehicle.year ?? undefined,
    vin: vehicle.vin ?? undefined,
  };

  return { mode, applicant: applicantPayload, vehicle: vehiclePayload };
}
