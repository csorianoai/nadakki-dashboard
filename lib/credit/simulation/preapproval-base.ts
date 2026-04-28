import { calculatePMT, calculateDTI, calculatePaymentCapacity } from "@/lib/credit/utils/financial-calculator";

export type PreApprovalStatus = "APROBABLE" | "AJUSTAR" | "RIESGO";

export interface PreApprovalInput {
  monthlyIncome: number;
  monthlyDebts: number;
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  /** Máximo DTI institucional en porcentaje (ej. 45 para 45%). */
  dtiMax: number;
  /**
   * Fracción 0–1 del umbral DTI (en %) a partir de la cual la relación deuda-ingresos entra en zona “ajustar”.
   * Ej.: 0.85 → si DTI > dtiMax × 0.85 se considera cercano al límite. Por defecto 0.85.
   */
  dtiWarningRatio?: number;
  /**
   * Ratio de capacidad de pago (ingreso × ratio − deudas). Alineado con `calculatePaymentCapacity`.
   * Por defecto 0.4.
   */
  paymentCapacityRatio?: number;
}

export interface PreApprovalResult {
  status: PreApprovalStatus;
  dti: number;
  estimatedPayment: number;
  paymentCapacity: number;
  reasons: string[];
  badge: { icon: string; label: string; color: string };
}

/** Parámetros derivados del tenant para alinear wizard y simulador. */
export function preapprovalParamsFromTenantFractions(tenant: {
  dti_max?: number;
  default_rate?: number;
  dti_warning_ratio?: number;
  payment_capacity_ratio?: number;
}): Pick<PreApprovalInput, "dtiMax" | "annualRate" | "dtiWarningRatio" | "paymentCapacityRatio"> {
  return {
    dtiMax: (tenant.dti_max ?? 0.4) * 100,
    annualRate: tenant.default_rate ?? 16,
    dtiWarningRatio: tenant.dti_warning_ratio ?? 0.85,
    paymentCapacityRatio: tenant.payment_capacity_ratio ?? 0.4,
  };
}

export function simulatePreApproval(input: PreApprovalInput): PreApprovalResult {
  const { monthlyIncome, monthlyDebts, loanAmount, annualRate, termMonths, dtiMax } = input;
  const dtiWarningRatio = input.dtiWarningRatio ?? 0.85;
  const capacityRatio = input.paymentCapacityRatio ?? 0.4;

  const estimatedPayment = calculatePMT(loanAmount, annualRate, termMonths);
  const totalDebt = monthlyDebts + estimatedPayment;
  const dti = calculateDTI(totalDebt, monthlyIncome);
  const paymentCapacity = calculatePaymentCapacity(monthlyIncome, monthlyDebts, capacityRatio);

  const reasons: string[] = [];
  let status: PreApprovalStatus = "APROBABLE";

  if (monthlyIncome <= 0) {
    status = "RIESGO";
    reasons.push("Ingreso mensual no registrado");
  } else if (dti > dtiMax) {
    status = "RIESGO";
    reasons.push(`DTI proyectado ${dti.toFixed(1)}% excede el máximo institucional ${dtiMax}%`);
  } else if (dti > dtiMax * dtiWarningRatio) {
    status = "AJUSTAR";
    reasons.push(`DTI proyectado ${dti.toFixed(1)}% cercano al límite ${dtiMax}%`);
  }

  if (estimatedPayment > paymentCapacity && status !== "RIESGO") {
    status = status === "APROBABLE" ? "AJUSTAR" : status;
    reasons.push("Cuota estimada excede capacidad de pago calculada");
  }

  if (status === "APROBABLE" && reasons.length === 0) {
    reasons.push("Indicadores dentro de los rangos institucionales");
  }

  const badges: Record<PreApprovalStatus, { icon: string; label: string; color: string }> = {
    APROBABLE: { icon: "✔", label: "Aprobable", color: "emerald" },
    AJUSTAR: { icon: "⚠", label: "Ajustar", color: "amber" },
    RIESGO: { icon: "❌", label: "Riesgoso", color: "rose" },
  };

  return {
    status,
    dti,
    estimatedPayment,
    paymentCapacity,
    reasons,
    badge: badges[status],
  };
}
