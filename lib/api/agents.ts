// lib/api/agents.ts - Canonical agent ID resolution via /api/v1/agents/ids
import { fetchAPI, APIError } from './base';

const STORAGE_KEY = 'nadakki_agents_ids';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

const memoryCacheByTenant = new Map<string, { map: Record<string, string>; ts: number }>();

function getStorageKey(tenantId: string): string {
  return `${STORAGE_KEY}_${tenantId}`;
}

function isAlreadyOperative(id: string): boolean {
  return id.includes('__') && id.toLowerCase().includes('agentoperative');
}

function loadFromSession(tenantId: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(getStorageKey(tenantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { map: Record<string, string>; ts: number };
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.map;
  } catch {
    return null;
  }
}

function saveToSession(tenantId: string, map: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      getStorageKey(tenantId),
      JSON.stringify({ map, ts: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

/** Fetch canonical agent ID map from GET /api/v1/agents/ids */
export async function getAgentIdMap(tenantId: string): Promise<Record<string, string>> {
  const cached = memoryCacheByTenant.get(tenantId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.map;
  }
  const fromSession = loadFromSession(tenantId);
  if (fromSession) {
    memoryCacheByTenant.set(tenantId, { map: fromSession, ts: Date.now() });
    return fromSession;
  }

  try {
    const res = await fetchAPI<{ success?: boolean; data?: Record<string, string> }>(
      '/api/v1/agents/ids',
      { tenantId }
    );
    const map = (res?.data ?? res) as Record<string, string>;
    if (!map || typeof map !== 'object') {
      memoryCacheByTenant.set(tenantId, { map: {}, ts: Date.now() });
      return {};
    }
    memoryCacheByTenant.set(tenantId, { map, ts: Date.now() });
    saveToSession(tenantId, map);
    return map;
  } catch (err) {
    const apiErr = err as APIError;
    const status = apiErr?.status;
    if (status === 404) {
      memoryCacheByTenant.set(tenantId, { map: {}, ts: Date.now() });
      return {};
    }
    if (status === 403) {
      throw new Error('agents/ids requiere rol admin');
    }
    throw err;
  }
}

function lookupInMap(map: Record<string, string>, key: string): string | undefined {
  const k = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (map[key]) return map[key];
  if (map[k]) return map[k];
  for (const [mk, mv] of Object.entries(map)) {
    if (mk.toLowerCase() === k) return mv;
    if (mk.toLowerCase().replace(/[^a-z0-9_]/g, '') === k) return mv;
  }
  return undefined;
}

/** Fallback: search agents and pick one ending in agentoperative */
async function resolveViaSearch(
  agentKeyOrId: string,
  tenantId: string
): Promise<string> {
  const search = encodeURIComponent(agentKeyOrId);
  const res = await fetchAPI<{ agents?: Array<{ id?: string; agent_id?: string }>; data?: { agents?: unknown[] } }>(
    `/api/v1/agents?search=${search}`,
    { tenantId }
  );
  const agents = (res as any)?.agents ?? (res as any)?.data?.agents ?? [];
  const list = Array.isArray(agents) ? agents : [];
  const operative = list.find(
    (a: { id?: string; agent_id?: string }) => {
      const id = String(a.agent_id ?? a.id ?? '');
      return id && id.toLowerCase().includes('agentoperative');
    }
  );
  const id = operative?.agent_id ?? operative?.id;
  return typeof id === 'string' ? id : '';
}

/**
 * Resolve agent key or ID to the canonical executable (operative) agent ID.
 * Fallback order: 1) already operative → as-is, 2) agents/ids map, 3) search API.
 */
export async function resolveExecutableAgentId(
  agentKeyOrId: string,
  tenantId: string
): Promise<string> {
  if (!agentKeyOrId?.trim()) return agentKeyOrId;

  if (isAlreadyOperative(agentKeyOrId)) {
    return agentKeyOrId;
  }

  const map = await getAgentIdMap(tenantId);
  const resolved = lookupInMap(map, agentKeyOrId);
  if (resolved) return resolved;

  const fromSearch = await resolveViaSearch(agentKeyOrId, tenantId);
  if (fromSearch) return fromSearch;

  return agentKeyOrId;
}
