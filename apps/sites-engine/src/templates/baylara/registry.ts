// Registro tipo -> componente de los bloques de PublicPage.body (interfaz de datos: blocks.schema.json, $defs/block_*).
// Falla cerrada: tipo no registrado, datos que no validan o enlace a una ruta inexistente -> BlockError (no se pinta a medias).
import { createElement as h, type ReactElement } from 'react';
import Link from 'next/link';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import type { Block, I18nText, Lang, Manifest } from '@/core/types';
import { BlockError } from '@/blocks/model';
import { pathFor } from '@/render/site';
import { LeadForm, type LeadFormData } from './lead-form';
import { entityList } from './lists';
import { section, stats, steps } from './sections';
import type { EntityLists } from '../index';
import schema from './blocks.schema.json';

export interface BlockCtx { manifest: Manifest; lang: Lang; hosts?: string[]; lists?: EntityLists }
type Render = (data: Record<string, unknown>, ctx: BlockCtx, blockId: string) => ReactElement;

const tx = (t: I18nText | undefined, lang: Lang): string => (t ? (lang === 'en' ? t.en ?? t.es : t.es) : '');

/** Enlace por clave de pagina del manifiesto (nunca un slug escrito en el bloque). */
function link(ctx: BlockCtx, route: string, label: I18nText, className: string): ReactElement {
  const r = ctx.manifest.routes.find((x) => x.kind === 'page' && x.key === route);
  if (!r) throw new BlockError('shape');
  return h(Link, { href: pathFor(ctx.manifest, ctx.lang, r), className }, tx(label, ctx.lang));
}

interface Cta { label: I18nText; route: string }

const REGISTRY: Record<string, { def: string; render: Render }> = {
  text: {
    def: 'block_text',
    render: (d) => h('p', null, String(d.text ?? '')),
  },
  'baylara.hero': {
    def: 'block_baylara_hero',
    render: (d, ctx) => {
      const cta = d.cta as Cta | undefined;
      return h('section', { className: 'hero' }, h('div', { className: 'container' },
        h('h1', null, tx(d.title as I18nText, ctx.lang)),
        d.subtitle ? h('p', { className: 'lede' }, tx(d.subtitle as I18nText, ctx.lang)) : null,
        cta ? link(ctx, cta.route, cta.label, 'btn btn-primary') : null));
    },
  },
  'baylara.cta': {
    def: 'block_baylara_cta',
    render: (d, ctx) => {
      const b = d.button as Cta;
      return h('section', { className: 'cta-band' }, h('div', { className: 'container' },
        h('h2', null, tx(d.title as I18nText, ctx.lang)),
        d.body ? h('p', null, tx(d.body as I18nText, ctx.lang)) : null,
        link(ctx, b.route, b.label, 'btn btn-primary')));
    },
  },
  'baylara.lead_form': {
    def: 'block_baylara_lead_form',
    render: (d, ctx) => {
      const route = d.privacy_route as string | undefined;
      let privacyHref: string | undefined;
      if (route) {
        const r = ctx.manifest.routes.find((x) => x.kind === 'page' && x.key === route);
        if (!r) throw new BlockError('shape');
        privacyHref = pathFor(ctx.manifest, ctx.lang, r);
      }
      return h(LeadForm, { data: d as unknown as LeadFormData, lang: ctx.lang, privacyHref });
    },
  },
  'baylara.section': { def: 'block_baylara_section', render: (d, ctx) => section(d as unknown as Parameters<typeof section>[0], ctx.lang) },
  'baylara.steps': { def: 'block_baylara_steps', render: (d, ctx) => steps(d as unknown as Parameters<typeof steps>[0], ctx.lang) },
  'baylara.stats': { def: 'block_baylara_stats', render: (d, ctx) => stats(d as unknown as Parameters<typeof stats>[0], ctx.lang) },
  'baylara.entity_list': {
    def: 'block_baylara_entity_list',
    render: (d, ctx, id) => entityList(d as unknown as Parameters<typeof entityList>[0], { manifest: ctx.manifest, lang: ctx.lang, hosts: ctx.hosts ?? [], list: ctx.lists?.[id] }),
  },
};

export const BLOCK_TYPES = Object.keys(REGISTRY);

const ajv = new Ajv2020({ strict: false });
ajv.addSchema(schema);
const validators = new Map<string, ValidateFunction>();
for (const t of BLOCK_TYPES) validators.set(t, ajv.getSchema(`${schema.$id}#/$defs/${REGISTRY[t].def}`)!);

export function renderBlock(b: Block, ctx: BlockCtx): ReactElement {
  const entry = Object.hasOwn(REGISTRY, b.type) ? REGISTRY[b.type] : undefined;
  if (!entry) throw new BlockError('shape');
  const data = b.data ?? (b.i18n?.text ? { text: tx(b.i18n.text, ctx.lang) } : {}); // 'text' admite el formato i18n heredado
  if (!validators.get(b.type)!(data)) throw new BlockError('shape');
  return h('div', { key: b.block_id, 'data-block': b.type }, entry.render(data as Record<string, unknown>, ctx, b.block_id));
}

/** Renderiza TODOS o ninguno: la primera falla aborta antes de devolver nada. */
export function renderBlocks(blocks: Block[], ctx: BlockCtx): ReactElement[] {
  return blocks.map((b) => renderBlock(b, ctx));
}
