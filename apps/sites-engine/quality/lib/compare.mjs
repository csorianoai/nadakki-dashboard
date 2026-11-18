/* global process */
// Nucleo puro del comparador de capturas (ST2-08): sin red, sin navegador.
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/** E2 3.5: 0,1 % de pixeles. */
export const DEFAULT_THRESHOLD = 0.001;
export const WIDTHS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

const SITE_ID = /^[a-z0-9][a-z0-9-]{0,62}$/i;

function checkSite(siteId) {
  if (typeof siteId !== 'string' || !SITE_ID.test(siteId)) throw new Error('site_id invalido');
}

/** La linea base vive SIEMPRE bajo <raiz>/<site_id>/: nunca se mezclan sitios. */
export function baselineDir(root, siteId) {
  checkSite(siteId);
  return path.join(root, siteId);
}

/** Una carpeta de referencia solo vale para el sitio cuyo id es su ultimo segmento. */
export function assertBaselineOwnership(dir, siteId) {
  checkSite(siteId);
  if (path.basename(path.resolve(dir)) !== siteId) throw new Error(`la linea base ${dir} no pertenece al sitio ${siteId}`);
}

export function isCi(env = process.env) {
  return ['true', '1'].includes(String(env.CI ?? '').toLowerCase());
}

/** '/es/propiedades', 390 -> 'es_propiedades-390.png' */
export function captureName(route, width) {
  const slug = route.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9-]+/g, '_') || 'raiz';
  return `${slug}-${width}.png`;
}

/** Compara dos PNG. Alto o ancho distintos fallan sin comparar pixeles; si no, falla si ratio > umbral. */
export function comparePng(ref, cand, { threshold }) {
  const a = PNG.sync.read(ref);
  const b = PNG.sync.read(cand);
  const base = { refHeight: a.height, candHeight: b.height, width: a.width, height: a.height, diffPng: null };
  if (a.height !== b.height) return { ...base, status: 'height', diffPixels: 0, ratio: 1 };
  if (a.width !== b.width) return { ...base, status: 'width', diffPixels: 0, ratio: 1 };
  const diff = new PNG({ width: a.width, height: a.height });
  const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const ratio = diffPixels / (a.width * a.height);
  return { ...base, status: ratio > threshold ? 'pixels' : 'ok', diffPixels, ratio, diffPng: diffPixels > 0 ? PNG.sync.write(diff) : null };
}
