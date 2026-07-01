import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Settings2,
  Building2,
  Store,
  Receipt,
  Scale,
} from "lucide-react";

export type MonetizacionNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MONETIZACION_NAV: MonetizacionNavItem[] = [
  { id: "p1", href: "/credit-hub/monetizacion/dashboard", label: "Dashboard god-view", icon: LayoutDashboard },
  { id: "p2", href: "/credit-hub/monetizacion/ingresos", label: "Ingresos", icon: TrendingUp },
  { id: "p3", href: "/credit-hub/monetizacion/costo-margen", label: "Costo & margen", icon: PieChart },
  { id: "p4", href: "/credit-hub/monetizacion/configuracion", label: "Configuración de cobro", icon: Settings2 },
  { id: "p5", href: "/credit-hub/monetizacion/metricas-banco", label: "Métricas del banco", icon: Building2 },
  { id: "p6", href: "/credit-hub/monetizacion/metricas-dealer", label: "Métricas del dealer", icon: Store },
  { id: "p7", href: "/credit-hub/monetizacion/estado-cuenta", label: "Estado de cuenta", icon: Receipt },
  { id: "p8", href: "/credit-hub/monetizacion/reconciliacion", label: "Reconciliación", icon: Scale },
];

export const MONETIZACION_BASE = "/credit-hub/monetizacion";
