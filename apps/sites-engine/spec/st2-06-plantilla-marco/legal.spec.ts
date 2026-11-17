import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, SITE_B, createFakeCore } from '@/core/fixtures';
import type { Manifest } from '@/core/types';
import { LegalError, checkLegal, withLegal } from '@/render/legal';
import { renderSite } from '@/render/site';

const mA = SITE_A.manifest;
const mB = SITE_B.manifest;
const contact = { phone: '+13055550101', whatsapp: '+13055550102', email: 'hola@synth1.invalid' };
const A: Manifest = { ...mA, contact };
const noFooter = createElement('main', null, 'plantilla sin footer');
const html = (m: Manifest, lang: 'es' | 'en' = 'es') => renderToStaticMarkup(withLegal(m, lang, noFooter));
const FORBIDDEN = /vercel|cloudflare|\br2\b|cloudinary|amazonaws/i;

describe('ST2-06 bloques legales inyectados por el renderizador', () => {
  it('[positivo] correduria junto a CADA contacto, EHO, apellido registrado, licencia y enlace de privacidad', () => {
    const h = html(A);
    expect(h.match(/data-broker/g)!.length).toBeGreaterThanOrEqual(4); // whatsapp, telefono, correo, barra fija
    for (const c of ['wa.me/13055550102', 'tel:+13055550101', 'mailto:hola@synth1.invalid']) expect(h).toContain(c);
    expect(h).toContain('SYNTH Brokerage 1 LLC');
    expect(h).toContain('Equal Housing Opportunity');
    expect(h).toContain('Synth1');
    expect(h).toContain('SYNTH-0001');
    expect(html(A, 'en')).toContain('href="/en/privacy"');
    expect(h).not.toMatch(FORBIDDEN);
  });

  it('[positivo] renderSite entrega el sitio con los bloques legales tras la plantilla', async () => {
    const f = createFakeCore();
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    const out = await renderSite(c, SITE_A.id, ['sobre-mi']);
    expect(out.kind).toBe('ok');
    if (out.kind === 'ok') expect(renderToStaticMarkup(out.element)).toContain('Equal Housing Opportunity');
  });

  it('[negativo] una plantilla sin footer sigue recibiendo los bloques legales', () => {
    const h = html(A);
    expect(h).toContain('plantilla sin footer');
    expect(h).toContain('data-legal');
    expect(h).toContain('SYNTH-0001');
  });

  it('[negativo] required_blocks desconocido o manifest.legal incompleto -> no renderiza (error generico)', async () => {
    expect(() => checkLegal({ ...A, required_blocks: ['legal_brokerage', 'legal_nuevo'] })).toThrow(LegalError);
    expect(() => checkLegal({ ...A, legal: { ...A.legal, license_no: '' } })).toThrow(LegalError);
    expect(() => checkLegal({ ...A, legal: { ...A.legal, brokerage_legal_name: ' ' } })).toThrow(LegalError);
    expect(() => checkLegal({ ...A, legal: undefined as never })).toThrow(LegalError);
    expect(() => checkLegal(A)).not.toThrow();
    const f = createFakeCore();
    f.mutate('/manifest', (b) => ({ ...b, required_blocks: ['legal_brokerage', 'legal_inventado'] }));
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    const out = await renderSite(c, SITE_A.id, ['sobre-mi']);
    expect(out.kind).toBe('error');
  });

  it('[negativo] los datos legales se escapan: nada de HTML del manifiesto llega sin escapar', () => {
    const h = html({ ...A, legal: { ...A.legal, brokerage_legal_name: '<img src=x onerror=alert(1)> LLC' } });
    expect(h).not.toContain('<img');
  });

  it('[tenant-ajeno] la correduria, la licencia y el apellido de B nunca aparecen en el HTML de A', () => {
    const h = html(A);
    for (const s of [mB.legal.brokerage_legal_name, mB.legal.license_no, mB.legal.agent_registered_last_name, 'synth2']) expect(h).not.toContain(s);
    const hb = html({ ...mB, contact });
    expect(hb).toContain('SYNTH-0002');
    expect(hb).not.toContain('SYNTH-0001');
    expect(hb).not.toContain('SYNTH Brokerage 1');
  });
});
