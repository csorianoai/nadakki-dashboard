/**
 * Autos Portal TypeScript types.
 *
 * Mirrors backend Pydantic models from routers/autos_portal_router.py.
 */

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

export interface Vehicle {
  id: string;
  tenant_id: string;
  dealer_id: string;
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  legacy_vehicle_identifier?: string | null;
  trim?: string | null;
  body_type?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  drivetrain?: string | null;
  exterior_color?: string | null;
  interior_color?: string | null;
  mileage_km?: number | null;
  condition: string;
  price_rd?: number | null;
  price_usd?: number | null;
  description?: string | null;
  province?: string | null;
  municipality?: string | null;
  status?: string;
  cover_photo_url?: string | null;
  photo_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleCreatePayload {
  make: string;
  model: string;
  year: number;
  vin?: string;
  trim?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;
  mileage_km?: number;
  condition?: string;
  price_rd?: number;
  price_usd?: number;
  description?: string;
  province?: string;
  municipality?: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface VehicleSearchFilters {
  query?: string;
  make?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  condition?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  province?: string;
  page?: number;
  page_size?: number;
}

export interface VehicleSearchResult {
  vehicles: Vehicle[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface SearchFacets {
  facets: Record<string, Array<{ value: string; count: number }>>;
}

// ---------------------------------------------------------------------------
// VIN Decode
// ---------------------------------------------------------------------------

export interface VinDecodeResult {
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  trim?: string | null;
  body_type?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  manufacturer?: string | null;
  cache_hit: boolean;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "won"
  | "lost"
  | "archived";

export type LeadPriority = "low" | "normal" | "high" | "urgent";

export interface Lead {
  id: string;
  tenant_id: string;
  dealer_id: string;
  vehicle_id?: string | null;
  buyer_name: string;
  buyer_phone?: string | null;
  buyer_email?: string | null;
  buyer_message?: string | null;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  finance_interested: boolean;
  monthly_budget_rd?: number | null;
  created_at?: string;
  contacted_at?: string | null;
  closed_at?: string | null;
}

export interface LeadCreatePayload {
  vehicle_id?: string;
  buyer_name: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_message?: string;
  source?: string;
  priority?: string;
  finance_interested?: boolean;
  monthly_budget_rd?: number;
}

export interface LeadTransitionResult {
  lead_id: string;
  old_status: string;
  new_status: string;
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface FinanceCalculatePayload {
  vehicle_price: number;
  down_payment: number;
  annual_rate_pct: number;
  term_months: number;
}

export interface FinanceCalculateResult {
  monthly_payment: number;
  total_interest: number;
  total_cost: number;
  principal: number;
  annual_rate_pct: number;
  term_months: number;
  down_payment: number;
}

export interface FinanceInversePayload {
  monthly_budget: number;
  down_payment: number;
  annual_rate_pct: number;
  term_months: number;
}

export interface FinanceInverseResult {
  max_vehicle_price: number;
  monthly_budget: number;
  down_payment: number;
  annual_rate_pct: number;
  term_months: number;
}

export interface AmortizationPeriod {
  period: number;
  payment: number;
  principal_portion: number;
  interest_portion: number;
  remaining_balance: number;
}

export interface AmortizationResult {
  total_payments: number;
  total_interest: number;
  total_principal: number;
  periods: AmortizationPeriod[];
}

// ---------------------------------------------------------------------------
// Entitlements
// ---------------------------------------------------------------------------

export interface EntitlementDecision {
  allowed: boolean;
  capability: string;
  limit?: number | null;
  reason?: string | null;
}

// ---------------------------------------------------------------------------
// Billing Plans
// ---------------------------------------------------------------------------

export interface PlanInfo {
  slug: string;
  subtotal_rd: number;
  itbis: number;
  total_rd: number;
}
