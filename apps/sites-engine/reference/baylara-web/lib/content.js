// Content access. All copy and data live in /content; this module only reads, filters and validates it.
import fs from 'node:fs';
import nodePath from 'node:path';
import site from '../content/site.json';
import ui from '../content/ui.json';
import listingsData from '../content/listings.json';
import zonesData from '../content/zones.json';
import { readJsonc } from './jsonc';

const ROOT = process.cwd();

export const isProduction = process.env.VERCEL_ENV === 'production';
// Sample records are visible only outside production, and never with SHOW_SAMPLES=0.
export const showSamples = !isProduction && process.env.SHOW_SAMPLES !== '0';

export function getSite() {
  return site;
}

// Pick the language variant of a bilingual value ({es, en}) or return plain values unchanged.
export function L(v, lang) {
  if (v && typeof v === 'object' && !Array.isArray(v) && ('es' in v || 'en' in v)) return v[lang] ?? v.es ?? v.en;
  return v;
}

// A sourced datum is either a plain value or { value, source, date }.
export function V(d) {
  return d && typeof d === 'object' && !Array.isArray(d) && 'value' in d ? d.value : d;
}

export function t(lang) {
  const out = {};
  for (const k of Object.keys(ui)) out[k] = L(ui[k], lang);
  return out;
}

export function getPage(name) {
  return JSON.parse(fs.readFileSync(nodePath.join(ROOT, 'content', 'pages', `${name}.json`), 'utf8'));
}

export function getLegal(name) {
  return JSON.parse(fs.readFileSync(nodePath.join(ROOT, 'content', 'legal', `${name}.json`), 'utf8'));
}

function readDir(dir) {
  const full = nodePath.join(ROOT, 'content', dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => (f.endsWith('.json') || f.endsWith('.jsonc')) && !f.startsWith('_'))
    .map((f) => readJsonc(nodePath.join(full, f)));
}

/* ---------- Listings ---------- */
export function getListings() {
  return listingsData.items.filter((x) => showSamples || !x.sample);
}
export function getListing(slug) {
  return getListings().find((x) => x.slug === slug) || null;
}

/* ---------- New developments (one file per project in content/developments) ---------- */
// In production a project is listed only when the developer authorized us to market it.
export function getDevelopments() {
  return readDir('developments')
    .filter((d) => (d.sample ? showSamples : isProduction ? d.authorized === true : true))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
}
export function getDevelopment(slug) {
  return getDevelopments().find((d) => d.slug === slug) || null;
}

/* ---------- Zones ---------- */
export function getZones() {
  return zonesData.items;
}
export function getZone(slug) {
  return zonesData.items.find((z) => z.slug === slug) || null;
}

/* ---------- Buildings ---------- */
// A block is complete when it has its source and date and its required values.
const hasSrc = (b) => !!(b && b.source && b.date);
export function buildingCompleteness(b) {
  const s = b.summary || {};
  const checks = {
    summary: hasSrc(s) && V(s.yearBuilt) != null && V(s.floors) != null && V(s.units) != null,
    hoa: hasSrc(b.hoa) && Array.isArray(b.hoa.rows) && b.hoa.rows.length > 0,
    rules: hasSrc(b.rules) && V(b.rules.rental?.minimumTerm) != null && V(b.rules.pets?.allowed) != null,
    structural: hasSrc(b.structural) && V(b.structural.milestoneInspection?.status) != null && V(b.structural.sirs?.status) != null
  };
  return { ...checks, publishable: Object.values(checks).every(Boolean) };
}
export function getBuildings() {
  return readDir('buildings')
    .filter((b) => (b.sample ? showSamples : isProduction ? buildingCompleteness(b).publishable : true))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
}
export function getBuilding(slug) {
  return getBuildings().find((b) => b.slug === slug) || null;
}

/* ---------- Market reports ---------- */
export function getReports() {
  return readDir('market')
    .filter((r) => (r.sample ? showSamples : true))
    .sort((a, b) => String(b.month).localeCompare(String(a.month)));
}
export function getReport(slug) {
  return getReports().find((r) => r.slug === slug) || null;
}

/* ---------- Helpers ---------- */
// Value to display for a compliance field: real value, or "Pendiente" outside production.
export function pending(value, lang) {
  if (value) return value;
  return lang === 'es' ? 'Pendiente' : 'Pending';
}
export function digits(s) {
  return String(s || '').replace(/\D/g, '');
}
export function formatPrice(n, lang, rent) {
  if (n == null) return null;
  const s = '$' + Number(n).toLocaleString('en-US');
  return rent ? s + (lang === 'es' ? ' /mes' : ' /mo') : s;
}
export function waHref(text) {
  const n = digits(site.contact.whatsapp);
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
export function telHref() {
  return site.contact.phone ? `tel:${site.contact.phone.replace(/[^\d+]/g, '')}` : null;
}
export function monthLabel(ym, lang) {
  if (!ym) return '';
  const [y, m] = String(ym).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
