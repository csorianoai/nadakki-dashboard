// Localized URL map. Each page key has one slug per language; detail pages add one more segment.
export const LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';

export const ROUTES = {
  home: { es: '', en: '' },
  listings: { es: 'propiedades', en: 'properties' },
  developments: { es: 'nuevos-desarrollos', en: 'new-developments' },
  buildings: { es: 'edificios', en: 'buildings' },
  areas: { es: 'zonas', en: 'areas' },
  international: { es: 'compradores-internacionales', en: 'international-buyers' },
  sell: { es: 'vender', en: 'sell' },
  market: { es: 'mercado', en: 'market' },
  rentals: { es: 'alquileres', en: 'rentals' },
  puntacana: { es: 'punta-cana', en: 'punta-cana' },
  about: { es: 'sobre-mi', en: 'about' },
  contact: { es: 'contacto', en: 'contact' },
  privacy: { es: 'privacidad', en: 'privacy' },
  terms: { es: 'terminos', en: 'terms' },
  accessibility: { es: 'accesibilidad', en: 'accessibility' },
  // Landing pages of the no-JavaScript form fallback (not in the sitemap, noindex).
  sent: { es: 'mensaje-enviado', en: 'message-sent' },
  notSent: { es: 'mensaje-no-enviado', en: 'message-not-sent' }
};

// Keys whose pages accept one extra segment (detail pages).
export const DETAIL = { listings: 'listing', developments: 'development', buildings: 'building', areas: 'zone', market: 'report' };

export const UTILITY = ['sent', 'notSent'];

export function path(lang, key, param) {
  const slug = ROUTES[key][lang];
  const parts = ['', lang];
  if (slug) parts.push(slug);
  if (param) parts.push(param);
  return parts.join('/') || '/';
}

// slug array → { key, param, detail } or null
export function resolve(lang, slug = []) {
  if (slug.length === 0) return { key: 'home' };
  const key = Object.keys(ROUTES).find((k) => ROUTES[k][lang] === slug[0] && ROUTES[k][lang] !== '');
  if (!key) return null;
  if (slug.length === 1) return { key };
  if (slug.length === 2 && DETAIL[key]) return { key, param: slug[1], detail: DETAIL[key] };
  return null;
}

export function isLang(l) {
  return LANGS.includes(l);
}
