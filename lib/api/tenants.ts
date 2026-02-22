// lib/api/tenants.ts - Multi-Tenant Management
import { fetchAPI } from './base';

export interface Tenant {
  tenant_id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  decisions_this_month: number;
  email?: string;
  region?: string;
  created_at?: string;
}

export interface TenantListResponse {
  total: number;
  tenants: Tenant[];
}

export interface TenantCreateRequest {
  name: string;
  email: string;
  plan: string;
  region: string;
}

export interface TenantCreateResponse {
  success: boolean;
  tenant_id: string;
  api_key: string;
  message: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  decisions: number;
  features: string[];
}

export interface PricingResponse {
  plans: PricingPlan[];
}

export const tenantsAPI = {
  /** GET /api/v1/tenants - requires X-Role: admin (auth mock) */
  getListForSelector: () =>
    fetchAPI<TenantListResponse | { tenants?: unknown[]; data?: unknown[] }>('/api/v1/tenants', {
      role: 'admin',
    }),

  getAll: () =>
    fetchAPI<TenantListResponse>('/tenants'),
    
  getOne: (tenantId: string) =>
    fetchAPI<Tenant>(`/tenants/${tenantId}`),
    
  create: (data: TenantCreateRequest, adminKey: string) =>
    fetchAPI<TenantCreateResponse>('/tenants', {
      method: 'POST',
      adminKey,
      body: JSON.stringify(data),
    }),
    
  update: (tenantId: string, data: Partial<Tenant>, adminKey: string) =>
    fetchAPI(`/tenants/${tenantId}`, {
      method: 'PATCH',
      adminKey,
      body: JSON.stringify(data),
    }),
    
  suspend: (tenantId: string, adminKey: string) =>
    fetchAPI<{ success: boolean; message: string }>(
      `/tenants/${tenantId}/suspend`,
      { method: 'POST', adminKey }
    ),
    
  activate: (tenantId: string, adminKey: string) =>
    fetchAPI<{ success: boolean; message: string }>(
      `/tenants/${tenantId}/activate`,
      { method: 'POST', adminKey }
    ),
    
  getPricing: () =>
    fetchAPI<PricingResponse>('/pricing'),
};

export default tenantsAPI;
