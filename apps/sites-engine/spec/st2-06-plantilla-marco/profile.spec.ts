import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_A, SITE_B } from '@/core/fixtures';
import { PROFILE_TYPE, parseProfile, profileFromPage } from '@/templates/baylara/profile';

const schema = JSON.parse(readFileSync(path.resolve(__dirname, '../../src/templates/baylara/blocks.schema.json'), 'utf8'));
const good = { agent: { name: 'Agente Sintetico', title: { es: 'Agente', en: 'Agent' } }, response_time: { es: '24 h', en: '24 h' }, valuation_days: 3,
  brokerage_address: 'Calle 1', mls_disclaimer: { es: 'Aviso', en: 'Notice' }, dr_partner_brokerage: 'Socio SRL', testimonials: [{ quote: { es: 'Bien', en: 'Good' }, author: 'Ana' }] };

describe('ST2-06 bloque baylara.profile (interfaz de importacion)', () => {
  it('[positivo] el esquema declara el tipo y los campos de site.json que el manifiesto no lleva', () => {
    expect(PROFILE_TYPE).toBe('baylara.profile');
    expect(schema.$id).toBeTruthy();
    const props = JSON.stringify(schema);
    for (const f of ['agent', 'response_time', 'valuation_days', 'brokerage_address', 'mls_disclaimer', 'dr_partner_brokerage', 'testimonials']) expect(props).toContain(f);
    expect(parseProfile(good)?.agent?.name).toBe('Agente Sintetico');
  });

  it('[positivo] se lee de la pagina home (bloque baylara.profile)', () => {
    const page = { ...SITE_A.pages[0], page_key: 'home', body: [{ block_id: 'b1', type: PROFILE_TYPE, data: good }] };
    expect(profileFromPage(page)?.valuation_days).toBe(3);
  });

  it('[negativo] datos invalidos, tipos incorrectos o campos extra -> null (nunca revienta)', () => {
    for (const bad of [null, 'x', [], { valuation_days: 'tres' }, { ...good, extra: 1 }, { ...good, testimonials: [{ author: 'x' }] }]) expect(parseProfile(bad)).toBeNull();
    expect(profileFromPage({ ...SITE_A.pages[0], body: [{ block_id: 'b', type: 'text', data: good }] })).toBeNull();
  });

  it('[tenant-ajeno] el perfil de A no se mezcla con el de B', () => {
    const pa = { ...SITE_A.pages[0], body: [{ block_id: 'a', type: PROFILE_TYPE, data: { agent: { name: 'Agente A' } } }] };
    const pb = { ...SITE_B.pages[0], body: [{ block_id: 'b', type: PROFILE_TYPE, data: { agent: { name: 'Agente B' } } }] };
    expect(profileFromPage(pa)?.agent?.name).toBe('Agente A');
    expect(profileFromPage(pb)?.agent?.name).toBe('Agente B');
    expect(profileFromPage({ ...pa, body: [] })).toBeNull();
  });
});
