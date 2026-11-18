// Hoja base de la plantilla Baylara: reglas de globals.css (lineas 19-254, sin :root: los tokens salen de theme.ts). Same-origin por la CSP.
// Pendiente (PARTES siguientes): globals.css 255-599 (dossiers, hero v2, galeria, filtros, colapsables).
import { fontFaceCss } from './fonts';
import { themeCss } from './theme';

const BASE = `

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { margin: 0; background: #fff; color: var(--ink); font-family: var(--font-sans), 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; }
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; }
h1, h2, h3 { margin: 0; font-weight: 500; }
p { margin: 0; }
ul, ol { margin: 0; padding: 0; list-style: none; }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 16px; top: 16px; z-index: 100; background: #fff; padding: 12px 16px; }

.serif { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; }
.container { max-width: 1240px; margin: 0 auto; padding: 0 var(--pad); }
.narrow { max-width: 880px; }
.section { padding: var(--section) 0; }
.sand { background: var(--sand-light); }
.navy { background: var(--navy); color: #fff; }
.stack { display: flex; flex-direction: column; gap: 16px; }
.stack-lg { display: flex; flex-direction: column; gap: 40px; }
.row { display: flex; flex-wrap: wrap; gap: clamp(32px, 5vw, 72px); align-items: flex-start; }
.row > .grow { flex: 999 1 520px; min-width: 0; }
.row > .side { flex: 1 1 340px; min-width: 0; }
.grid { display: grid; gap: 28px; grid-template-columns: repeat(auto-fill, minmax(min(var(--min, 300px), 100%), 1fr)); }
.split { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 20px; }

.eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold-text); }
.navy .eyebrow { color: var(--gold-light); }
.rule { display: block; width: 64px; height: 1px; background: var(--gold-light); }
.h1 { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; font-size: clamp(40px, 5.4vw, 76px); line-height: 1.04; text-wrap: balance; }
.h2 { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; font-size: clamp(30px, 3.6vw, 50px); line-height: 1.1; text-wrap: balance; }
.h3 { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; font-size: 28px; line-height: 1.15; }
.lead { font-size: clamp(16px, 1.4vw, 18px); line-height: 1.65; color: var(--text); max-width: 680px; }
.navy .lead { color: var(--on-navy); }
.body { font-size: 17px; line-height: 1.75; color: var(--text); }
.small { font-size: 12.5px; line-height: 1.6; color: var(--muted); }
.navy .small { color: var(--on-navy-2); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 26px; font-size: 14px; font-weight: 600; letter-spacing: 0.03em; text-decoration: none; border: 1px solid transparent; cursor: pointer; background: none; }
.btn-primary { background: var(--navy); color: #fff; }
.btn-primary:hover { background: #18344f; }
.btn-sand { background: var(--sand); color: var(--navy); }
.btn-sand:hover { background: #f1e8d9; }
.btn-outline { border-color: var(--navy); color: var(--navy); }
.btn-outline-light { border-color: rgba(255,255,255,0.7); color: #fff; }
.btn-row { display: flex; flex-wrap: wrap; gap: 12px; }
.link { font-size: 14px; font-weight: 600; padding: 12px 0; border-bottom: 1px solid var(--gold); text-decoration: none; color: var(--navy); align-self: flex-start; }

/* Header */
.header { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid var(--line); }
.header-in { height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 20px; max-width: 1320px; margin: 0 auto; padding: 0 var(--pad); }
.logo { display: flex; flex-direction: column; gap: 6px; text-decoration: none; color: var(--navy); }
.logo-word { font-family: var(--font-serif), 'Times New Roman', serif; font-size: 27px; letter-spacing: 0.22em; line-height: 1; }
.logo-sub { display: flex; align-items: center; gap: 8px; font-size: 9px; font-weight: 600; letter-spacing: 0.28em; }
.logo-sub::before { content: ''; width: 18px; height: 1px; background: var(--gold-light); }
.nav { display: none; gap: 24px; }
.nav a { font-size: 14px; font-weight: 500; color: var(--navy); text-decoration: none; padding: 8px 0; border-bottom: 1px solid transparent; }
.nav a[aria-current='page'] { border-bottom-color: var(--gold); }
.header-actions { display: flex; align-items: center; gap: 12px; }
.lang { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; height: 40px; border: 1px solid #c9bfae; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: var(--navy); text-decoration: none; }
.header .btn { min-height: 42px; padding: 0 16px; font-size: 13px; display: none; }
.menu { position: relative; }
.menu summary { list-style: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--navy); }
.menu summary::-webkit-details-marker { display: none; }
.menu .ic-close { display: none; }
.menu[open] .ic-open { display: none; }
.menu[open] .ic-close { display: block; }
.menu-panel { position: fixed; left: 0; right: 0; top: 76px; bottom: 0; overflow-y: auto; background: #fff; padding: 8px var(--pad) 96px; border-top: 1px solid var(--line); }
.menu-panel a { display: flex; align-items: center; min-height: 54px; border-bottom: 1px solid #eee7da; color: var(--navy); text-decoration: none; font-family: var(--font-serif), 'Times New Roman', serif; font-size: 24px; }
.menu-panel .btn { display: flex; margin-top: 20px; font-family: inherit; font-size: 14px; border: 0; color: #fff; }
@media (min-width: 1180px) {
  .nav { display: flex; }
  .header .btn { display: inline-flex; }
  .menu { display: none; }
}

.preview-bar { background: var(--sand); color: var(--navy); font-size: 12px; text-align: center; padding: 6px var(--pad); }

/* Hero */
.hero { position: relative; background: var(--navy); color: #fff; overflow: hidden; }
.hero-media { position: absolute; inset: 0; }
.hero-media img { width: 100%; height: 100%; object-fit: cover; }
.hero-media::after { content: ''; position: absolute; inset: 0; background: rgba(14, 34, 54, 0.55); }
.hero-in { position: relative; padding-top: clamp(72px, 10vw, 140px); padding-bottom: 56px; display: flex; flex-direction: column; gap: 24px; }
.hero .sub { max-width: 620px; font-size: clamp(16px, 1.4vw, 19px); line-height: 1.6; color: var(--on-navy); }
.page-hero { padding: clamp(48px, 6vw, 88px) 0 clamp(32px, 4vw, 56px); }

/* Search */
.search { margin-top: 16px; background: #fff; color: var(--ink); display: grid; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); gap: 1px; border: 1px solid #fff; }
.search .field { padding: 12px 18px; background: #fff; box-shadow: 1px 0 0 var(--line); }
.search label { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
.search select { width: 100%; border: 0; padding: 6px 0; background: transparent; font-size: 15px; }
.search button { min-height: 64px; border: 0; }

/* Cards */
.card { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: var(--ink); }
.ph { position: relative; aspect-ratio: 4 / 3; background: var(--mist); overflow: hidden; }
.ph img { width: 100%; height: 100%; object-fit: cover; }
.tag { position: absolute; top: 14px; left: 14px; background: #fff; color: var(--navy); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 10px; }
.tag-sample { left: auto; right: 14px; background: var(--navy); color: var(--sand-light); font-size: 10px; letter-spacing: 0.12em; }
.price { font-family: var(--font-serif), 'Times New Roman', serif; font-size: 30px; line-height: 1.1; }
.card-title { font-size: 15px; font-weight: 600; line-height: 1.4; }
.specs { margin-top: 4px; padding-top: 12px; border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 13px; }
.zone-tile .ph { aspect-ratio: 3 / 4; }
.zone-name { font-family: var(--font-serif), 'Times New Roman', serif; font-size: 27px; line-height: 1.1; }

.boxed { display: grid; gap: 1px; background: var(--line); border: 1px solid var(--line); grid-template-columns: repeat(auto-fit, minmax(min(var(--min, 320px), 100%), 1fr)); }
.boxed > * { background: #fff; padding: 32px; display: flex; flex-direction: column; gap: 12px; }
.navy .boxed { background: rgba(234,223,204,0.25); border-color: rgba(234,223,204,0.25); }
.navy .boxed > * { background: var(--navy); }
.num { font-family: var(--font-serif), 'Times New Roman', serif; font-size: 42px; line-height: 1; color: var(--gold); }
.topline { padding-top: 20px; border-top: 1px solid var(--navy); display: flex; flex-direction: column; gap: 12px; }
.ticks li { display: flex; gap: 14px; align-items: baseline; padding: 13px 0; border-bottom: 1px solid #eee7da; font-size: 15px; line-height: 1.55; }
.ticks li::before { content: ''; flex: 0 0 14px; height: 1px; background: var(--gold); transform: translateY(-4px); }
.navy .ticks li { border-bottom-color: rgba(234,223,204,0.2); color: var(--sand); }
.callout { background: var(--sand-light); border: 1px solid var(--line-2); padding: 32px; display: flex; flex-direction: column; gap: 12px; }
.facts { display: grid; gap: 0; padding: 1px 0 0 1px; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); margin: 0; }
.facts div { background: #fff; padding: 18px 20px; border: 1px solid var(--line); margin: -1px 0 0 -1px; }
.facts dt { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
.facts dd { margin: 6px 0 0; font-size: 17px; font-weight: 500; }
.gallery { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }
.gallery .main { grid-column: 1 / -1; height: clamp(240px, 38vw, 560px); aspect-ratio: auto; }
.faq details { border-bottom: 1px solid var(--line-2); }
.faq summary { min-height: 64px; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: 17px; font-weight: 600; cursor: pointer; list-style: none; padding: 12px 0; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: '+'; font-weight: 400; font-size: 22px; color: var(--gold-text); }
.faq details[open] summary::after { content: '−'; }
.faq details p { padding-bottom: 22px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border: 1px solid #c9bfae; background: #fff; font-size: 14px; font-weight: 500; text-decoration: none; color: var(--ink); cursor: pointer; }
.chip[aria-pressed='true'], .chip[aria-current='page'] { background: var(--navy); border-color: var(--navy); color: #fff; }
.tabs { display: flex; gap: 28px; overflow-x: auto; border-bottom: 1px solid var(--line); }
.tabs a { flex: 0 0 auto; min-height: 56px; display: flex; align-items: center; font-size: 14px; font-weight: 600; color: var(--navy); text-decoration: none; border-bottom: 2px solid transparent; }
.tabs a[aria-current='page'] { border-bottom-color: var(--gold); }
.portrait { position: relative; flex: 1 1 340px; aspect-ratio: 4 / 5; background: var(--line-2); overflow: hidden; }
.portrait img { width: 100%; height: 100%; object-fit: cover; }

/* Filters */
.filters { position: sticky; top: 76px; z-index: 10; background: #fff; border-bottom: 1px solid var(--line); }
.filters-in { display: grid; gap: 12px; padding-top: 16px; padding-bottom: 16px; grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); align-items: end; }
@media (max-width: 767px) { .filters { position: static; } }

/* Forms */
.form { background: #fff; color: var(--ink); border: 1px solid #e2dacb; padding: clamp(22px, 3vw, 36px); display: flex; flex-direction: column; gap: 20px; }
.fields { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(210px, 100%), 1fr)); }
.full { grid-column: 1 / -1; }
.f { display: flex; flex-direction: column; gap: 6px; }
.f label, .label { font-size: 12px; font-weight: 600; }
.input { height: 48px; border: 1px solid #a9b4be; padding: 0 12px; background: #fff; font-size: 16px; width: 100%; border-radius: 0; }
textarea.input { height: auto; padding: 12px; resize: vertical; }
.intents { border: 0; margin: 0; padding: 0; }
.intents legend { padding: 0; margin-bottom: 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
.intents label { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 1px solid #c9bfae; font-size: 14px; cursor: pointer; }
.intents input:checked + span { font-weight: 600; }
.intents label:has(input:checked) { background: var(--navy); border-color: var(--navy); color: #fff; }
.consent { display: flex; gap: 12px; align-items: flex-start; }
.consent input { width: 20px; height: 20px; margin: 2px 0 0; flex: 0 0 auto; accent-color: var(--navy); }
.consent label { font-size: 12.5px; line-height: 1.6; color: var(--text); font-weight: 400; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.error { color: #9b2c1f; font-size: 14px; }

/* Footer */
.footer { background: var(--navy); color: var(--sand); }
.footer a { color: var(--sand); text-decoration: none; }
.footer h2 { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold-light); margin-bottom: 8px; }
.footer-grid { padding-top: 72px; padding-bottom: 40px; display: grid; gap: 40px; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); }
.footer-col { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.footer-legal { border-top: 1px solid rgba(234,223,204,0.2); }
.footer-legal-in { padding-top: 32px; padding-bottom: 40px; display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; }
.eho { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #fff; font-size: 8.5px; font-weight: 600; letter-spacing: 0.12em; text-align: center; line-height: 1.3; }
.footer-text { flex: 1 1 520px; display: flex; flex-direction: column; gap: 10px; font-size: 12.5px; line-height: 1.65; color: var(--on-navy-2); }
.footer-text strong { color: var(--sand); font-weight: 600; }
.pending { background: #f4d58d; color: #3b2a00; padding: 0 4px; }

/* Sticky mobile bar */
.stickybar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #c9bfae; border-top: 1px solid #c9bfae; }
.stickybar a { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 60px; font-size: 15px; font-weight: 600; text-decoration: none; background: #fff; color: var(--navy); }
.stickybar a:first-of-type { background: var(--navy); color: #fff; }
.stickybar .stickybar-broker { grid-column: 1 / -1; background: var(--sand-light); color: var(--muted); font-size: 11px; letter-spacing: .04em; text-align: center; line-height: 22px; }
body { padding-bottom: 84px; }
@media (min-width: 768px) { .stickybar { display: none; } body { padding-bottom: 0; } }

/* ---------- Redesign v2 ---------- */
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.utility { background: var(--navy); color: var(--on-navy-2); font-size: 11.5px; letter-spacing: 0.04em; }
.utility-in { max-width: 1320px; margin: 0 auto; padding: 7px var(--pad); display: flex; flex-wrap: wrap; gap: 4px 10px; justify-content: flex-end; }
.langs { display: inline-flex; border: 1px solid #c9bfae; height: 40px; }
.langs > * { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: var(--navy); text-decoration: none; }
.langs .on { background: var(--navy); color: #fff; }
.btn-wa { display: none; }
.nav { gap: 22px; }
.nav a { font-size: 13.5px; letter-spacing: 0.02em; }
@media (min-width: 1180px) { .btn-wa { display: inline-flex; } }

.hero-home { min-height: 680px; display: flex; align-items: flex-end; }
.hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-title { max-width: 980px; font-size: clamp(40px, 5.8vw, 82px); }
.paths { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 1px; background: rgba(234,223,204,0.3); margin-top: 12px; border: 1px solid rgba(234,223,204,0.3); }
.path { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 4px 16px; align-items: center; padding: 24px 26px; background: rgba(14,34,54,0.92); color: #fff; text-decoration: none; transition: background .2s; }
.path:hover { background: #18344f; }
.path-label { font-family: var(--font-serif), 'Times New Roman', serif; font-size: clamp(24px, 2.4vw, 32px); line-height: 1.1; }
.path-text { grid-column: 1; font-size: 14px; color: var(--on-navy); }
.path svg { grid-row: 1 / 3; grid-column: 2; color: var(--gold-light); }
.hero-rent { align-self: flex-start; color: var(--sand); font-size: 14px; text-decoration: none; border-bottom: 1px solid var(--gold-light); padding: 6px 0; }
.hero-facts { display: flex; flex-wrap: wrap; gap: 12px 40px; padding: 8px 0; }
.hero-facts span { display: flex; flex-direction: column; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--on-navy-2); }
.hero-facts strong { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; font-size: 30px; letter-spacing: 0; text-transform: none; color: #fff; }

.trust { border-bottom: 1px solid var(--line); background: #fff; }
.trust-in { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 0; padding-top: 22px; padding-bottom: 22px; }
.trust-in li { font-size: 13px; font-weight: 500; color: var(--navy); padding: 0 18px; border-left: 1px solid var(--line-2); }
.trust-in li:first-child { border-left: 0; }

.badge-sample { display: inline-block; align-self: flex-start; background: #f4d58d; color: #3b2a00; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; padding: 4px 8px; }
.incomplete { background: #f4d58d; color: #3b2a00; font-size: 13px; padding: 10px var(--pad); text-align: center; }
.src { font-size: 11.5px; color: var(--muted); letter-spacing: 0.02em; }
.src-inline { font-size: 11.5px; color: var(--muted); }
.notice { align-self: flex-start; border: 1px solid var(--gold); color: var(--gold-text); font-size: 13px; font-weight: 600; padding: 10px 14px; background: #fff; }

.kpi { border-top: 2px solid var(--navy); padding-top: 16px; }
.kpi dl { margin: 12px 0 0; display: grid; gap: 12px; }
.kpi dl div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
.kpi dt { font-size: 13px; color: var(--muted); }
.kpi dd { margin: 0; font-family: var(--font-serif), 'Times New Roman', serif; font-size: 24px; line-height: 1; color: var(--navy); }
.kpi-inline { display: flex; align-items: baseline; gap: 14px; }
.kpi-inline span { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
.kpi-inline strong { font-family: var(--font-serif), 'Times New Roman', serif; font-weight: 500; font-size: 34px; color: var(--navy); }

.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
.table th, .table td { text-align: left; padding: 12px 14px 12px 0; border-bottom: 1px solid var(--line); white-space: nowrap; }
.table thead th { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--navy); }
.table tbody th { font-weight: 600; }
.table a { color: var(--navy); }
`;

export const baseCss = (): string => BASE;

/** Hoja completa de un sitio: fuentes + tokens validados + reglas base. */
export const siteCss = (theme: unknown): string => fontFaceCss() + themeCss(theme) + BASE;
