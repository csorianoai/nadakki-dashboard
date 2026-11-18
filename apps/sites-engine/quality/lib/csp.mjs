// Verificacion de CSP por respuesta (ST2-08, decision D5-bis): sin unsafe-inline/unsafe-eval y sin scripts inline sin nonce o hash.
import { createHash } from 'node:crypto';

export function scriptHash(content) {
  return `sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}`;
}

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const DATA_TYPES = /type\s*=\s*["']?(application\/(ld\+)?json|importmap|speculationrules)/i;

/** Devuelve la lista de problemas ([] = cumple). */
export function checkCsp({ csp, html }) {
  if (!csp || !String(csp).trim()) return ['falta la cabecera Content-Security-Policy'];
  const problems = [];
  for (const bad of ["'unsafe-inline'", "'unsafe-eval'"]) {
    if (csp.includes(bad)) problems.push(`la politica contiene ${bad.replace(/'/g, '')}`);
  }
  const nonces = new Set([...csp.matchAll(/'nonce-([^']+)'/g)].map((m) => m[1]));
  const hashes = new Set([...csp.matchAll(/'(sha(?:256|384|512)-[^']+)'/g)].map((m) => m[1]));
  for (const m of String(html ?? '').matchAll(INLINE_SCRIPT)) {
    const attrs = m[1];
    if (/\bsrc\s*=/.test(attrs) || DATA_TYPES.test(attrs)) continue;
    const nonce = /\bnonce\s*=\s*["']([^"']+)["']/.exec(attrs)?.[1];
    if (nonce ? nonces.has(nonce) : hashes.has(scriptHash(m[2]))) continue;
    problems.push(`script inline sin nonce o hash valido: ${m[2].slice(0, 40).trim()}`);
  }
  return problems;
}
