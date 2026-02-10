// lib/api/base.ts - Configuración base con manejo de errores TOP 0.1%
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://nadakki-ai-suite.onrender.com';

export { API_BASE };

export interface APIError {
  status: number;
  endpoint: string;
  error: { message: string; detail?: any };
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit & { tenantId?: string; adminKey?: string } = {}
): Promise<T> {
  const { tenantId, adminKey, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw {
      status: response.status,
      endpoint,
      error: errorBody || { message: `HTTP ${response.status}` },
    } as APIError;
  }
  
  return response.json();
}

// Helper para requests con timeout
export async function fetchWithTimeout<T>(
  endpoint: string,
  options: RequestInit & { tenantId?: string; adminKey?: string; timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const result = await fetchAPI<T>(endpoint, { ...rest, signal: controller.signal });
    clearTimeout(id);
    return result;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
