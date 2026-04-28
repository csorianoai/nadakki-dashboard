import {
  calculatePMT,
  calculateLTV,
  calculateDTI,
  calculatePaymentCapacity,
  calculateAmountToFinance,
} from "@/lib/credit/utils/financial-calculator";
import { simulatePreApproval, type PreApprovalResult } from "./preapproval-base";

export type RiskBand = "BAJO" | "MEDIO" | "ALTO";

export interface RiskMultipliers {
  BAJO: number;
  MEDIO: number;
  ALTO: number;
}

export interface ScenarioInput {
  monthlyIncome: number;
  monthlyDebts: number;
  age: number;
  employmentYears: number;
  vehiclePrice: number;
  downPayment: number;
  termMonths: number;
  annualRate: number;
  /** DTI máximo institucional en porcentaje (ej. 40). */
  dtiMax: number;
  /** Fracción 0–1 para zona “ajustar” respecto a `dtiMax` en %. */
  dtiWarningRatio: number;
  /** LTV máximo permitido en porcentaje (ej. 95). */
  ltvMax: number;
  minRoiThreshold: number;
  riskMultipliers: RiskMultipliers;
  /** Ratio capacidad de pago (ingreso × ratio − deudas). */
  paymentCapacityRatio?: number;
  /** Plazo máximo sugerido en recomendaciones (meses). */
  maxTermMonths?: number;
}

export interface ScenarioResult extends PreApprovalResult {
  amountToFinance: number;
  ltv: number;
  totalToPay: number;
  totalInterest: number;
  grossROI: number;
  riskAdjustedROI: number;
  riskBand: RiskBand;
  approvalProbability: number;
  recommendations: string[];
}

function estimateLoanFromPayment(monthlyPayment: number, annualRate: number, months: number): number {
  if (months <= 0 || monthlyPayment <= 0) return 0;
  if (annualRate === 0) return monthlyPayment * months;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, months);
  return (monthlyPayment * (factor - 1)) / (monthlyRate * factor);
}

export type SimulationInputs = Omit<
  ScenarioInput,
  "dtiMax" | "dtiWarningRatio" | "ltvMax" | "minRoiThreshold" | "riskMultipliers" | "paymentCapacityRatio" | "maxTermMonths"
>;

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const {
    monthlyIncome,
    monthlyDebts,
    age,
    employmentYears,
    vehiclePrice,
    downPayment,
    termMonths,
    annualRate,
    dtiMax,
    dtiWarningRatio,
    ltvMax,
    minRoiThreshold,
    riskMultipliers,
  } = input;

  const paymentCapRatio = input.paymentCapacityRatio ?? 0.4;
  const maxTerm = input.maxTermMonths ?? 84;

  const amountToFinance = calculateAmountToFinance(vehiclePrice, downPayment);
  const ltv = calculateLTV(amountToFinance, vehiclePrice);
  const estimatedPayment = calculatePMT(amountToFinance, annualRate, termMonths);
  const totalToPay = estimatedPayment * termMonths;
  const totalInterest = Math.max(0, totalToPay - amountToFinance);
  const dti = calculateDTI(monthlyDebts + estimatedPayment, monthlyIncome);
  const paymentCapacity = calculatePaymentCapacity(monthlyIncome, monthlyDebts, paymentCapRatio);

  const grossROI = amountToFinance > 0 ? (totalInterest / amountToFinance) * 100 : 0;

  let riskBand: RiskBand = "MEDIO";
  if (dti < dtiMax * 0.6 && ltv < ltvMax * 0.85 && employmentYears >= 3) {
    riskBand = "BAJO";
  } else if (dti > dtiMax || ltv > ltvMax) {
    riskBand = "ALTO";
  }

  const mult = riskMultipliers[riskBand] ?? 0.75;
  const riskAdjustedROI = grossROI * mult;

  let approvalProbability = 100;
  if (dti > dtiMax) approvalProbability -= 50;
  else if (dti > dtiMax * dtiWarningRatio) approvalProbability -= 25;
  if (ltv > ltvMax) approvalProbability -= 30;
  if (employmentYears < 1) approvalProbability -= 15;
  if (age < 21 || age > 65) approvalProbability -= 10;
  if (estimatedPayment > paymentCapacity) approvalProbability -= 20;
  approvalProbability = Math.max(0, Math.min(100, approvalProbability));

  const baseResult = simulatePreApproval({
    monthlyIncome,
    monthlyDebts,
    loanAmount: amountToFinance,
    annualRate,
    termMonths,
    dtiMax,
    dtiWarningRatio,
    paymentCapacityRatio: paymentCapRatio,
  });

  const recommendations: string[] = [];

  if (dti > dtiMax * dtiWarningRatio) {
    const maxDebtPayment = (monthlyIncome * dtiMax) / 100 - monthlyDebts;
    const targetMonthly = Math.max(0, maxDebtPayment);
    const suggestedAmount = targetMonthly > 0 ? estimateLoanFromPayment(targetMonthly, annualRate, termMonths) : 0;
    if (suggestedAmount > 0 && suggestedAmount < amountToFinance) {
      const additionalDown = amountToFinance - suggestedAmount;
      recommendations.push(
        `Aumenta la cuota inicial en aprox. RD$${Math.round(additionalDown).toLocaleString("es-DO")} para acercar la relación deuda-ingresos al máximo del ${dtiMax}%`
      );
    }
  }

  if (ltv > ltvMax) {
    const minDownNeeded = vehiclePrice * (1 - ltvMax / 100);
    if (minDownNeeded > downPayment) {
      recommendations.push(
        `Cuota inicial mínima sugerida: RD$${Math.round(minDownNeeded).toLocaleString("es-DO")} para cumplir el LTV máximo del ${ltvMax}%`
      );
    }
  }

  if (grossROI < minRoiThreshold) {
    const longerTerm = Math.min(termMonths + 12, maxTerm);
    if (longerTerm > termMonths) {
      recommendations.push(`Considera un plazo de ${longerTerm} meses para mejorar el retorno sobre el principal para la institución`);
    }
  }

  if (estimatedPayment > paymentCapacity) {
    recommendations.push(
      `La cuota estimada supera la capacidad de pago calculada (RD$${paymentCapacity.toLocaleString("es-DO", { maximumFractionDigits: 0 })})`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Indicadores dentro de los rangos institucionales");
  }

  return {
    ...baseResult,
    amountToFinance,
    ltv,
    totalToPay,
    totalInterest,
    grossROI,
    riskAdjustedROI,
    riskBand,
    approvalProbability,
    recommendations,
  };
}
