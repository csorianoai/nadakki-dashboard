import type { Cifra } from "@/lib/analytics/cifra";
import type { PuntoSerie } from "@/lib/analytics/graficos";

/**
 * Contrato de datos de la pantalla (adaptador tipado). La implementacion DEMO vive en ./demo (solo se carga con el flag).
 * El contrato real esperado esta en docs/marketing/analytics-contratos/M1_resumen_ejecutivo.md (rama
 * claude/relaxed-mccarthy-iaw4fa-contratos-ola1-2 de nadakki-ai-suite): endpoint propuesto GET /api/v1/marketing/insights/summary.
 */
export type LecturaCampana = "bajo_objetivo" | "entre_objetivo_equilibrio" | "sobre_equilibrio" | "datos_insuficientes";

export interface FilaCampana {
  id: string;
  nombre: string;
  inversion: Cifra;
  leads: Cifra;
  /** CPA de la campana; "datos_insuficientes" con menos de MIN_CONVERSIONES conversiones. */
  cpa: Cifra;
  lectura: LecturaCampana;
}

export interface SupuestosEconomicos {
  /** CPA objetivo configurable por el cliente (B2-T1). */
  objetivo: number | null;
  /** Equilibrio = comision x tasa de cierre (B2-T1). */
  equilibrio: number | null;
  comision: number | null;
  tasa_cierre: number | null;
  moneda: string;
  /** Rango probable del CPA (B2-T2); null si no existe. */
  rango_probable: { min: number; max: number } | null;
  /** Fuente y fecha de los supuestos. */
  fuente: string | null;
  fecha_dato: string | null;
  /** Cierres reales confirmados por el CRM en el periodo. null = el CRM aun no esta integrado ("pendiente"). */
  cierres_crm: number | null;
}

export type TonoCalidad = "ok" | "aviso" | "neutro";

export interface FilaCalidad {
  id: string;
  etiqueta: string;
  estado: string;
  tono: TonoCalidad;
}

export interface DatosCommandCenter {
  tenant: string;
  /** Cuentas conectadas, ya enmascaradas para mostrar. */
  cuentas: string[];
  /** Instante de la ultima actualizacion (ISO completo, UTC). */
  actualizado: string;
  /** Dias finales del periodo que pueden recibir conversiones tardias. */
  dias_incompletos: number;
  inversion: Cifra;
  cpa: Cifra;
  leads: Cifra;
  secundarias: Cifra[];
  serie: {
    gasto: PuntoSerie[];
    gasto_anterior: PuntoSerie[];
    /** Conversiones por dia, alineadas con `gasto`. */
    conversiones: PuntoSerie[];
    fuente: string | null;
    fecha_dato: string | null;
  };
  /** Conversiones totales del periodo (para el semaforo: muestra pequena). */
  conversiones_total: number | null;
  supuestos: SupuestosEconomicos;
  campanas: FilaCampana[];
  decisiones: { negativas_propuestas: number | null; riesgo: Cifra | null; presupuesto_propuestas: number | null };
  calidad: FilaCalidad[];
}

export type EstadoPantalla = "ok" | "cargando" | "error" | "vacio";

/** Tema de la pantalla. "dark" = azul noche (diseno aprobado), el que se revisa para BASELINE_APPROVED. */
export type TemaPantalla = "dark" | "light";
