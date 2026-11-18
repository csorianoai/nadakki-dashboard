// Turns raw records into small, localized, serializable objects for cards, filters and client components.
import { L, V, formatPrice, getZones, t as tt } from './content';
import { path } from './routes';
import { buildingMedia, photoMedia, zoneMedia } from './media';

export function zoneName(z, lang) {
  return z ? (lang === 'en' && z.nameEn) || z.name : '';
}

// Photos of a listing as registry media; falls back to the zone image so a card is never blank.
export function listingPhotos(x, lang) {
  const zone = getZones().find((z) => z.slug === x.zone);
  const title = L(x.title, lang);
  const list = (x.photos || []).map((p, i) => photoMedia(p, lang, i ? `${title} — ${i + 1}` : title)).filter(Boolean);
  if (list.length) return list;
  const z = zoneMedia(zone, lang);
  return z ? [z] : [];
}

export function developmentPhotos(d, lang) {
  return (d.images || []).map((p, i) => photoMedia(p, lang, i ? `${d.name} — ${i + 1}` : d.name)).filter(Boolean);
}

// Origin of a card, used for ordering: our exclusives, then new developments, then IDX/MLS feed.
export const SOURCE_ORDER = { exclusive: 0, development: 1, idx: 2 };

export function cardView(x, lang) {
  const t = tt(lang);
  const zone = getZones().find((z) => z.slug === x.zone);
  const status = x.status === 'preconstruction' ? t.preconstruction : x.kind === 'rent' ? t.for_rent : t.for_sale;
  const zn = zone ? zoneName(zone, lang) : x.zone === 'punta-cana' ? 'Punta Cana' : '';
  return {
    slug: x.slug,
    href: path(lang, 'listings', x.slug),
    sample: !!x.sample,
    source: x.exclusive ? 'exclusive' : 'idx',
    kind: x.kind,
    zone: x.zone,
    type: x.type,
    priceValue: x.price ?? null,
    price: formatPrice(x.price, lang, x.kind === 'rent') + (x.zone === 'punta-cana' && x.price != null ? ' USD' : ''),
    title: L(x.title, lang),
    zoneLabel: zn,
    address: x.address || null,
    area: x.area || (zone ? `${zn}, FL` : ''),
    status: x.exclusive ? `${status} · ${lang === 'es' ? 'Exclusiva' : 'Exclusive'}` : status,
    beds: x.beds ?? null,
    baths: x.baths ?? null,
    sqft: x.sqft != null ? Number(x.sqft).toLocaleString('en-US') : null,
    media: listingPhotos(x, lang)[0] || null,
    courtesy: x.listingBrokerage || null
  };
}

export function devStatus(d, lang) {
  const t = tt(lang);
  return t[`dev_status_${d.status}`] || t.preconstruction;
}

export function devCardView(d, lang) {
  const t = tt(lang);
  const zone = getZones().find((z) => z.slug === d.zone);
  return {
    slug: d.slug,
    href: path(lang, 'developments', d.slug),
    sample: !!d.sample,
    source: 'development',
    kind: 'development',
    zone: d.zone,
    type: 'development',
    priceValue: d.priceFrom ?? null,
    price: d.priceFrom != null ? `${t.price_from} ${formatPrice(d.priceFrom, lang)}` : t.price_on_request,
    title: d.name,
    zoneLabel: d.area || (zone ? zoneName(zone, lang) : ''),
    address: d.name,
    area: d.address || '',
    status: t.new_development,
    beds: null,
    bedsLabel: d.beds ? `${L(d.beds, lang)} ${t.beds}` : null,
    baths: null,
    sqft: d.sqft || null,
    media: developmentPhotos(d, lang)[0] || zoneMedia(zone, lang),
    courtesy: null
  };
}

export function cardStrings(lang) {
  const t = tt(lang);
  return { sample: t.sample, beds: t.beds, baths: t.baths, courtesy: t.courtesy, details: t.view_details };
}

export function buildingView(b, lang) {
  const t = tt(lang);
  const zone = getZones().find((z) => z.slug === b.zone);
  const pr = V(b.priceRange);
  const rental = V(b.rules?.rental?.minimumTerm) ?? null;
  const pets = V(b.rules?.pets?.allowed);
  return {
    slug: b.slug,
    href: path(lang, 'buildings', b.slug),
    name: b.name,
    sample: !!b.sample,
    zone: b.zone,
    zoneName: zoneName(zone, lang),
    oceanfront: !!b.oceanfront,
    photo: b.photo || null,
    media: buildingMedia(b, zone, lang),
    year: V(b.summary?.yearBuilt) ?? null,
    floors: V(b.summary?.floors) ?? null,
    rental,
    rentalTag: rental ? t[`rent_min_${rental}`] : null,
    pets: pets ?? null,
    petsLabel: pets == null ? null : pets ? t.pets_yes : t.pets_no,
    hoaPsf: V(b.hoa?.perSqft) ?? null,
    priceRange: pr ? `${formatPrice(pr.min, lang)} – ${formatPrice(pr.max, lang)}` : null,
    lat: b.geo?.lat ?? null,
    lng: b.geo?.lng ?? null
  };
}

export function buildingStrings(lang) {
  const t = tt(lang);
  const keys = ['sample', 'oceanfront', 'floors', 'f_zone', 'f_front', 'f_rental', 'f_pets', 'f_year', 'f_hoa_range', 'any_zone', 'any_front', 'any', 'other', 'rent_min_30d', 'rent_min_6m', 'rent_min_1y', 'rent_min_none', 'pets_yes', 'pets_no', 'y_old', 'y_mid', 'y_new', 'h_low', 'h_mid', 'h_high', 'view_list', 'view_map', 'buildings_count', 'search'];
  const s = Object.fromEntries(keys.map((k) => [k, t[k]]));
  s.filters = lang === 'es' ? 'Filtrar edificios' : 'Filter buildings';
  s.ocean = lang === 'es' ? 'Océano Atlántico' : 'Atlantic Ocean';
  return s;
}

const IND = { medianPrice: 'usd', pricePerSqft: 'usd', daysOnMarket: 'n', closedSales: 'n', activeListings: 'n' };
export function indicators(row, lang) {
  const t = tt(lang);
  return Object.keys(IND)
    .filter((k) => row[k] != null)
    .map((k) => ({ k, label: t[`ind_${k}`], value: IND[k] === 'usd' ? formatPrice(row[k], lang) : Number(row[k]).toLocaleString(lang === 'es' ? 'es-US' : 'en-US') }));
}
