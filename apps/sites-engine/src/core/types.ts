// Tipos de lectura publica de C-SITES-RENDER 1.0.0 (copia congelada en contracts/). Sin tenant_id ni ids internos.
export type Lang = 'es' | 'en';
export interface I18nText { es: string; en?: string }
export interface I18nTextStrict { es: string; en: string }
export interface Slugs { es: string; en?: string }
export interface Money { amount: string; currency: string }
export interface GeoPoint { lat: number; lng: number }

export interface PublicMedia {
  id: string; width?: number | null; height?: number | null; mime_type: string; alt: I18nTextStrict; credit?: string | null;
  variants: { width: number; format: 'avif' | 'webp' | 'jpeg'; url: string }[];
}
export interface ResolveResult {
  site_id: string; vertical: string; template_id: string; template_version: number; languages: Lang[]; default_language: Lang;
  content_version: number; host: string; host_kind: 'nadakki_subdomain' | 'custom'; primary_host: string; state: 'serve' | 'redirect';
  redirect: { to_host: string; status: 301; until: string } | null;
}
export interface Manifest {
  site_id: string; content_version: number; generated_at: string; vertical: string; template: { id: string; version: number };
  name: I18nText; languages: Lang[]; default_language: Lang; theme: Record<string, unknown>;
  contact: { phone?: string; whatsapp?: string; email?: string; address?: string };
  legal: { brokerage_legal_name: string; dba?: string | null; agent_registered_last_name: string; license_no: string; team_name_approved?: string | null };
  hosts: { host: string; is_primary: boolean }[]; indexable: boolean; required_blocks: string[];
  routes: { kind: 'page' | 'listing' | 'development' | 'zone' | 'building'; key: string; slugs: Slugs; lastmod: string }[];
  counts?: Record<string, number>;
}
export interface Block { block_id: string; type: string; data?: Record<string, unknown>; i18n?: Record<string, I18nText> }
export interface PublicPage {
  page_key: string; slug: Slugs; title: I18nText; meta_description?: I18nText; body: Block[]; updated_at?: string | null;
}
export interface PublicListing {
  item_kind: 'property' | 'generic'; vertical_attrs?: Record<string, unknown>; slug: string; title: I18nText; description?: I18nText;
  features: I18nText[]; geo?: GeoPoint | null; featured: boolean; price?: Money | null; published_at?: string | null; updated_at?: string | null;
  zone_slug?: string | null; building_slug?: string | null; development_slug?: string | null; media?: PublicMedia[];
}
export interface PublicDevelopment {
  slug: string; name: string; description?: I18nText; area?: string; address?: Record<string, string>; dev_type?: string; status?: string;
  delivery_year?: number; price_from?: string; currency?: string; developer?: string; units?: Record<string, unknown>[]; amenities?: I18nText[];
  geo?: GeoPoint | null; authorized: boolean; updated_at?: string | null; zone_slug?: string | null; media?: PublicMedia[];
}
export interface PublicZone {
  slug: string; name: I18nText; lead?: I18nText; body?: I18nText; price_range?: { min?: Money; max?: Money };
  schools?: Record<string, unknown>[]; distances?: Record<string, unknown>[]; source?: string; source_date?: string; photo?: PublicMedia | null;
}
export interface PublicBuilding {
  slug: string; name: string; summary?: I18nText; hoa?: Record<string, unknown>; rules?: Record<string, unknown>;
  structural?: Record<string, unknown>; data_source?: string; data_date?: string; zone_slug?: string | null;
}
export interface Page<T> { items: T[]; next_cursor: string | null }
