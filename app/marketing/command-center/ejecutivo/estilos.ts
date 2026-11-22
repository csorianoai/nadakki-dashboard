/**
 * Clases de la pantalla patron. TODO color sale de los tokens semanticos del kit (--kit-*, definidos en
 * components/analytics/kit/tema.css en claro y en oscuro "azul noche"); aqui no hay hex, ni forgeGray-*, ni colores de Tailwind.
 * Las clases .kit-* ya existen en tema.css; las de estado (ok / atencion / error / pendiente) usan valores arbitrarios con var().
 */

/** Tarjeta elevada: superficie + borde + radio grande (lenguaje visual V2). */
export const TARJETA = "kit-bg-sup border kit-bd rounded-[18px] min-w-0";
/** Tarjeta secundaria (paneles de lectura, listas). */
export const PANEL = "kit-bg-sup border kit-bd rounded-[14px] min-w-0";
/** Subpanel hundido dentro de una tarjeta. */
export const HUNDIDO = "kit-bg-hundida border kit-bd-suave rounded-[12px]";

export const ETIQUETA = "text-[13px] kit-txt-3";
/** Texto de apoyo (fuentes, notas): texto-3 (>= 5,4:1 sobre superficie y fondo en claro y en oscuro); texto-tenue solo llega a 4,3:1 sobre el fondo claro. */
export const NOTA = "text-[11px] leading-snug kit-txt-3";
export const TITULO_PANEL = "m-0 font-display text-[18px] font-semibold leading-tight kit-txt";
export const CIFRA_GRANDE = "font-display font-bold tabular-nums tracking-[-0.02em] kit-txt break-words";

/** Chips de estado (texto, fondo y borde de estado). */
export const CHIP = "inline-flex items-center gap-1 rounded-full border px-2.5 py-[3px] text-[12px] font-bold uppercase tracking-[0.04em] whitespace-nowrap";
export const CHIP_OK = `${CHIP} border-[color:var(--kit-ok-borde)] bg-[color:var(--kit-ok-fondo)] text-[color:var(--kit-ok)]`;
export const CHIP_ATENCION = `${CHIP} border-[color:var(--kit-atencion-borde)] bg-[color:var(--kit-atencion-fondo)] text-[color:var(--kit-atencion)]`;
export const CHIP_ERROR = `${CHIP} border-[color:var(--kit-error-borde)] bg-[color:var(--kit-error-fondo)] text-[color:var(--kit-error)]`;
export const CHIP_PENDIENTE = `${CHIP} kit-chip-pendiente`;
/** Aviso en linea (banner / nota con estado). */
export const AVISO_ATENCION = "border border-[color:var(--kit-atencion-borde)] bg-[color:var(--kit-atencion-fondo)] text-[color:var(--kit-atencion)]";

/** Controles. kit-ctl: borde de 3:1 y color de texto; kit-ctl-activo: seleccionado; kit-foco: anillo de foco visible. */
export const BOTON = "kit-ctl kit-foco inline-flex min-h-[44px] items-center justify-center rounded-[10px] border px-3.5 text-[13px] font-medium";
export const BOTON_ACTIVO = "kit-ctl-activo kit-foco inline-flex min-h-[44px] items-center justify-center rounded-[10px] border px-3.5 text-[13px] font-semibold";
