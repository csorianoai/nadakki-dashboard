// LeadOutbox: la Idempotency-Key la genera el MOTOR, una por envio recibido, y viaja con el item para los reintentos.
// La implementacion en memoria es para pruebas y NO es durable: el almacen durable es decision humana (README).
import { randomUUID } from 'node:crypto';

export interface OutboxItem { id: string; siteId: string; key: string; fingerprint: string; payload: unknown; createdAt: number; attempts: number; status: 'pending' | 'sent' }
export interface LeadOutbox {
  enqueue(i: { siteId: string; fingerprint: string; payload: unknown }): Promise<OutboxItem>;
  markSent(id: string): Promise<void>;
  drain(send: (item: OutboxItem) => Promise<boolean>): Promise<{ sent: number; pending: number }>;
}

export const DEDUPE_WINDOW_MS = 60_000;

export function createMemoryOutbox(o: { now?: () => number } = {}): LeadOutbox {
  const now = o.now ?? Date.now;
  const items = new Map<string, OutboxItem>();
  return {
    async enqueue({ siteId, fingerprint, payload }) {
      const t = now();
      for (const it of items.values()) {
        if (it.siteId === siteId && it.fingerprint === fingerprint && t - it.createdAt < DEDUPE_WINDOW_MS) return it; // doble clic -> misma clave
      }
      const it: OutboxItem = { id: randomUUID(), siteId, key: randomUUID(), fingerprint, payload, createdAt: t, attempts: 0, status: 'pending' };
      items.set(it.id, it);
      return it;
    },
    async markSent(id) { const it = items.get(id); if (it) it.status = 'sent'; },
    async drain(send) {
      let sent = 0, pending = 0;
      for (const it of [...items.values()].filter((x) => x.status === 'pending')) {
        it.attempts++;
        if (await send(it)) { it.status = 'sent'; sent++; } else pending++;
      }
      return { sent, pending };
    },
  };
}
