// Nucleo de la puerta Lighthouse (ST2-08, 3.17b): mediana de corridas y deteccion de memoria.
import { readFileSync } from 'node:fs';

export const MIN_PERF = 85;
export const RUNS = 3;

export function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** scores en 0..100. Exige exactamente RUNS corridas: con menos no hay mediana fiable. */
export function evaluateRuns(scores, min = MIN_PERF) {
  if (scores.length !== RUNS) throw new Error(`se requieren ${RUNS} corridas, hay ${scores.length}`);
  const med = median(scores);
  return { median: med, pass: med >= min };
}

/** 'entorno' = no cabe en memoria: la corrida no mide nada y NUNCA publica PASS. */
export function memoryVerdict(availableMb, minMb) {
  return availableMb >= minMb ? 'ok' : 'entorno';
}

export function availableMemoryMb(os) {
  try {
    const kb = /MemAvailable:\s+(\d+) kB/.exec(readFileSync('/proc/meminfo', 'utf8'))?.[1];
    if (kb) return Number(kb) / 1024;
  } catch { /* sin /proc: usa os */ }
  return os.freemem() / 1048576;
}
