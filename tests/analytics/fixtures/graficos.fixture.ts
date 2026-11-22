/**
 * PROTOTIPO — fixtures deterministas SOLO para tests y capturas.
 * Estos numeros NO son datos reales de ningun tenant. Prohibido importarlos desde
 * components/analytics/kit o lib/analytics (lo comprueba tests/analytics/aislamiento.test.ts).
 */
import type { MetaGrafico } from "@/lib/analytics/graficos";

export const META_OK: MetaGrafico = {
  titulo: "Grafico de prueba",
  fuente: "PROTOTIPO · fixture de pruebas",
  fecha_dato: "2026-11-10",
};

export const SERIE_ACTUAL = [
  { x: "2026-11-01", y: 10 },
  { x: "2026-11-02", y: 14 },
  { x: "2026-11-03", y: 9 },
  { x: "2026-11-04", y: 18 },
  { x: "2026-11-05", y: 21 },
];
export const SERIE_ANTERIOR = [
  { x: "2026-10-27", y: 8 },
  { x: "2026-10-28", y: 11 },
  { x: "2026-10-29", y: 12 },
  { x: "2026-10-30", y: 10 },
  { x: "2026-10-31", y: 13 },
];

export const CATEGORIAS = [
  { etiqueta: "Google Ads", valor: 40 },
  { etiqueta: "Web", valor: 25 },
  { etiqueta: "Meta", valor: 20 },
  { etiqueta: "Referidos", valor: 10 },
  { etiqueta: "WhatsApp", valor: 3 },
  { etiqueta: "Manual", valor: 2 },
  { etiqueta: "Otro canal", valor: 1 },
];

export const ETAPAS = [
  { etiqueta: "Contacto", valor: 200 },
  { etiqueta: "Cualificado", valor: 80 },
  { etiqueta: "Visita", valor: 40 },
  { etiqueta: "Oferta", valor: 10 },
  { etiqueta: "Contrato", valor: 4 },
];

export const PUNTOS = [
  { id: "c1", etiqueta: "Campaña A", x: 12000, y: 2.4 },
  { id: "c2", etiqueta: "Campaña B", x: 8000, y: 3.1 },
  { id: "c3", etiqueta: "Campaña C", x: 30000, y: 1.2 },
];
