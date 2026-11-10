// Build gate. In production (VERCEL_ENV=production, or REQUIRE_COMPLIANCE=1) the build FAILS
// while required business data is missing. In preview it only prints what is pending.
import fs from 'node:fs';

const site = JSON.parse(fs.readFileSync(new URL('../content/site.json', import.meta.url)));
const legal = ['privacy', 'terms', 'accessibility'].map((n) => JSON.parse(fs.readFileSync(new URL(`../content/legal/${n}.json`, import.meta.url))));

// Florida Administrative Code 61J2-10.025 (advertising): the brokerage name as registered must appear
// in every ad, and the licensee's last name as registered with the Commission. License numbers and the
// brokerage phone are not required by the rule, so they are optional here (shown when filled in).
const src = (f) => fs.readFileSync(new URL(`../components/${f}`, import.meta.url), 'utf8');
const shell = src('Shell.js');
const pagesSrc = src('pages.js');
const count = (s, needle) => s.split(needle).length - 1;
const lastName = site.agent?.registeredLastName;

const required = [
  ['agent.name', site.agent?.name, 'Nombre del agente licenciado'],
  ['agent.registeredLastName', lastName, 'Apellido tal como está registrado en la licencia'],
  ['agent.name ⊃ registeredLastName', lastName && site.agent?.name?.includes(lastName) ? 'ok' : null, 'El nombre visible debe incluir el apellido registrado'],
  ['brokerage.name', site.brokerage?.name, 'Nombre de la correduría'],
  ['brokerage.nameVerified', site.brokerage?.nameVerified === true ? 'ok' : null, 'Nombre EXACTO de la correduría confirmado en DBPR (nameVerified: true)'],
  ['brokerage.address', site.brokerage?.address, 'Dirección de la correduría'],
  ['Shell.js: correduría junto a WhatsApp, teléfono y correo', count(shell, 'data-broker') >= 3 ? 'ok' : null, 'Nombre de la correduría junto a cada punto de contacto del pie'],
  ['Shell.js: correduría sobre la barra fija móvil', /className="stickybar"[^]*?data-broker-sticky[^]*?<\/nav>/.test(shell) ? 'ok' : null, 'Nombre de la correduría encima de la barra fija de WhatsApp y Llamar'],
  ['pages.js: correduría en Contacto', pagesSrc.includes('className="contact-broker" data-broker') ? 'ok' : null, 'Nombre de la correduría junto al contacto en la página de contacto'],
  ['Shell.js: Equal Housing', /Equal Housing Opportunity/i.test(shell) ? 'ok' : null, 'Logotipo y texto Equal Housing Opportunity en el pie'],
  ['contact.phone', site.contact?.phone, 'Teléfono (botón de llamada)'],
  ['contact.whatsapp', site.contact?.whatsapp, 'WhatsApp (botón fijo en móvil)'],
  ['contact.publicEmail', site.contact?.publicEmail, 'Email público (privacidad y baja de mensajes)'],
  ['legal.privacy.updated', legal[0].updated, 'Fecha de la política de privacidad revisada por abogado'],
  ['legal.terms.updated', legal[1].updated, 'Fecha de los términos revisados por abogado'],
  ['legal.accessibility.updated', legal[2].updated, 'Fecha de la declaración de accesibilidad revisada']
];

// Images: every image of a published listing or development must be in content/media.json with a
// registered permission from the developer or the owner (stock photos are not allowed there).
// Every registry item must have a source and either a stock license (Pexels/Unsplash) or that permission.
const media = JSON.parse(fs.readFileSync(new URL('../content/media.json', import.meta.url))).items;
const readDir = (d) => {
  const dir = new URL(`../content/${d}/`, import.meta.url);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => ({ file: `${d}/${f}`, ...JSON.parse(fs.readFileSync(new URL(f, dir))) }));
};
const listings = JSON.parse(fs.readFileSync(new URL('../content/listings.json', import.meta.url))).items;
const devs = readDir('developments');
const permitted = (it) => it?.permission && ['developer', 'owner', 'own'].includes(it.permission.type) && it.permission.grantedBy && it.permission.date;
const stockOk = (it) => ['Pexels', 'Unsplash'].includes(it?.source) && it?.license && it?.sourceUrl;

for (const [id, it] of Object.entries(media)) {
  required.push([`media.json: ${id}`, it.source && (stockOk(it) || permitted(it)) ? 'ok' : null, `Imagen "${id}" sin fuente y licencia o permiso registrado`]);
}
const refs = [
  ...listings.filter((x) => !x.sample).flatMap((x) => (x.photos || []).map((p) => [`listings.json: ${x.slug}`, p])),
  ...devs.filter((d) => !d.sample && d.authorized).flatMap((d) => [...(d.images || []), ...(d.heroImages || [])].map((p) => [d.file, p]))
];
for (const [where, ref] of refs) {
  required.push([`${where} → ${ref}`, permitted(media[ref]) ? 'ok' : null, `Imagen sin permiso registrado (promotora o propietario) en content/media.json`]);
}
// Pre-construction notice: one generic Baylara notice (ES/EN) shown on every development page
// (decision of the licensee). The developer name is optional: shown when known, never blocking.
const ui = JSON.parse(fs.readFileSync(new URL('../content/ui.json', import.meta.url)));
const propSrc = src('property.js');
if (devs.some((x) => !x.sample && x.authorized)) {
  required.push(['ui.json: dev_disclaimer_generic', ui.dev_disclaimer_generic?.es && ui.dev_disclaimer_generic?.en ? 'ok' : null, 'Aviso legal genérico de preconstrucción en ES y EN']);
  required.push(['property.js: aviso en cada ficha de desarrollo', propSrc.includes('t.dev_disclaimer_generic') ? 'ok' : null, 'El aviso legal de preconstrucción debe mostrarse en cada ficha de desarrollo']);
}

const missing = required.filter(([, v]) => v == null || String(v).trim() === '');
const isProd = process.env.VERCEL_ENV === 'production' || process.env.REQUIRE_COMPLIANCE === '1';

if (missing.length) {
  const lines = missing.map(([k, , label]) => `  - ${label} (${k})`).join('\n');
  if (isProd) {
    console.error(`\n✖ Publicación a producción bloqueada. Faltan datos obligatorios en content/:\n${lines}\n`);
    process.exit(1);
  }
  console.warn(`\n⚠ Vista previa: datos pendientes (se muestran como "Pendiente"):\n${lines}\n`);
} else {
  console.log('✔ Datos de cumplimiento completos.');
}
