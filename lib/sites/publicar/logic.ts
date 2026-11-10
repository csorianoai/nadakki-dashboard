import type { Violation } from "../types";

export type FieldRef = { page: string; block: number | null } | null;

/** `pages[contact].body[2]` -> {page:"contact", block:2}; cualquier otro campo no se resuelve (queda como texto). */
export function parseField(field: string): FieldRef {
  const m = /^pages\[([^\]]+)\](?:\.body\[(\d+)\])?/.exec(field);
  return m ? { page: m[1], block: m[2] === undefined ? null : Number(m[2]) } : null;
}

export function violationKey(v: Violation, i: number): string {
  return `${v.rule_id}|${v.field}|${i}`;
}

/** Fecha de hoy local como AAAA-MM-DD. */
export function hoy(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export type OverrideCheck = { ok: true; expires_at: string; justification: string } | { ok: false; error: "justification" | "future" };

/** Justificacion no vacia y caducidad estrictamente posterior a hoy. */
export function checkOverride(justification: string, date: string, now = new Date()): OverrideCheck {
  const j = justification.trim();
  if (!j) return { ok: false, error: "justification" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date <= hoy(now)) return { ok: false, error: "future" };
  return { ok: true, justification: j, expires_at: `${date}T23:59:59Z` };
}
