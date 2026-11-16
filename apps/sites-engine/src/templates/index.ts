// Registro de plantillas: getTemplate(id, version). Desconocida -> undefined (el render falla cerrado).
// La plantilla minima de prueba se reemplaza por la real en ST2-06.
import type { ReactElement } from 'react';
import type { Manifest, Lang } from '@/core/types';
import { minimalTemplate } from './minimal';

export interface RenderInput { manifest: Manifest; lang: Lang; route: { kind: string; key: string }; data: unknown }
export type Template = (input: RenderInput) => ReactElement;

const REGISTRY = new Map<string, Template>([['realestate-agent-v1@1', minimalTemplate]]);

export function getTemplate(id: string, version: number): Template | undefined {
  return REGISTRY.get(`${id}@${version}`);
}
