import { REALTOR_MENU } from "./menu";

/** Plantilla del <title> de app/realtor (META-TITULOS): «<pantalla> · Real Estate · Nadakki». */
export const TITULO_REALTOR = { default: "Real Estate · Nadakki", template: "%s · Real Estate · Nadakki" } as const;

/** Pantallas que no son filas de la barra; las demás toman el rótulo del menú, el mismo que ve el usuario. */
const FUERA_DEL_MENU: Readonly<Record<string, string>> = {
  "/realtor": "Inicio",
  "/realtor/demand-radar/senales": "Señales del mercado",
  "/realtor/property-intel/[propertyId]": "Ficha de propiedad",
  "/realtor/smart-calendar": "Smart Calendar",
};

const DEL_MENU: Readonly<Record<string, string>> = Object.fromEntries(
  REALTOR_MENU.flatMap((g) => g.items).filter((i) => i.href).map((i) => [i.href as string, i.label]),
);

/** Título de la pantalla `ruta` de app/realtor. Una ruta sin título es un error de construcción, no un título vacío. */
export function tituloRealtor(ruta: string): string {
  const t = FUERA_DEL_MENU[ruta] ?? DEL_MENU[ruta];
  if (!t) throw new Error(`Sin título para ${ruta}: añádela al menú o a FUERA_DEL_MENU`);
  return t;
}
