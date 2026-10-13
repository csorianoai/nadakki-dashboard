/**
 * Navegación de la Suite: fuente ÚNICA (César, 2026-10-13, rediseño para la entrada del personal).
 *
 * De aquí salen el menú lateral (ForgeGlobalCoresSidebar), el buscador Ctrl+K (BuscadorNavegacion) y las
 * pestañas de Marketing (PestanasMarketing). Nada de eso guarda su propia lista de rutas.
 *
 * Forma: 8 secciones de trabajo + Administración, como mucho 2 niveles (sección → página). Marketing es una
 * sola entrada; dentro, sus pantallas se ordenan en pestañas (PESTANAS_MARKETING).
 *
 * Visibilidad (la aplica `filterSectionsForUser` en forge-global-sidebar-nav.ts):
 *   - módulo: la sección (o la página, si declara `coreMatchers` propios) solo se ve si el tenant tiene ese
 *     módulo en `subscribed_cores`. Sin módulo declarado (`sinModulo`) se ve siempre.
 *   - rol: `roles` restringe una página a esos `role_key`; Administración, solo platform_superadmin y
 *     tenant_admin; `superAdminOnly`, solo platform_superadmin.
 *   - una sección que se queda sin páginas no se pinta: cada usuario ve solo lo suyo.
 * Es navegación, no autorización: el backend sigue decidiendo qué puede leer cada uno.
 *
 * Las pantallas de desarrollo y las duplicadas NO se borran: se quedan fuera del menú y del buscador
 * (RUTAS_OCULTAS, con el motivo y cuál es la vigente). Un test lo comprueba.
 */
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Building2,
  Car,
  FileText,
  Home,
  Landmark,
  Megaphone,
  Scale,
  Settings,
  Share2,
  Target,
  Users,
} from "lucide-react";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";
import { isDealerChromePath } from "@/lib/autos-portal/routes";

export type NavBadge = "NEW" | "BETA" | "POPULAR";

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  badge?: NavBadge;
  icon?: LucideIcon;
  /** Encabezado visual dentro de la sección (solo pinta; no es un nivel). */
  groupLabel?: string;
  /** Se conserva por compatibilidad; la navegación de la Suite no usa un tercer nivel. */
  children?: NavItem[];
  /** Solo platform_superadmin. */
  superAdminOnly?: boolean;
  /** Solo si el interruptor de build (NEXT_PUBLIC_*) está encendido. */
  featureFlag?: "forge-monetizacion" | "cockpit-consolidation";
  /** Módulo propio de la página; si falta, el de la sección. */
  coreMatchers?: string[];
  /** Solo estos role_key (los administradores, que ven todo, también). */
  roles?: string[];
  /** Visible sin módulo contratado (Inicio). */
  sinModulo?: boolean;
  /** Palabras extra para el buscador. */
  keywords?: string[];
};

export type NavSection = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: NavBadge;
  coreMatchers: string[];
  children: NavItem[];
  /** Sección que es un solo enlace (Marketing, Real Estate). */
  href?: string;
  /** Visibilidad propia que decide el componente, no la suscripción (Real Estate: 200 de /acceso). */
  acceso?: "realtor";
  /** Compatibilidad con la v2 del menú. */
  alwaysVisible?: boolean;
};

/** Roles que ven Administración. */
export const ROLES_ADMINISTRACION = ["platform_superadmin", "tenant_admin"] as const;

/** Roles del banco y del concesionario dentro de Crédito. */
const ROLES_BANCO = ["credit_admin", "banker", "bank*"];
const ROLES_DEALER = ["dealer*"];

// ── Marketing: una entrada en el menú y seis pestañas dentro ──────────────────────────────────────────

export type PestanaPagina = { href: string; label: string; keywords?: string[] };

export type PestanaMarketing = {
  id: string;
  label: string;
  /** Pantalla con la que abre la pestaña. */
  href: string;
  /** Prefijos de ruta que pertenecen a la pestaña (para marcarla activa). */
  prefijos: string[];
  /** Pantallas de la pestaña (segundo nivel; también entran en el buscador). */
  paginas: PestanaPagina[];
};

/**
 * Agrupa marketing, workflows, social, advertising, campaigns, segments, audiences, email, content, leads,
 * analytics, ai-studio, library, intelligence, autopilot, ame y marketing-hub. El orden de las pestañas es
 * el de una campaña: se planea, se anuncia, se publica, se produce, se capta y se mide.
 */
