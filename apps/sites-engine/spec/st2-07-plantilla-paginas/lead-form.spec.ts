import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createCoreClient } from '@/core/client';
import { SITE_A, createFakeCore } from '@/core/fixtures';
import { handleLead } from '@/leads/handler';
import { TEXT_VERSIONS } from '@/leads/consent';
import { renderSite } from '@/render/site';

const schema = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/templates/baylara/blocks.schema.json'), 'utf8'));
const ajv = new Ajv2020({ strict: false });
ajv.addSchema(schema);
const check = (data: unknown) => ajv.getSchema(`${schema.$id}#/$defs/block_baylara_lead_form`)!(data);

const FORM = {
  intent: 'buyer', submit: { es: 'Enviar', en: 'Send' }, note: { es: 'Respondemos pronto', en: 'We reply soon' },
  fields: [
    { name: 'name', label: { es: 'Nombre', en: 'Name' } },
    { name: 'email', label: { es: 'Correo', en: 'Email' }, type: 'email' },
    { name: 'timeline', label: { es: 'Plazo', en: 'Timeline' }, type: 'select', options: ['3 meses', '6 meses'] },
  ],
  consent_phone: { es: 'Acepto llamadas SYNTH', en: 'I accept SYNTH calls' }, consent_email: { es: 'Acepto correos SYNTH', en: 'I accept SYNTH emails' },
  privacy_route: 'privacy', privacy_label: { es: 'Privacidad', en: 'Privacy' }, interest: { kind: 'listing', slug: 'synth-condo-01' },
};

async function page(data: unknown, siteId = SITE_A.id, segs = ['sobre-mi']) {
  const f = createFakeCore();
  f.mutate('/manifest', (b) => ({ ...b, template: { id: 'baylara', version: 1 } }));
  f.mutate('/pages/about', (b) => ({ ...b, body: [{ block_id: 'lf', type: 'baylara.lead_form', data }] }));
  const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
  return renderSite(c, siteId, segs);
}
const html = (o: Awaited<ReturnType<typeof page>>) => { if (o.kind !== 'ok') throw new Error(o.kind); return renderToStaticMarkup(o.element); };

describe('ST2-07 LeadForm (baylara.lead_form)', () => {
  it('[positivo] valida contra el esquema y se pinta en es y en con POST nativo, honeypot, noscript y consentimiento por canal', async () => {
    expect(check(FORM)).toBe(true);
    const es = html(await page(FORM));
    expect(es).toContain('method="post"');
    expect(es).toContain('action="/api/lead"');
    expect(es).toContain('name="company_website"');
    expect(es).toContain('name="form_rendered_at"');
    expect(es).toContain('<noscript>');
    expect(es).toContain('setTimeout');
    expect(es).toContain(`data-text-version="${TEXT_VERSIONS.phone_sms}"`);
    expect(es).toContain(`data-text-version="${TEXT_VERSIONS.email}"`);
    expect(es).toContain('name="listing" value="synth-condo-01"');
    expect(es).toContain('href="/privacidad"');
    expect(es).not.toMatch(/idempotency/i);
    const en = html(await page(FORM, SITE_A.id, ['en', 'about']));
    expect(en).toContain('I accept SYNTH calls');
    expect(en).toContain('href="/en/privacy"');
  });

  it('[positivo] el POST sin JS (urlencoded, cookie de host) es el que espera ST2-05 y se acepta', async () => {
    const calls: string[] = [];
    const fetch = (async (u: string) => { calls.push(String(u)); return new Response('{}', { status: 202 }); }) as unknown as typeof globalThis.fetch;
    const { signFormCookie, FORM_COOKIE } = await import('@/leads/antispam');
    const now = Date.now();
    const body = new URLSearchParams({ intent: 'buyer', lang: 'es', form_rendered_at: '', company_website: '', name: 'Ana Synth', email: 'ana@synth.invalid', consent: 'on' }).toString();
    const outbox = { enqueue: async () => ({ id: '1', key: 'k', status: 'pending' }), markSent: async () => {}, release: async () => {} } as never;
    const res = await handleLead(new Request('https://www.synth-realty.example/api/lead', { method: 'POST', body, headers: { 'content-type': 'application/x-www-form-urlencoded', host: 'www.synth-realty.example', cookie: `${FORM_COOKIE}=${signFormCookie('s3cret', SITE_A.id, now - 10_000)}` } }), SITE_A.id,
      { fetch, baseUrl: 'https://core.test/api/v1/sites', secret: 's3cret', outbox, now: () => now });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('/es/mensaje-enviado');
    expect(calls).toHaveLength(1);
  });

  it('[negativo] campos reservados, sin "es" o con ruta de privacidad inexistente se rechazan (falla cerrada)', async () => {
    expect(check({ ...FORM, fields: [{ name: 'company_website', label: { es: 'x' } }] })).toBe(false);
    expect(check({ ...FORM, fields: [{ name: 'tenant_id', label: { es: 'x' } }] })).toBe(false);
    expect(check({ ...FORM, submit: { en: 'only en' } })).toBe(false);
    expect(check({ ...FORM, intent: 'hacker' })).toBe(false);
    expect((await page({ ...FORM, privacy_route: 'no-existe' })).kind).toBe('error');
    expect((await page({ ...FORM, extra: 1 })).kind).toBe('error');
  });

  it('[tenant-ajeno] el formulario no lleva site_id ni tenant, y la ficha de interes del sitio B no se resuelve desde A', async () => {
    const out = html(await page(FORM));
    expect(out).not.toContain(SITE_A.id);
    expect(out).not.toMatch(/tenant_id|site_id/);
    const f = createFakeCore();
    const c = createCoreClient({ baseUrl: 'https://core.test/api/v1/sites', token: 'tok-sintetico', fetch: f.fetch });
    expect((await renderSite(c, SITE_A.id, ['otro-loft-01'])).kind).toBe('not_found');
  });
});
