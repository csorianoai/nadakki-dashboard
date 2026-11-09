import type { MediaAsset } from "../types";

/** Datos SINTETICOS. Solo con NEXT_PUBLIC_SITES_ALLOW_DEMO="1" y badge DEMO visible. */
const inicial = (): MediaAsset[] => [{
  id: "00000000-0000-4000-8000-0000000000c9", tenant_id: "00000000-0000-4000-8000-000000000000", vertical: "realestate",
  alt: { es: "SYNTH Foto de ejemplo", en: "SYNTH Sample photo" }, permission_type: "own", permission_date: "2026-01-10",
  acquired_on: "2026-01-10", status: "approved", permission_granted_by: "SYNTH Propietario", source: "SYNTH",
}];
let almacen = inicial();
export const demoMedia = (): MediaAsset[] => almacen;
export function saveDemoMedia(m: MediaAsset): void { almacen = almacen.some((x) => x.id === m.id) ? almacen.map((x) => (x.id === m.id ? m : x)) : [...almacen, m]; }
export function resetDemoMedia(): void { almacen = inicial(); }