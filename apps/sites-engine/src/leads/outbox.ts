// LeadOutbox: la Idempotency-Key la genera el MOTOR, una por envio recibido, y viaja con el item para los reintentos.
// La implementacion en memoria NO es durable: el almacen durable es decision humana (README).
// Acotada (hallazgo de Vercel Security Review en dash#1267, DoS por memoria): la ruta publica de formularios la comparte
// entre visitantes anonimos, asi que tiene tope global y por sitio, caducidad y liberacion del payload. Sin cupo, enqueue
// lanza OutboxFullError ANTES de guardar nada y la ruta responde 503 (no-enviado) sin llamar al core.
import { randomUUID } from 'node:crypto';

export interface OutboxItem { id: string; siteId: string; key: string; fingerprint: string; payload: unknown; createdAt: number; attempts: number; status: 'pending' | 'sent' }
export interface LeadOutbox {
  enqueue(i: { siteId: string; fingerprint: string; payload: unknown }): Promise<OutboxItem>;
  markSent(id: string): Promise<void>;
  /** Rechazo definitivo (el core respondio 4xx): el item y su payload se borran; no hay nada que reintentar. */
  release(id: string): Promise<void>;
  drain(send: (item: OutboxItem) => Promise<boolean>): Promise<{ sent: number; pending: number }>;
}

export class OutboxFullError extends Error {
  constructor(readonly scope: 'global' | 'site') {
    super(`outbox sin cupo (${scope})`);
  }
}

export const DEDUPE_WINDOW_MS = 60_000;      // mismo cuerpo en 60 s -> misma clave (doble clic)
export const PENDING_TTL_MS = 15 * 60_000;   // un pendiente sin entregar en 15 min se descarta (no es durable)
export const MAX_ITEMS = 2_000;              // tope global por instancia
export const MAX_PER_SITE = 200;             // tope por sitio: un sitio no agota el cupo de los demas

export interface MemoryOutboxOptions { now?: () => number; maxItems?: number; maxPerSite?: number; pendingTtlMs?: number }

export function createMemoryOutbox(o: MemoryOutboxOptions = {}): LeadOutbox & { size(): number } {
  const now = o.now ?? Date.now;
  const maxItems = o.maxItems ?? MAX_ITEMS;
  const maxPerSite = o.maxPerSite ?? MAX_PER_SITE;
  const pendingTtl = o.pendingTtlMs ?? PENDING_TTL_MS;
  const items = new Map<string, OutboxItem>();
  const index = new Map<string, string>();     // siteId\nfingerprint -> id (deduplicacion en O(1))
  const perSite = new Map<string, number>();
  const ik = (siteId: string, fingerprint: string) => `${siteId}\n${fingerprint}`;

  function remove(it: OutboxItem): void {
    items.delete(it.id);
    if (index.get(ik(it.siteId, it.fingerprint)) === it.id) index.delete(ik(it.siteId, it.fingerprint));
    const n = (perSite.get(it.siteId) ?? 1) - 1;
    if (n > 0) perSite.set(it.siteId, n); else perSite.delete(it.siteId);
  }

  // Caducidad: los enviados solo se guardan mientras dura la ventana de deduplicacion; los pendientes, hasta su TTL.
  // El recorrido esta acotado por maxItems, no por el historico.
  function prune(t: number): void {
    for (const it of items.values()) {
      const age = t - it.createdAt;
      if ((it.status === 'sent' && age >= DEDUPE_WINDOW_MS) || (it.status === 'pending' && age >= pendingTtl)) remove(it);
    }
  }

  return {
    async enqueue({ siteId, fingerprint, payload }) {
      const t = now();
      prune(t);
      const prev = items.get(index.get(ik(siteId, fingerprint)) ?? '');
      if (prev && t - prev.createdAt < DEDUPE_WINDOW_MS) return prev; // doble clic -> misma clave
      if (prev) remove(prev);
      if (items.size >= maxItems) throw new OutboxFullError('global');
      if ((perSite.get(siteId) ?? 0) >= maxPerSite) throw new OutboxFullError('site');
      const it: OutboxItem = { id: randomUUID(), siteId, key: randomUUID(), fingerprint, payload, createdAt: t, attempts: 0, status: 'pending' };
      items.set(it.id, it);
      index.set(ik(siteId, fingerprint), it.id);
      perSite.set(siteId, (perSite.get(siteId) ?? 0) + 1);
      return it;
    },
    async markSent(id) {
      const it = items.get(id);
      if (it) { it.status = 'sent'; it.payload = null; } // el payload (datos del visitante) se libera al entregarse
    },
    async release(id) {
      const it = items.get(id);
      if (it) remove(it);
    },
    async drain(send) {
      prune(now());
      let sent = 0, pending = 0;
      for (const it of [...items.values()].filter((x) => x.status === 'pending')) {
        it.attempts++;
        if (await send(it)) { it.status = 'sent'; it.payload = null; sent++; } else pending++;
      }
      return { sent, pending };
    },
    size: () => items.size,
  };
}
