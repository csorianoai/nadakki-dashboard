// lib/api/base.ts - Configuración base con manejo de errores TOP 0.1%
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://nadakki-ai-suite.onrender.com";

export { API_BASE };

export interface APIError {
  status: number;
  endpoint: string;
  error: { message: string; detail?: any };
}

export type FetchAPIOptions = RequestInit & {
  tenantId?: string;
  adminKey?: string;
  /** X-Role: admin - required for GET /api/v1/tenants */
  role?: 'admin' | string;
};

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchAPIOptions = {}
): Promise<T> {
  const { tenantId, adminKey, role, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...((fetchOptions.headers ?? {}) as Record<string, string>),
  };

  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  if (adminKey) headers['X-Admin-Key'] = adminKey;
  if (role) headers['X-Role'] = role;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg =
      response.status === 401
        ? 'No autorizado'
        : response.status === 403
          ? 'Acceso denegado'
          : response.status === 404
            ? 'Recurso no encontrado'
            : (errorBody?.error?.message ?? errorBody?.message ?? `HTTP ${response.status}`);
    throw {
      status: response.status,
      endpoint,
      error: { message: msg, detail: errorBody },
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

