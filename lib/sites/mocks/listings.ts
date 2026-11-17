import type { Listing } from "../types";

/** Datos SINTETICOS (prefijo SYNTH). Solo con NEXT_PUBLIC_SITES_ALLOW_DEMO="1" y badge DEMO visible. */
export const SYNTH_LISTINGS: Listing[] = [
  {
    id: "00000000-0000-4000-8000-0000000000f9", tenant_id: "00000000-0000-4000-8000-000000000000", vertical: "realestate",
    site_id: "00000000-0000-4000-8000-0000000000d1", slug: "synth-apartamento", publish_state: "draft", item_kind: "property",
    title: { es: "SYNTH Apartamento de ejemplo", en: "SYNTH Sample apartment" }, description: { es: "SYNTH descripcion" },
    features: [], featured: false, media: [], vertical_attrs: {}, geo: null, zone_id: null, building_id: null, development_id: null,
  },
];
const copia = () => SYNTH_LISTINGS.map((p) => JSON.parse(JSON.stringify(p)) as Listing);
let almacen: Listing[] = copia();

export const demoListings = (): Listing[] => almacen;
export const demoListing = (id: string): Listing | undefined => almacen.find((p) => p.id === id);
export function saveDemoListing(l: Listing): void { almacen = almacen.some((x) => x.id === l.id) ? almacen.map((x) => (x.id === l.id ? l : x)) : [...almacen, l]; }
export function resetDemoListings(): void { almacen = copia(); }
