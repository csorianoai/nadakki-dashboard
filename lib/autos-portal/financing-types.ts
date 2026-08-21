/** Autos ↔ Credit Hub financing bridge types (contract v1). */

export type FinancingApplicationStatus =
  | "PENDING"
  | "OFFERS_RECEIVED"
  | "OFFER_SELECTED"
  | "FUNDED"
  | "DECLINED"
  | "EXPIRED"
  | "ERROR";

export type FinancingBridgeState =
  | "IDLE"
  | "VALIDATING"
  | "CREATING_APPLICATION"
  | "REDIRECTING"
  | "PENDING"
  | "OFFERS_RECEIVED"
  | "OFFER_SELECTED"
  | "FUNDED"
  | "DECLINED"
  | "EXPIRED"
  | "ERROR";

export type CreateFinancingApplicationRequest = {
  requested_term_months: number;
  down_payment: number;
  return_path: string;
};

export type CreateFinancingApplicationResponse = {
  financingRequestId?: string;
  applicationId?: string;
  status?: FinancingApplicationStatus;
  creditHubUrl?: string;
  returnState?: string;
  created?: boolean;
};

export type FinancingApplicationStatusResponse = {
  applicationId: string;
  status: FinancingApplicationStatus | string;
  offerCount?: number;
  selectedOfferId?: string | null;
  bestOffer?: Record<string, unknown> | null;
  updatedAt?: string;
};

export type FinancingOffer = {
  offer_id: string;
  lender?: string;
  apr?: number;
  term_months?: number;
  monthly_payment?: number;
  fees?: number;
  expiration?: string;
};

export type FinancingBridgeInput = {
  vehicleId: string;
  vehiclePrice: number;
  downPayment: number;
  termMonths: number;
  returnPath: string;
  make?: string;
  model?: string;
  year?: number;
};
