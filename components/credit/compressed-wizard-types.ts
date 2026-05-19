import type { ApplicationMode } from "@/lib/credit-api";

/** Dealer compressed flow — aligned with Credit Core payloads (subset for speed). */
export type VehicleCondition = "new" | "used" | "cpo";

export interface ApplicantInfo {
  fullName: string;
  /** ISO date yyyy-mm-dd */
  dob: string;
  /** RD cédula normalized digits */
  nationalId: string;
  phone: string;
  email: string;
  addressLine: string;
  municipio?: string;
  provincia?: string;
}

export interface EmploymentInfo {
  employer: string;
  position: string;
  /** whole years for UX, mapped to months for API */
  yearsEmployed: number;
  monthlyIncome: number;
  otherIncome?: number;
}

export interface VehicleInfo {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  condition: VehicleCondition;
}

export type TermMonths = 24 | 36 | 48 | 60 | 72;

export interface DealTerms {
  salePrice: number;
  downPayment: number;
  tradeInValue?: number;
  termMonths: TermMonths;
  /** Display-only estimate; not a binding offer */
  estimatedMonthly?: number;
}

export interface WizardData {
  applicant: ApplicantInfo;
  employment: EmploymentInfo;
  vehicle: VehicleInfo;
  deal: DealTerms;
  mode: ApplicationMode;
  /** Compliance gates before submit */
  autoriza_buro: boolean;
  acepta_politica: boolean;
}

export const EMPTY_WIZARD_DATA: WizardData = {
  applicant: {
    fullName: "",
    dob: "",
    nationalId: "",
    phone: "",
    email: "",
    addressLine: "",
    municipio: "",
    provincia: "",
  },
  employment: {
    employer: "",
    position: "",
    yearsEmployed: 1,
    monthlyIncome: 0,
    otherIncome: 0,
  },
  vehicle: {
    condition: "used",
  },
  deal: {
    salePrice: 0,
    downPayment: 0,
    tradeInValue: 0,
    termMonths: 60,
  },
  mode: "HYBRID",
  autoriza_buro: false,
  acepta_politica: false,
};
