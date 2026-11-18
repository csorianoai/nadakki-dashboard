export const MIN_PERF: number;
export const RUNS: number;
export function median(xs: number[]): number;
export function evaluateRuns(scores: number[], min?: number): { median: number; pass: boolean };
export function memoryVerdict(availableMb: number, minMb: number): 'ok' | 'entorno';
export function availableMemoryMb(os: { freemem(): number }): number;
