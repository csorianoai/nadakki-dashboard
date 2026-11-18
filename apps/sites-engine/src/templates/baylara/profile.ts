// Bloque `baylara.profile` (pagina home): esquema en blocks.schema.json. Invalido -> null (la plantilla omite el perfil).
import Ajv2020 from 'ajv/dist/2020';
import type { Block, I18nText, PublicPage } from '@/core/types';
import schema from './blocks.schema.json';

export const PROFILE_TYPE = 'baylara.profile';
export interface Profile {
  agent?: { name?: string; title?: I18nText; photo?: string }; brokerage_address?: string; mls_disclaimer?: I18nText; dr_partner_brokerage?: string;
  response_time?: I18nText; valuation_days?: number; testimonials?: { quote: I18nText; author: string; role?: string }[];
}

const validate = new Ajv2020({ strict: false }).compile(schema);

export function parseProfile(data: unknown): Profile | null {
  return validate(data) ? (data as Profile) : null;
}

export function profileFromPage(page: Pick<PublicPage, 'body'> | null | undefined): Profile | null {
  const b = (page?.body ?? []).find((x: Block) => x.type === PROFILE_TYPE);
  return b ? parseProfile(b.data) : null;
}
