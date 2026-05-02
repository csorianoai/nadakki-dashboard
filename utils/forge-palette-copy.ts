/**
 * Command palette labels (Phase 5 Item 5) — EN/ES via tenant locale.
 */

import { forgeToastLangFromLocale, type ForgeToastLang } from "./forge-toast-copy";

export function forgePaletteLang(locale: string | undefined): ForgeToastLang {
  return forgeToastLangFromLocale(locale);
}

const COPY = {
  es: {
    placeholder: "Buscar comandos o ID de solicitud…",
    empty: "No hay coincidencias. Pulse Enter para buscar en solicitudes.",
    footerClose: "cerrar",
    footerToggle: "alternar",
    groupSearch: "Búsqueda",
    groupGlobal: "General",
    groupBank: "Banco",
    groupDealer: "Concesionario",
    goDashboard: "Ir al panel",
    searchApplications: (q: string) => `Buscar solicitudes: «${q}»`,
    goApplicationId: (id: string) => `Ir a ${id}`,
    densityComfortable: "Densidad de tabla: cómoda",
    densityCompact: "Densidad de tabla: compacta",
    densityDense: "Densidad de tabla: densa",
    profileSettings: "Perfil y configuración (cuenta)",
    signOut: "Cerrar sesión",
    shortcuts: "Ver atajos de teclado",
    bankApplications: "Ir a solicitudes",
    bankQueue: "Ir a cola de revisión",
    bankAudit: "Ir a auditoría",
    bankCompliance: "Ir a cumplimiento",
    bankAlerts: "Ver alertas AML/KYC",
    switchTenantSoon: "Cambiar institución (próximamente)",
    dealerNew: "Crear nueva solicitud",
    dealerDrafts: "Ir a borradores",
    dealerSubmitted: "Ir a solicitudes enviadas",
    dealerApproved: "Ir a solicitudes aprobadas",
    dealerSimulator: "Simulador de preaprobación",
    shortcutsModalTitle: "Atajos de teclado — Forge Credit Hub",
    shortcutsModalIntro: "Estos atajos aplican mientras navega en Credit Hub.",
    scPalette: "Abrir paleta de comandos",
    scEsc: "Cerrar la superposición activa (modal, cajón o paleta)",
    scTab: "Navegar hacia adelante entre controles enfocados",
    scShiftTab: "Navegar hacia atrás entre controles enfocados",
    scEnter: "Activar el elemento enfocado",
  },
  en: {
    placeholder: "Search commands or application ID…",
    empty: "No commands match. Press Enter to search applications.",
    footerClose: "close",
    footerToggle: "toggle",
    groupSearch: "Search",
    groupGlobal: "Global",
    groupBank: "Bank",
    groupDealer: "Dealer",
    goDashboard: "Go to dashboard",
    searchApplications: (q: string) => `Search applications: "${q}"`,
    goApplicationId: (id: string) => `Go to ${id}`,
    densityComfortable: "Table density: comfortable",
    densityCompact: "Table density: compact",
    densityDense: "Table density: dense",
    profileSettings: "Profile & account settings",
    signOut: "Sign out",
    shortcuts: "View keyboard shortcuts",
    bankApplications: "Go to applications list",
    bankQueue: "Go to pending review queue",
    bankAudit: "Go to audit trail",
    bankCompliance: "Go to compliance dashboard",
    bankAlerts: "View AML/KYC alerts",
    switchTenantSoon: "Switch institution (coming soon)",
    dealerNew: "Create new application",
    dealerDrafts: "Go to my drafts",
    dealerSubmitted: "Go to submitted applications",
    dealerApproved: "Go to approved applications",
    dealerSimulator: "Pre-approval simulator",
    shortcutsModalTitle: "Keyboard shortcuts — Forge Credit Hub",
    shortcutsModalIntro: "These shortcuts apply while you navigate Credit Hub.",
    scPalette: "Open command palette",
    scEsc: "Close the active overlay (modal, drawer, or palette)",
    scTab: "Move focus forward between controls",
    scShiftTab: "Move focus backward between controls",
    scEnter: "Activate the focused element",
  },
} as const;

export function forgePaletteCopy(locale: string | undefined) {
  const lang = forgePaletteLang(locale);
  return COPY[lang];
}
