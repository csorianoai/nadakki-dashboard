/** Finance Core API types — data_source drives DEMO badge. */

export interface FinanceKpisResponse {
  data_source?: string;
  total_mrr?: number;
  arr_projected?: number;
  active_subscriptions?: number;
  tenants_managed?: number;
  tenants_unmanaged?: number;
}

export interface MrrByCoreItem {
  core_code: string;
  display_name: string;
  mrr: number;
  tenant_count: number;
  color_hex?: string;
}

export interface MrrByCoreResponse {
  data_source?: string;
  cores: MrrByCoreItem[];
}

export interface TenantFinancialRow {
  tenant_id: string;
  tenant_name: string;
  plan_name?: string;
  mrr_contribution: number;
  subscription_status: string;
  current_period_end?: string;
  next_renewal_at?: string;
}

export interface TenantFinancialsResponse {
  data_source?: string;
  tenant_id: string;
  financials: TenantFinancialRow;
}

export interface TenantFinancialsListResponse {
  data_source?: string;
  items: TenantFinancialRow[];
  total: number;
  page: number;
  page_size: number;
}

export interface PopulationSummaryResponse {
  data_source?: string;
  total_professionals?: number;
  total_entities_connected?: number;
  total_digital_agents_active?: number;
  tenants_managed?: number;
}

export interface PopulationTopTenant {
  tenant_id: string;
  tenant_name: string;
  activity_score: number;
  country_code?: string;
}

export interface PopulationTopUser {
  user_id: string;
  user_name: string;
  tenant_name: string;
  activity_score: number;
}

export interface PopulationTopTenantsResponse {
  data_source?: string;
  items: PopulationTopTenant[];
}

export interface PopulationTopUsersResponse {
  data_source?: string;
  items: PopulationTopUser[];
}

export interface ProfessionBreakdownItem {
  role_code: string;
  display_name: string;
  count: number;
}

export interface PopulationByCoreResponse {
  data_source?: string;
  core_code: string;
  display_name?: string;
  professions: ProfessionBreakdownItem[];
  tenants_connected?: number;
}

export interface PopulationByFamilyRow {
  tenant_id: string;
  tenant_name: string;
  country_code: string;
  count: number;
}

export interface PopulationByFamilyResponse {
  data_source?: string;
  family: string;
  total: number;
  rows: PopulationByFamilyRow[];
}

export interface PopulationEntityTypeItem {
  entity_code: string;
  display_name: string;
  count: number;
  tenant_ids?: string[];
}

export interface PopulationByEntityTypeResponse {
  data_source?: string;
  types: PopulationEntityTypeItem[];
}

export interface PopulationCountryItem {
  country_code: string;
  country_name: string;
  tenants_count: number;
  users_count: number;
}

export interface PopulationByCountryResponse {
  data_source?: string;
  countries: PopulationCountryItem[];
}

export interface DigitalAgentsTenantRow {
  tenant_id: string;
  tenant_name: string;
  active_agents: number;
}

export interface PopulationDigitalAgentsResponse {
  data_source?: string;
  total_active_agents?: number;
  executions_per_day?: number;
  success_rate_pct?: number;
  by_tenant: DigitalAgentsTenantRow[];
}

export interface PopulationActivityCoreMetric {
  core_code: string;
  dau?: number;
  wau?: number;
  mau?: number;
}

export interface PopulationInactiveTenant {
  tenant_id: string;
  tenant_name: string;
  activity_score: number;
  churn_risk: boolean;
}

export interface PopulationActivityResponse {
  data_source?: string;
  period: string;
  by_core: PopulationActivityCoreMetric[];
  inactive_tenants: PopulationInactiveTenant[];
}

export interface RegistryProfession {
  id: string;
  core_code: string;
  role_code: string;
  family: string;
  display_name: string;
  sort_order: number;
}

export interface RegistryEntityType {
  id: string;
  core_code: string;
  entity_code: string;
  display_name: string;
  description?: string;
  sort_order: number;
}

export interface RegistryProfessionsResponse {
  data_source?: string;
  professions: RegistryProfession[];
}

export interface RegistryEntityTypesResponse {
  data_source?: string;
  entity_types: RegistryEntityType[];
}
