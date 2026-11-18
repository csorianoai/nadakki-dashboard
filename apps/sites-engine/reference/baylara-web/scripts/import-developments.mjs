// CSV → content/developments/<slug>.json (one file per project).
//   node scripts/import-developments.mjs <file.csv> [--dry]
// Columns: see scripts/developments-template.csv. Lists use "|" between items; unitTypes use
// "tipo ES / type EN ; sq ft ; price-from" per item. An empty cell keeps the value already in the file.
// Images are media.json ids: register each render first (with its permission) or the build will block.
import fs from 'node:fs';

const [file, flag] = process.argv.slice(2);
if (!file) { console.error('Uso: node scripts/import-developments.mjs <archivo.csv> [--dry]'); process.exit(1); }
const dry = flag === '--dry';

function parseCSV(text) {
  const rows = []; let row = []; let cell = ''; let q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);
const num = (s) => { const n = Number(String(s).replace(/[$,\s]/g, '')); return Number.isFinite(n) && s.trim() !== '' ? n : null; };
const bool = (s) => /^(1|true|s[ií]|yes)$/i.test(s.trim());
const pair = (es, en) => (es || en ? { es: es || en, en: en || es } : undefined);
const STATUS = { preventa: 'preconstruction', preconstruction: 'preconstruction', 'en construcción': 'construction', construccion: 'construction', construction: 'construction', terminado: 'completed', completed: 'completed' };
const zones = JSON.parse(fs.readFileSync(new URL('../content/zones.json', import.meta.url))).items.map((z) => z.slug);
const media = JSON.parse(fs.readFileSync(new URL('../content/media.json', import.meta.url))).items;

const [head, ...data] = parseCSV(fs.readFileSync(file, 'utf8'));
const H = head.map((h) => h.trim());
const problems = [];
let written = 0;

for (const r of data) {
  const c = Object.fromEntries(H.map((h, i) => [h, (r[i] ?? '').trim()]));
  const slug = (c.slug || c.name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) continue;
  const out = new URL(`../content/developments/${slug}.json`, import.meta.url);
  const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
  const next = {
    slug,
    sample: c.sample ? bool(c.sample) : prev.sample ?? false,
    authorized: c.authorized ? bool(c.authorized) : prev.authorized ?? false,
    order: num(c.order ?? '') ?? prev.order,
    name: c.name || prev.name,
    developer: c.developer || prev.developer,
    zone: c.zone || prev.zone,
    address: c.address || prev.address || null,
    status: STATUS[(c.status || '').toLowerCase()] || prev.status || 'preconstruction',
    delivery: pair(c.delivery_es, c.delivery_en) || prev.delivery || null,
    priceFrom: num(c.priceFrom ?? '') ?? prev.priceFrom ?? null,
    units: num(c.units ?? '') ?? prev.units ?? null,
    floors: num(c.floors ?? '') ?? prev.floors ?? null,
    beds: c.beds || prev.beds || null,
    sqft: c.sqft || prev.sqft || null,
    unitTypes: c.unitTypes ? list(c.unitTypes).map((u) => { const [type, sqft, price] = u.split(';').map((x) => x.trim()); const [es, en] = type.split('/').map((x) => x.trim()); return { type: pair(es, en), sqft: sqft || null, priceFrom: num(price || '') }; }) : prev.unitTypes || [],
    description: c.description_es || c.description_en ? { es: list(c.description_es || c.description_en), en: list(c.description_en || c.description_es) } : prev.description,
    features: c.features_es || c.features_en ? { es: list(c.features_es || c.features_en), en: list(c.features_en || c.features_es) } : prev.features,
    amenities: c.amenities_es || c.amenities_en ? { es: list(c.amenities_es || c.amenities_en), en: list(c.amenities_en || c.amenities_es) } : prev.amenities,
    images: c.images ? list(c.images) : prev.images || [],
    heroImages: c.heroImages ? list(c.heroImages) : prev.heroImages,
    website: c.website || prev.website || null,
    disclaimer: pair(c.disclaimer_es, c.disclaimer_en) || prev.disclaimer || null,
    geo: c.lat && c.lng ? { lat: Number(c.lat), lng: Number(c.lng) } : prev.geo || null
  };
  if (!next.name) problems.push(`${slug}: falta name`);
  if (!zones.includes(next.zone)) problems.push(`${slug}: zona "${next.zone}" no existe en zones.json (${zones.join(', ')})`);
  if (!next.developer) problems.push(`${slug}: falta developer`);
  if (!next.disclaimer) problems.push(`${slug}: falta el aviso legal de la promotora (disclaimer_es / disclaimer_en)`);
  for (const id of [...next.images, ...(next.heroImages || [])]) {
    const it = media[id];
    if (!it) problems.push(`${slug}: imagen "${id}" no está en content/media.json`);
    else if (!it.permission && !next.sample) problems.push(`${slug}: imagen "${id}" sin permission (promotora o propietario)`);
  }
  if (!dry) { fs.mkdirSync(new URL('../content/developments/', import.meta.url), { recursive: true }); fs.writeFileSync(out, JSON.stringify(next, null, 2) + '\n'); }
  written++;
  console.log(`${dry ? '(prueba) ' : ''}${slug}.json`);
}
console.log(`\n${written} proyecto(s) ${dry ? 'leídos' : 'escritos'} en content/developments/.`);
if (problems.length) console.log(`\nRevisar antes de publicar:\n  - ${problems.join('\n  - ')}`);
