// Modelo de bloques: solo CONTENIDO. Rechaza todo lo que pueda ejecutar codigo (<script>, javascript:, on*).
import type { Block } from '@/core/types';

export class BlockError extends Error {
  constructor(readonly reason: 'script' | 'url' | 'handler' | 'shape') {
    super(`block:${reason}`); // mensaje fijo: nunca incluye el contenido rechazado
    this.name = 'BlockError';
  }
}

const SCRIPT_TAG = /<\s*\/?\s*script/iu;
const BAD_URL = /^[\s\p{Cc}]*(javascript|vbscript|data\s*:\s*text\/html)/iu;
const BAD_URL_LOOSE = /(?:^|[^a-z0-9])(?:j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t|vbscript)\s*:/iu;
const HANDLER_KEY = /^on[a-z]/iu;
const HANDLER_ATTR = /\son[a-z]+\s*=/iu;

function scanString(s: string): void {
  if (SCRIPT_TAG.test(s)) throw new BlockError('script');
  if (BAD_URL.test(s) || BAD_URL_LOOSE.test(s)) throw new BlockError('url');
  if (HANDLER_ATTR.test(s) && /</.test(s)) throw new BlockError('handler');
}

function scan(v: unknown, depth: number): void {
  if (depth > 12) throw new BlockError('shape');
  if (typeof v === 'string') return scanString(v);
  if (Array.isArray(v)) return v.forEach((x) => scan(x, depth + 1));
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (HANDLER_KEY.test(k)) throw new BlockError('handler');
      scan(x, depth + 1);
    }
  }
}

/** Lanza BlockError si algun bloque trae algo ejecutable. Falla cerrada: la pagina entera se descarta. */
export function validateBlocks(blocks: unknown): Block[] {
  if (!Array.isArray(blocks)) throw new BlockError('shape');
  for (const b of blocks) {
    if (!b || typeof b !== 'object' || typeof (b as Block).type !== 'string') throw new BlockError('shape');
    scan(b, 0);
  }
  return blocks as Block[];
}
