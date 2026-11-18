// Registro de plantillas: getTemplate(id, version). Desconocida -> undefined (el render falla cerrado).
// `baylara@1`: plantilla real (ST2-06). La minima queda para pruebas.
import type { ReactElement } from 'react';
import type { Manifest, Lang } from '@/core/types';
import { minimalTemplate } from './minimal';
import { baylaraTemplate } from './baylara';

/** Listas pre-leidas del core para los bloques `baylara.entity_list` (clave: block_id). La plantilla es sincrona: no pide datos. */
export type EntityLists = Record<string, { source: string; items: unknown[] }>;
export interface RenderInput { manifest: Manifest; lang: Lang; route: { kind: string; key: string }; data: unknown; lists?: EntityLists }
export type Template = (input: RenderInput) => ReactElement;

const REGISTRY = new Map<string, Template>([['realestate-agent-v1@1', minimalTemplate], ['baylara@1', baylaraTemplate]]);

export function getTemplate(id: string, version: number): Template | undefined {
  return REGISTRY.get(`${id}@${version}`);
}
