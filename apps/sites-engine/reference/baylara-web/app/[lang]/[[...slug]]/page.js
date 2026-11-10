import { notFound } from 'next/navigation';
import Shell from '../../../components/Shell';
import * as P from '../../../components/pages';
import { LANGS, ROUTES, UTILITY, path, resolve } from '../../../lib/routes';
import { getListings, getListing, getDevelopments, getDevelopment, getZones, getZone, getBuildings, getBuilding, getReports, getReport, getPage, getLegal, L, t as tt, isProduction } from '../../../lib/content';
import { zoneName } from '../../../lib/view';

export const dynamicParams = false;

export function generateStaticParams() {
  const out = [];
  for (const lang of LANGS) {
    for (const key of Object.keys(ROUTES)) {
      const slug = ROUTES[key][lang];
      out.push({ lang, slug: slug ? [slug] : [] });
    }
    for (const x of getListings()) out.push({ lang, slug: [ROUTES.listings[lang], x.slug] });
    for (const d of getDevelopments()) out.push({ lang, slug: [ROUTES.developments[lang], d.slug] });
    for (const z of getZones()) out.push({ lang, slug: [ROUTES.areas[lang], z.slug] });
    for (const b of getBuildings()) out.push({ lang, slug: [ROUTES.buildings[lang], b.slug] });
    for (const r of getReports()) out.push({ lang, slug: [ROUTES.market[lang], r.slug] });
  }
  return out;
}

function lookup(lang, slug) {
  const r = resolve(lang, slug || []);
  if (!r) return null;
  if (r.detail === 'listing' && !getListing(r.param)) return null;
  if (r.detail === 'development' && !getDevelopment(r.param)) return null;
  if (r.detail === 'zone' && !getZone(r.param)) return null;
  if (r.detail === 'building' && !getBuilding(r.param)) return null;
  if (r.detail === 'report' && !getReport(r.param)) return null;
  return r;
}

const META_PAGE = { home: 'home', listings: 'listings', developments: 'developments', areas: 'areas', international: 'international', sell: 'sell', rentals: 'rentals', puntacana: 'puntacana', buildings: 'buildings', market: 'market' };

function titleFor(r, lang) {
  if (r.detail === 'listing') { const x = getListing(r.param); return { title: L(x.title, lang), description: (L(x.description, lang) || [])[0] || L(x.title, lang) }; }
  if (r.detail === 'development') { const d = getDevelopment(r.param); return { title: d.name, description: (L(d.description, lang) || [])[0] || d.name }; }
  if (r.detail === 'zone') { const z = getZone(r.param); return { title: zoneName(z, lang), description: L(z.lead, lang) }; }
  if (r.detail === 'building') { const b = getBuilding(r.param); return { title: b.name, description: lang === 'es' ? `Guía del edificio ${b.name}: cuotas, reglas de alquiler, seguridad estructural y ventas recientes.` : `${b.name} building guide: fees, rental rules, structural safety and recent sales.` }; }
  if (r.detail === 'report') { const x = getReport(r.param); return { title: L(x.title, lang), description: L(x.summary, lang) }; }
  if (r.key === 'developments') {
    // Name only the areas that have published projects, from the data (in production only authorized projects count).
    const m = getPage('developments').meta;
    const areas = [...new Set(getDevelopments().map((d) => d.area).filter(Boolean))];
    const list = areas.length > 1 ? `${areas.slice(0, -1).join(', ')} ${lang === 'es' ? 'y' : 'and'} ${areas.at(-1)}` : areas[0] || '';
    return { title: L(m.title, lang), description: L(m.descriptionTpl, lang).replace('{areas}', list) };
  }
  if (META_PAGE[r.key]) { const m = getPage(META_PAGE[r.key]).meta; return { title: L(m.title, lang), description: L(m.description, lang) }; }
  if (UTILITY.includes(r.key)) { const t = tt(lang); return { title: r.key === 'sent' ? t.msg_sent_title : t.msg_fail_title }; }
  if (r.key === 'privacy' || r.key === 'terms' || r.key === 'accessibility') { const d = getLegal(r.key); return { title: L(d.title, lang) }; }
  const m = getPage('misc')[r.key]?.meta;
  return m ? { title: L(m.title, lang), description: L(m.description, lang) } : {};
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params;
  const r = lookup(lang, slug);
  if (!r) return {};
  const { title, description } = titleFor(r, lang);
  const languages = Object.fromEntries(LANGS.map((l) => [l, path(l, r.key, r.param)]));
  languages['x-default'] = '/';
  return {
    title: r.key === 'home' ? title : `${title} · Baylara`,
    description,
    alternates: { canonical: path(lang, r.key, r.param), languages },
    robots: isProduction && !UTILITY.includes(r.key) ? undefined : { index: false, follow: false },
    openGraph: { title, description, siteName: 'Baylara', locale: lang === 'es' ? 'es_US' : 'en_US', type: 'website' }
  };
}

export default async function Page({ params }) {
  const { lang, slug } = await params;
  const r = lookup(lang, slug);
  if (!r) notFound();
  const other = lang === 'es' ? 'en' : 'es';
  const alt = path(other, r.key, r.param);
  let body;
  switch (r.key) {
    case 'home': body = <P.Home lang={lang} />; break;
    case 'listings': body = r.param ? <P.ListingDetail lang={lang} slug={r.param} /> : <P.Listings lang={lang} />; break;
    case 'developments': body = r.param ? <P.Development lang={lang} slug={r.param} /> : <P.Developments lang={lang} />; break;
    case 'areas': body = r.param ? <P.Zone lang={lang} slug={r.param} /> : <P.Areas lang={lang} />; break;
    case 'buildings': body = r.param ? <P.Building lang={lang} slug={r.param} /> : <P.Buildings lang={lang} />; break;
    case 'market': body = r.param ? <P.MarketReport lang={lang} slug={r.param} /> : <P.Market lang={lang} />; break;
    case 'accessibility': body = <P.Legal lang={lang} name="accessibility" />; break;
    case 'international': body = <P.International lang={lang} />; break;
    case 'sell': body = <P.Sell lang={lang} />; break;
    case 'rentals': body = <P.Rentals lang={lang} />; break;
    case 'puntacana': body = <P.PuntaCana lang={lang} />; break;
    case 'about': body = <P.About lang={lang} />; break;
    case 'contact': body = <P.Contact lang={lang} />; break;
    case 'privacy': body = <P.Legal lang={lang} name="privacy" />; break;
    case 'sent': body = <P.LeadResult lang={lang} ok />; break;
    case 'notSent': body = <P.LeadResult lang={lang} ok={false} />; break;
    case 'terms': body = <P.Legal lang={lang} name="terms" />; break;
    default: notFound();
  }
  const active = r.detail === 'listing' ? (getListing(r.param).kind === 'rent' ? 'rentals' : 'listings') : r.key;
  const t = tt(lang);
  let waText;
  if (r.detail === 'listing') { const x = getListing(r.param); waText = t.wa_listing.replace('{p}', L(x.title, lang)); }
  if (r.detail === 'development') waText = t.wa_listing.replace('{p}', getDevelopment(r.param).name);
  if (r.detail === 'building') waText = L(getPage('buildings').waMsg, lang).replace('{b}', getBuilding(r.param).name);
  if (r.detail === 'zone') waText = t.wa_zone.replace('{z}', zoneName(getZone(r.param), lang));
  const overlay = r.key === 'home' || r.key === 'buildings' || r.key === 'areas' || r.detail === 'listing' || r.detail === 'development';
  return <Shell lang={lang} active={active} alt={alt} waText={waText} overlay={overlay}>{body}</Shell>;
}