export const PESTANAS_MARKETING: PestanaMarketing[] = [
  {
    id: "campanas",
    label: "Campañas",
    href: "/marketing/campaigns",
    prefijos: [
      "/marketing-hub", "/marketing/campaigns", "/campaigns", "/marketing/journeys", "/marketing/calendar",
      "/marketing/command-center", "/workflows", "/automations", "/autopilot", "/ame", "/email",
      "/marketing/whatsapp", "/marketing/email-builder",
    ],
    paginas: [
      { href: "/marketing-hub", label: "Resumen de marketing" },
      { href: "/marketing/campaigns", label: "Campañas" },
      { href: "/marketing/campaigns/new", label: "Nueva campaña" },
      { href: "/marketing/journeys", label: "Recorridos del cliente" },
      { href: "/marketing/calendar", label: "Calendario" },
      { href: "/email/campaigns", label: "Correo" },
      { href: "/marketing/whatsapp", label: "WhatsApp" },
      { href: "/workflows", label: "Flujos de trabajo", keywords: ["workflows"] },
      { href: "/automations", label: "Automatizaciones" },
      { href: "/autopilot", label: "Piloto automático", keywords: ["autopilot"] },
      { href: "/ame", label: "Marketing autónomo (AME)" },
    ],
  },
  {
    id: "anuncios",
    label: "Anuncios",
    href: "/advertising",
    prefijos: ["/advertising", "/marketing/google-ads"],
    paginas: [
      { href: "/advertising", label: "Resumen de anuncios" },
      { href: "/advertising/google-ads", label: "Google Ads" },
      { href: "/advertising/meta-ads", label: "Meta Ads" },
      { href: "/advertising/linkedin-ads", label: "LinkedIn Ads" },
      { href: "/advertising/tiktok-ads", label: "TikTok Ads" },
      { href: "/advertising/unified", label: "Todas las plataformas" },
    ],
  },
  {
    id: "redes",
    label: "Redes",
    href: "/social",
    prefijos: ["/social", "/marketing/social", "/marketing/social-connections"],
    paginas: [
      { href: "/social", label: "Redes sociales" },
      { href: "/social/inbox", label: "Bandeja de mensajes" },
      { href: "/marketing/social-connections", label: "Cuentas conectadas" },
      { href: "/social/analytics", label: "Resultados en redes" },
    ],
  },
  {
    id: "contenido",
    label: "Contenido",
    href: "/content",
    prefijos: ["/content", "/library", "/ai-studio", "/marketing/templates", "/marketing/content"],
    paginas: [
      { href: "/content", label: "Contenido" },
      { href: "/content/calendar", label: "Calendario de contenido" },
      { href: "/marketing/templates", label: "Plantillas" },
      { href: "/library", label: "Biblioteca" },
      { href: "/ai-studio", label: "Estudio de IA", keywords: ["ai studio"] },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    href: "/leads",
    prefijos: ["/leads", "/segments", "/audiences", "/marketing/leads", "/marketing/segments", "/marketing/audience-builder"],
    paginas: [
      { href: "/leads", label: "Leads" },
      { href: "/leads/pipeline", label: "Embudo de leads" },
      { href: "/segments", label: "Segmentos" },
      { href: "/audiences", label: "Audiencias" },
    ],
  },
  {
    id: "resultados",
    label: "Resultados",
    href: "/analytics",
    prefijos: [
      "/analytics", "/intelligence", "/competitor-research", "/marketing/analytics", "/marketing/attribution",
      "/marketing/overview", "/marketing/competitive", "/marketing/ab-testing",
    ],
    paginas: [
      { href: "/analytics", label: "Resultados" },
      { href: "/analytics/campaigns", label: "Resultados por campaña" },
      { href: "/analytics/roi", label: "Retorno de la inversión" },
      { href: "/marketing/attribution", label: "Atribución" },
      { href: "/intelligence", label: "Inteligencia de marca" },
    ],
  },
];

/** Raíces que abren la barra de pestañas de Marketing. */
export const PREFIJOS_MARKETING = [
  "/marketing", ...PESTANAS_MARKETING.flatMap((p) => p.prefijos),
];

function bajoPrefijo(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

export function esRutaMarketing(pathname: string | null): boolean {
  if (!pathname) return false;
  return PREFIJOS_MARKETING.some((p) => bajoPrefijo(pathname, p));
}

/** Pestaña activa: la de prefijo más largo que contiene la ruta (/marketing a secas → Campañas). */
export function pestanaMarketingActiva(pathname: string | null): PestanaMarketing | null {
  if (!esRutaMarketing(pathname)) return null;
  let mejor: { p: PestanaMarketing; largo: number } | null = null;
  for (const p of PESTANAS_MARKETING) {
    for (const pre of p.prefijos) {
      if (bajoPrefijo(pathname!, pre) && (!mejor || pre.length > mejor.largo)) mejor = { p, largo: pre.length };
    }
  }
  return mejor?.p ?? PESTANAS_MARKETING[0]!;
}

// ── Concesionarios: las pantallas del panel del dealer, del mismo catálogo que su menú ────────────────

const PAGINAS_CONCESIONARIO: NavItem[] = DEALER_NAV_GROUPS.flatMap((g) => g.items)
  .filter((it) => isDealerChromePath(it.href) && it.href.startsWith("/autos/dealer"))
  .map((it) => ({
    id: `dealer-${it.href.replace(/^\/autos\/dealer\/?/, "") || "inicio"}`,
    label: it.href === "/autos/dealer" ? "Panel del concesionario" : it.label,
    href: it.href,
    icon: it.icon,
  }));

// ── Las 8 secciones de trabajo + Administración ─────────────────────────────────────────────────────

export const NAVEGACION: NavSection[] = [
  {
    id: "inicio",
    label: "Inicio",
    icon: Home,
    coreMatchers: [],
    children: [
      { id: "inicio-home", label: "Inicio", href: "/", sinModulo: true },
      { id: "inicio-notificaciones", label: "Notificaciones", href: "/notifications", sinModulo: true },
      { id: "nauta-cockpit", label: "Empleados digitales", href: "/nauta", coreMatchers: ["nauta"], keywords: ["nauta"] },
    ],
  },
  {
    id: "concesionarios",
    label: "Concesionarios",
    icon: Car,
    coreMatchers: ["autos"],
    children: PAGINAS_CONCESIONARIO,
  },
  {
    id: "credit-hub",
    label: "Crédito",
    icon: Landmark,
    coreMatchers: ["credit"],
    children: [
      { id: "credit-home", label: "Centro de crédito", href: "/credit-hub" },
      { id: "credit-bank", label: "Mesa de decisiones (banco)", href: "/credit-hub/bank-v2", roles: ROLES_BANCO },
      { id: "credit-bank-apps", label: "Bandeja del banco", href: "/credit-hub/bank-v2/solicitudes", roles: ROLES_BANCO },
      { id: "credit-bank-kpis", label: "Indicadores del banco", href: "/credit-hub/bank-v2/kpis", roles: ROLES_BANCO },
      { id: "credit-vehicle-anomalies", label: "Historial de vehículos", href: "/credit-hub/bank-v2/vehiculos", roles: ROLES_BANCO },
      { id: "credit-analytics", label: "Analítica y reportes", href: "/credit-hub/bank-v2/analitica", roles: ROLES_BANCO },
      { id: "credit-compliance", label: "Cumplimiento", href: "/credit-hub/bank-v2/cumplimiento", roles: ROLES_BANCO },
      { id: "credit-audit-ch", label: "Auditoría de crédito", href: "/credit-hub/bank-v2/auditoria", roles: ROLES_BANCO },
      { id: "credit-pool-filters", label: "Filtros de cartera", href: "/credit-hub/bank-v2/filtros", roles: ROLES_BANCO },
      // Crédito del concesionario: vive en Dealer OS (/autos/dealer/credito/**, PR 2 "una sola interfaz").
      { id: "credit-dealer", label: "Crédito del concesionario", href: "/autos/dealer/credito", roles: ROLES_DEALER },
      { id: "credit-dealer-apps", label: "Solicitudes del concesionario", href: "/autos/dealer/credito/solicitudes", roles: ROLES_DEALER },
      {
        id: "credit-new",
        label: "Nueva solicitud",
        href: "/autos/dealer/credito/solicitudes/nueva?new=1",
        roles: ROLES_DEALER,
      },
      { id: "credit-preapproval", label: "Preaprobación", href: "/autos/dealer/credito/preaprobacion", roles: ROLES_DEALER },
      { id: "market-intel-investigations", label: "Inteligencia de mercado", href: "/market-intel", badge: "BETA" },
      {
        id: "credit-monetizacion",
        label: "Métricas y facturación",
        href: "/credit-hub/monetizacion/dashboard",
        badge: "BETA",
        featureFlag: "forge-monetizacion",
      },
      { id: "sic-dash", label: "SIC: panel", href: "/sic", coreMatchers: ["sic", "platform"], keywords: ["sic"] },
      { id: "sic-expedientes", label: "SIC: expedientes", href: "/sic/expedientes", coreMatchers: ["sic", "platform"] },
      { id: "sic-bandeja", label: "SIC: bandeja", href: "/sic/bandeja", coreMatchers: ["sic", "platform"] },
      { id: "sic-reportes", label: "SIC: reportes", href: "/sic/reportes", coreMatchers: ["sic", "platform"] },
      { id: "sic-comite", label: "SIC: comité", href: "/sic/comite", coreMatchers: ["sic", "platform"] },
    ],
  },
  {
    id: "marketing-hub",
    label: "Marketing",
    icon: Megaphone,
    coreMatchers: ["marketing"],
    href: "/marketing-hub",
    children: [
      {
        id: "marketing-entrada",
        label: "Marketing",
        href: "/marketing-hub",
        keywords: ["campañas", "anuncios", "redes", "contenido", "leads", "resultados"],
      },
    ],
  },
  {
    id: "contable-hub",
    label: "Contabilidad",
    icon: BookOpen,
    coreMatchers: ["accounting", "platform", "projects"],
    children: [
      { id: "contable-resumen", label: "Resumen", href: "/contable/resumen" },
      { id: "contable-plan", label: "Plan de cuentas", href: "/contable/plan-cuentas" },
      { id: "contable-periodos", label: "Períodos", href: "/contable/periodos" },
      { id: "contable-asiento", label: "Nuevo asiento", href: "/contable/asientos/nuevo" },
      { id: "contable-mayor", label: "Libro mayor", href: "/contable/libro-mayor" },
      { id: "contable-balance", label: "Balance de comprobación", href: "/contable/balance-comprobacion" },
      { id: "contable-estado-resultados", label: "Estado de resultados", href: "/contable/estado-resultados" },
      { id: "contable-situacion", label: "Situación financiera", href: "/contable/situacion-financiera" },
      { id: "contable-monitor", label: "Monitor de gastos", href: "/contable/monitor-gastos" },
      { id: "contable-ejecutivo", label: "Panel ejecutivo", href: "/contable/ejecutivo" },
      { id: "contable-agente-ia", label: "Consultor de IA", href: "/contable/agente-ia" },
    ],
  },
  {
    id: "legal-hub",
    label: "Legal",
    icon: Scale,
    coreMatchers: ["legal"],
    children: [
      { id: "legal-home", label: "Inicio legal", href: "/legal" },
      { id: "legal-cases", label: "Expedientes", href: "/legal/cases" },
      { id: "legal-cases-new", label: "Nuevo expediente", href: "/legal/cases/new" },
      { id: "legal-contracts", label: "Contratos", href: "/legal/contracts" },
      { id: "legal-audiencias", label: "Audiencias", href: "/legal/audiencias" },
      { id: "legal-research", label: "Investigación", href: "/legal/research" },
      { id: "legal-library", label: "Biblioteca", href: "/legal/library" },
      { id: "legal-audit", label: "Auditoría", href: "/legal/audit" },
      { id: "legal-config", label: "Configuración", href: "/legal/config" },
    ],
  },
  {
    id: "projects-hub",
    label: "Proyectos",
    icon: Building2,
    coreMatchers: ["projects"],
    children: [
      { id: "projects-dash", label: "Panel", href: "/proyectos" },
      { id: "projects-portfolio", label: "Portafolio", href: "/proyectos/portafolio" },
      { id: "projects-dash-ceo", label: "Panel del CEO", href: "/proyectos/dashboards/ceo" },
      { id: "projects-dash-pm", label: "Panel del gerente de proyecto", href: "/proyectos/dashboards/pm" },
      { id: "projects-dash-inv", label: "Panel del inversionista", href: "/proyectos/dashboards/inversionista" },
      { id: "projects-new", label: "Nuevo proyecto", href: "/proyectos/new" },
    ],
  },
  {
    id: "real-estate",
    label: "Real Estate",
    icon: Building2,
    coreMatchers: [],
    href: "/realtor",
    acceso: "realtor",
    children: [{ id: "realtor-home", label: "Real Estate", href: "/realtor", sinModulo: true, keywords: ["inmobiliaria", "realtor"] }],
  },
  {
    id: "admin",
    label: "Administración",
    icon: Settings,
    coreMatchers: [],
    children: [
      { id: "adm-home", label: "Panel de administración", href: "/admin", superAdminOnly: true },
      { id: "adm-gates", label: "Usuarios y roles", href: "/admin/gates", superAdminOnly: true },
      {
        id: "adm-network-cockpit",
        label: "Cabina de la red",
        href: "/cockpit",
        superAdminOnly: true,
        featureFlag: "cockpit-consolidation",
        keywords: ["cockpit"],
      },
      // /tenants NO va en el menú aunque sea de Administración: lista tenants inventados con API keys falsas
      // (hallazgo D2b, tests/forge/SidebarCambiarTenant.test.tsx). Los tenants reales están en la cabina.
      { id: "set-home", label: "Ajustes", href: "/settings" },
      { id: "set-integrations", label: "Integraciones", href: "/settings/integrations" },
      { id: "adm-billing-root", label: "Facturación", href: "/billing", keywords: ["billing"] },
      { id: "adm-audit", label: "Auditoría", href: "/audit", keywords: ["audit"] },
      { id: "adm-flags", label: "Interruptores", href: "/feature-flags", superAdminOnly: true, keywords: ["feature flags"] },
    ],
  },
];

// ── Ocultas del menú y del buscador (no se borran) ─────────────────────────────────────────────────

export type RutaOculta = { ruta: string; motivo: string; vigente?: string };

/**
 * `ruta` es un prefijo: oculta esa pantalla y todo lo que cuelga de ella. Siguen abriéndose por URL.
 */
export const RUTAS_OCULTAS: RutaOculta[] = [
  { ruta: "/credit-hub/_design", motivo: "maqueta de diseño" },
  { ruta: "/credit-hub/components", motivo: "catálogo de componentes de desarrollo" },
  { ruta: "/credit-hub/preview", motivo: "vista previa de desarrollo" },
  { ruta: "/testing", motivo: "laboratorio de pruebas" },
  { ruta: "/sic/demo", motivo: "modo demostración", vigente: "/sic" },
  { ruta: "/workflow-real", motivo: "copia sin enlace del flujo del banco", vigente: "/credit-hub/bank-v2/solicitudes" },
  { ruta: "/execute", motivo: "ejecutor de desarrollo" },
  { ruta: "/agents/execute", motivo: "ejecutor de desarrollo" },
  { ruta: "/bank", motivo: "copia antigua del panel del banco", vigente: "/credit-hub/bank-v2" },
  {
    ruta: "/proyectos/[id]/masterplan",
    motivo: "duplicado de master-plan (pestaña «Comité MP», solo con NEXT_PUBLIC_MASTERPLAN_ENABLED)",
    vigente: "/proyectos/[id]/master-plan",
  },
  { ruta: "/autos/dealer/inicio-v2", motivo: "versión 2 en prueba", vigente: "/autos/dealer" },
  { ruta: "/autos/dealer/reportes-v2", motivo: "versión 2 en prueba", vigente: "/autos/dealer/insights" },
];

function sinQuery(href: string): string {
  return href.split(/[?#]/)[0]!;
}

export function esRutaOculta(href: string): boolean {
  const ruta = sinQuery(href).split("/");
  return RUTAS_OCULTAS.some((o) => {
    // Prefijo por segmentos; un segmento [id] vale por cualquiera.
    const patron = o.ruta.split("/");
    return patron.length <= ruta.length && patron.every((seg, i) => /^\[.+\]$/.test(seg) || seg === ruta[i]);
  });
}

// ── Buscador Ctrl+K ─────────────────────────────────────────────────────────────────────────────────

export type EntradaBuscador = {
  id: string;
  label: string;
  href: string;
  seccion: string;
  keywords: string[];
};

/**
 * Entradas del buscador a partir de las secciones YA filtradas para el usuario: lo que no ve en el menú,
 * no lo encuentra. Marketing aporta además las pantallas de sus pestañas.
 */
export function entradasBuscador(secciones: NavSection[]): EntradaBuscador[] {
  const out: EntradaBuscador[] = [];
  const vistos = new Set<string>();
  const add = (e: EntradaBuscador) => {
    if (esRutaOculta(e.href) || vistos.has(e.href)) return;
    vistos.add(e.href);
    out.push(e);
  };
  for (const sec of secciones) {
    for (const it of sec.children) {
      if (it.href) add({ id: it.id, label: it.label, href: it.href, seccion: sec.label, keywords: it.keywords ?? [] });
    }
    if (sec.id === "marketing-hub" && sec.children.length > 0) {
      for (const p of PESTANAS_MARKETING) {
        for (const pg of p.paginas) {
          add({
            id: `mkt-${p.id}-${pg.href}`,
            label: pg.label,
            href: pg.href,
            seccion: `Marketing · ${p.label}`,
            keywords: [p.label, ...(pg.keywords ?? [])],
          });
        }
      }
    }
  }
  return out;
}

/** Iconos de las pestañas (los usa PestanasMarketing). */
export const ICONO_PESTANA: Record<string, LucideIcon> = {
  campanas: Megaphone,
  anuncios: Target,
  redes: Share2,
  contenido: FileText,
  leads: Users,
  resultados: BarChart3,
};
