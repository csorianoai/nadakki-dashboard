import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import { baseCss, siteCss } from '@/templates/baylara/styles';

describe('ST2-07 hoja de estilos base de la plantilla', () => {
  it('[positivo] incluye las reglas de los bloques portados y los tokens del sitio', () => {
    const css = baseCss();
    for (const sel of ['.container', '.section', '.stack', '.eyebrow', '.h2', '.btn-primary', '.boxed', '.num', '.src', '.form', '.hp', '.footer', '.stickybar', '.hero', '.card', '.kpi']) {
      expect(css).toContain(sel + ' ');
    }
    expect(css).toContain('.boxed > *');
    const all = siteCss({ navy: '#0a3d62' });
    expect(all).toContain('--navy:#0a3d62');
    expect(all).toContain('@font-face');
    expect(all).toContain('.container');
  });

  it('[negativo] sin URLs externas ni imports, llaves equilibradas y sin nombre de proveedor', () => {
    const css = baseCss();
    expect(css).not.toMatch(/@import|https?:|\/\/[a-z]|googleapis|gstatic|expression\(|javascript:/i);
    expect((css.match(/{/g) ?? []).length).toBe((css.match(/}/g) ?? []).length);
    expect(css).not.toContain('`');
    // el valor de tema invalido no se copia: cae al de la plantilla
    expect(siteCss({ navy: 'red;}body{display:none' })).not.toContain('display:none');
  });

  it('[tenant-ajeno] la hoja depende solo del tema del sitio pedido', () => {
    const a = siteCss({ ...SITE_A.manifest.theme, gold: '#111111' });
    const b = siteCss({ ...SITE_B.manifest.theme, gold: '#222222' });
    expect(a).toContain('--gold:#111111');
    expect(a).not.toContain('#222222');
    expect(b).not.toContain('#111111');
    expect(siteCss(undefined)).toBe(siteCss(undefined));
  });
});
