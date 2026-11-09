import type { MediaAsset } from "../types";

/** Almacen EN MEMORIA del modo DEMO (NEXT_PUBLIC_SITES_ALLOW_DEMO="1", con badge DEMO). Sin datos sembrados. */
let almacen: MediaAsset[] = [];
export function saveDemoMedia(m: MediaAsset): void { almacen = almacen.some((x) => x.id === m.id) ? almacen.map((x) => (x.id === m.id ? m : x)) : [...almacen, m]; }
export function resetDemoMedia(): void { almacen = []; }
