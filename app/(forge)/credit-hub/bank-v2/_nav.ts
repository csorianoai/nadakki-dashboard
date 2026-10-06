import { BarChart3, Car, ClipboardCheck, Gauge, History, Inbox, LayoutDashboard, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { DccNavGroup } from "@/components/dcc/shell/DccShell";

/** Raiz del panel del banco rediseñado. */
export const BANCO_V2_RAIZ = "/credit-hub/bank-v2";

/**
 * Menu del banco (bank-v2). Las pantallas que aun no tienen version -v2
 * apuntan a su ruta ACTUAL, para que nada quede inalcanzable mientras la
 * serie avanza. Cada PR de la serie cambia aqui el href de lo que rediseña.
 * Las pantallas del portal dealer quedan fuera (D-B5).
 */
export const BANCO_V2_NAV: DccNavGroup[] = [
  {
    label: "Operación",
    items: [
      { id: "mesa", label: "Mesa de decisiones", href: BANCO_V2_RAIZ, icon: LayoutDashboard },
      { id: "bandeja", label: "Bandeja", href: `${BANCO_V2_RAIZ}/solicitudes`, icon: Inbox },
      { id: "escalaciones", label: "Escalaciones", href: `${BANCO_V2_RAIZ}/escalaciones`, icon: ShieldAlert },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { id: "analitica", label: "Analítica", href: `${BANCO_V2_RAIZ}/analitica`, icon: BarChart3 },
      { id: "kpis", label: "KPIs de banco", href: `${BANCO_V2_RAIZ}/kpis`, icon: Gauge },
    ],
  },
  {
    label: "Control",
    items: [
      { id: "cumplimiento", label: "Cumplimiento", href: `${BANCO_V2_RAIZ}/cumplimiento`, icon: ClipboardCheck },
      { id: "auditoria", label: "Auditoría", href: `${BANCO_V2_RAIZ}/auditoria`, icon: History },
      { id: "vehiculos", label: "Historial de vehículos", href: `${BANCO_V2_RAIZ}/vehiculos`, icon: Car },
    ],
  },
  {
    label: "Configuración",
    items: [{ id: "filtros", label: "Filtros de pool", href: "/credit/pool-filters", icon: SlidersHorizontal }],
  },
];
