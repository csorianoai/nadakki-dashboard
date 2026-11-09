import type { Ent, Rec } from "./form";

/** Almacen EN MEMORIA del modo DEMO (NEXT_PUBLIC_SITES_ALLOW_DEMO="1", con badge DEMO). Sin datos sembrados. */
const vacio = (): Record<Ent, Rec[]> => ({ desarrollos: [], zonas: [], edificios: [] });
let almacen = vacio();

export const demoItems = (e: Ent): Rec[] => [...almacen[e]];
export function saveDemoItem(e: Ent, it: Rec): void { almacen[e] = almacen[e].some((x) => x.id === it.id) ? almacen[e].map((x) => (x.id === it.id ? it : x)) : [...almacen[e], it]; }
export function resetDemoCatalogo(): void { almacen = vacio(); }
