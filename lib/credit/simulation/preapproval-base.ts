import { calculatePMT, calculateDTI, calculatePaymentCapacity } from "@/lib/credit/utils/financial-calculator";

export type PreApprovalStatus = "APROBABLE" | "AJUSTAR" | "RIESGO";

export interface PreApprovalInput {
  monthlyIncome: number;
  monthlyDebts: number;
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  dtiMax: number;
}

export interface PreApprovalResult {
  status: PreApprovalStatus;
  dti: number;
  estimatedPayment: number;
  paymentCapacity: number;
  reasons: string[];
  badge: { icon: string; label: string; color: string };
}

export function simulatePreApproval(input: PreApprovalInput): PreApprovalResult {
  const { monthlyIncome, monthlyDebts, loanAmount, annualRate, termMonths, dtiMax } = input;

  const estimatedPayment = calculatePMT(loanAmount, annualRate, termMonths);
  const totalDebt = monthlyDebts + estimatedPayment;
  const dti = calculateDTI(totalDebt, monthlyIncome);
  const paymentCapacity = calculatePaymentCapacity(monthlyIncome, monthlyDebts);

  const reasons: string[] = [];
  let status: PreApprovalStatus = "APROBABLE";

  if (monthlyIncome <= 0) {
    status = "RIESGO";
    reasons.push("Ingreso mensual no registrado");
  } else if (dti > dtiMax) {
    status = "RIESGO";
    reasons.push(`DTI proyectado ${dti.toFixed(1)}% excede el máximo institucional ${dtiMax}%`);
  } else if (dti > dtiMax * 0.85) {
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
