// Image registry (content/media.json). Resolves slots to small, serializable objects for <Media>.
// Client-safe: no fs.
import media from '../content/media.json';

// Item id → { base, widths, width, height, color, alt } (alt localized), or null.
export function mediaItem(id, lang) {
  const it = id && media.items[id];
  if (!it) return null;
  const alt = it.alt ? it.alt[lang] ?? it.alt.es : '';
  if (it.type === 'video') return { type: 'video', src: it.src, poster: mediaItem(it.poster, lang), alt };
  return { type: 'image', base: it.base, widths: it.widths, width: it.width, height: it.height, color: it.color || null, alt };
}

// Slot name (e.g. "zone.aventura") → resolved item, or null when the slot is empty.
export function slot(name, lang) {
  return mediaItem(media.slots[name], lang);
}

// A record's own photo path (e.g. building.photo = "/img/x.jpg") wins over the registry.
export function ownPhoto(src, alt) {
  return src ? { type: 'image', src, alt: alt || '' } : null;
}

export function zoneMedia(z, lang) {
  if (!z) return null;
  return ownPhoto(z.photo, '') || slot(`zone.${z.slug}`, lang);
}

export function buildingMedia(b, zone, lang) {
  if (b.photo) return ownPhoto(b.photo, b.name);
  return media.slots['building.default'] === 'zone' ? zoneMedia(zone, lang) : slot('building.default', lang);
}

// A photo reference in a record: a registry id ("dev-x-render-1") or, for older records, a path ("/img/x.jpg").
export function photoMedia(ref, lang, alt) {
  if (!ref) return null;
  if (String(ref).startsWith('/')) return ownPhoto(ref, alt);
  const m = mediaItem(ref, lang);
  return m && alt && !m.alt ? { ...m, alt } : m;
}

// Agent portrait: the registry slot "agent.photo" (own photo, permission "own"), or null → initials.
export function agentMedia(lang, name) {
  const m = slot('agent.photo', lang);
  return m ? { ...m, alt: m.alt || name || '' } : null;
}

export function srcSet(m, fmt) {
  return m.widths.map((w) => `${m.base}-${w}.${fmt} ${w}w`).join(', ');
}
