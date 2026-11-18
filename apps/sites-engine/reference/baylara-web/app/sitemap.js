import { LANGS, ROUTES, UTILITY, path } from '../lib/routes';
import { getListings, getDevelopments, getZones, getBuildings, getReports } from '../lib/content';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://baylara.com';

export default function sitemap() {
  const entries = [];
  const add = (key, param) =>
    entries.push({
      url: base + path('es', key, param),
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, base + path(l, key, param)])) }
    });
  for (const key of Object.keys(ROUTES)) if (!UTILITY.includes(key)) add(key);
  for (const x of getListings()) add('listings', x.slug);
  for (const d of getDevelopments()) add('developments', d.slug);
  for (const z of getZones()) add('areas', z.slug);
  for (const b of getBuildings()) add('buildings', b.slug);
  for (const r of getReports()) add('market', r.slug);
  return entries;
}
