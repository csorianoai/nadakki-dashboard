export interface AllowEntry { rule: string; route: string; reason: string; date: string }
export const AXE_TAGS: readonly string[];
export function withLanguages(routes: string[]): string[];
export function loadAllowlist(json: unknown): AllowEntry[];
export function applyAllowlist<T extends { id: string }>(violations: T[], route: string, entries: AllowEntry[]): T[];
export function runAxe(page: unknown): Promise<{ id: string; impact?: string | null; nodes: unknown[] }[]>;
