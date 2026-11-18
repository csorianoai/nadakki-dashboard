// Nucleo de la puerta axe (ST2-08, 3.17a). Excepciones SOLO por quality/axe-allowlist.json con motivo y fecha.
export const AXE_TAGS = Object.freeze(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

/** Cada ruta en es y en: '/es/x' <-> '/en/x' (sin duplicados, orden estable). */
export function withLanguages(routes) {
  const out = [];
  for (const r of routes) {
    for (const x of [r, r.replace(/^\/(es|en)(?=\/|$)/, (_, l) => (l === 'es' ? '/en' : '/es'))]) if (!out.includes(x)) out.push(x);
  }
  return out;
}

export function loadAllowlist(json) {
  const entries = Array.isArray(json?.entries) ? json.entries : null;
  if (!entries) throw new Error('axe-allowlist: falta "entries"');
  for (const e of entries) {
    const ok = typeof e?.rule === 'string' && e.rule && typeof e.route === 'string' && e.route.startsWith('/')
      && typeof e.reason === 'string' && e.reason.trim() && /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '');
    if (!ok) throw new Error(`axe-allowlist: entrada invalida (regla, ruta, motivo y fecha AAAA-MM-DD obligatorios): ${JSON.stringify(e)}`);
  }
  return entries;
}

export function applyAllowlist(violations, route, entries) {
  return violations.filter((v) => !entries.some((e) => e.rule === v.id && e.route === route));
}

/** Ejecuta axe sobre una pagina ya cargada. */
export async function runAxe(page) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  return (await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze()).violations;
}
