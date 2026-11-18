import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import { THEME_DEFAULTS, THEME_KEYS, resolveTheme, themeCss } from '@/templates/baylara/theme';

const A = { ...SITE_A.manifest.theme, navy: '#0a3d62', gold: '#aa8800', pad: '20px' };
const B = { navy: '#6a1b4d', gold: '#ff00aa' };

describe('ST2-06 tokens de la plantilla Baylara', () => {
  it('[positivo] la plantilla fija los 14 colores y las 2 medidas de globals.css:2-17', () => {
    expect(THEME_KEYS).toHaveLength(16);
    expect(THEME_DEFAULTS.navy).toBe('#0e2236');
    expect(THEME_DEFAULTS['on-navy-2']).toBe('#c4cdd6');
    expect(THEME_DEFAULTS.pad).toBe('clamp(16px, 4vw, 48px)');
    expect(THEME_DEFAULTS.section).toBe('clamp(64px, 8vw, 112px)');
  });

  it('[positivo] manifest.theme valido se mapea a variables CSS; el resto queda en el valor de la plantilla', () => {
    const css = themeCss(A);
    expect(css).toContain('--navy:#0a3d62;');
    expect(css).toContain('--gold:#aa8800;');
    expect(css).toContain('--pad:20px;');
    expect(css).toContain('--sand:#eadfcc;');
  });

  it('[negativo] hex invalido, nombre fuera de la lista blanca e inyeccion CSS -> valor por defecto, sin romper', () => {
    const r = resolveTheme({ navy: 'red', gold: '#12', ink: '#000;}body{display:none', text: 'url(https://x.example/a)', evil: '#ffffff', pad: 'calc(1px)', section: 5, '--sand': '#ffffff' });
    expect(r.navy).toBe(THEME_DEFAULTS.navy);
    expect(r.gold).toBe(THEME_DEFAULTS.gold);
    expect(r.ink).toBe(THEME_DEFAULTS.ink);
    expect(r.text).toBe(THEME_DEFAULTS.text);
    expect(r.pad).toBe(THEME_DEFAULTS.pad);
    expect(r.section).toBe(THEME_DEFAULTS.section);
    expect(r.sand).toBe(THEME_DEFAULTS.sand);
    expect(themeCss({ evil: '#ffffff' })).not.toContain('evil');
    for (const bad of [null, undefined, 'x', 7, []]) expect(resolveTheme(bad).navy).toBe(THEME_DEFAULTS.navy);
  });

  it('[tenant-ajeno] los tokens de B nunca aparecen en el CSS de A y viceversa', () => {
    const a = themeCss(A);
    const b = themeCss(B);
    expect(a).not.toContain('#6a1b4d');
    expect(a).not.toContain('#ff00aa');
    expect(b).not.toContain('#0a3d62');
    expect(b).not.toContain('#aa8800');
    expect(SITE_B.manifest.site_id).not.toBe(SITE_A.manifest.site_id);
  });
});
