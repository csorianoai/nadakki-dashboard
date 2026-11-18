import type { Page } from "../types";

/** Datos SINTETICOS (prefijo SYNTH). Solo con NEXT_PUBLIC_SITES_ALLOW_DEMO="1" y badge DEMO visible. */
export const SYNTH_PAGES: Page[] = [
  {
    id: "00000000-0000-4000-8000-0000000000e1", tenant_id: "00000000-0000-4000-8000-000000000000", vertical: "realestate",
    site_id: "00000000-0000-4000-8000-0000000000d1", page_key: "inicio", status: "draft", sort_order: 0,
    slug: { es: "inicio", en: "home" },
    title: { es: "SYNTH Inicio", en: "SYNTH Home" },
    meta_description: { es: "SYNTH descripcion de ejemplo" },
    body: [
      { block_id: "h1", type: "hero", i18n: { headline: { es: "SYNTH Bienvenida", en: "SYNTH Welcome" } } },
      { block_id: "l1", type: "legal_broker", data: { license: "SYNTH-0" } },
    ],
  },
];

let almacen: Page[] = SYNTH_PAGES.map((p) => JSON.parse(JSON.stringify(p)) as Page);

export const demoPages = (): Page[] => almacen;
export const demoPage = (id: string): Page | undefined => almacen.find((p) => p.id === id);
export function saveDemoPage(p: Page): void { almacen = almacen.map((x) => (x.id === p.id ? p : x)); }
export function resetDemoPages(): void { almacen = SYNTH_PAGES.map((p) => JSON.parse(JSON.stringify(p)) as Page); }
