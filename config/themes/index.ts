// NADAKKI AI - Sistema de Temas Enterprise
// Default: Graphite Pro (reduce fatiga visual, estándar enterprise)

export type ThemeId = "graphite" | "quantum" | "navy" | "gradient" | "olive" | "arctic";

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgHover: string;
  bgActive: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGradientFrom: string;
  accentGradientTo: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderPrimary: string;
  borderSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  sidebarActive: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  preview: string;
  category: "standard" | "premium" | "exclusive";
  recommendedFor: string[];
}

// TEMA 1: GRAPHITE PRO (DEFAULT - Enterprise Standard)
export const THEME_GRAPHITE: Theme = {
  id: "graphite",
  name: "Graphite Pro",
  description: "Premium y profesional. Reduce fatiga visual, ideal para uso prolongado.",
  preview: "#0F172A",
  category: "standard",
  recommendedFor: ["enterprise", "banks", "corporate", "long-sessions"],
  colors: {
    bgPrimary: "#0F172A",
    bgSecondary: "#111827",
    bgTertiary: "#1E293B",
    bgCard: "rgba(30, 41, 59, 0.5)",
    bgHover: "rgba(30, 41, 59, 0.7)",
    bgActive: "rgba(30, 41, 59, 0.9)",
    accentPrimary: "#6366f1",
    accentSecondary: "#22d3ee",
    accentGradientFrom: "#6366f1",
    accentGradientTo: "#a855f7",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    borderPrimary: "rgba(148, 163, 184, 0.15)",
    borderSecondary: "rgba(148, 163, 184, 0.08)",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#f43f5e",
    info: "#0ea5e9",
    sidebarBg: "rgba(17, 24, 39, 0.98)",
    sidebarBorder: "rgba(55, 65, 81, 0.5)",
    sidebarHover: "rgba(55, 65, 81, 0.5)",
    sidebarActive: "rgba(99, 102, 241, 0.2)",
  }
};

// TEMA 2: QUANTUM DARK (Power Users / Night Mode)
export const THEME_QUANTUM: Theme = {
  id: "quantum",
  name: "Quantum Dark",
  description: "Modo nocturno con acentos morados/cyan. Para power users y sesiones nocturnas.",
  preview: "#0a0f1c",
  category: "standard",
  recommendedFor: ["developers", "night-mode", "ai-labs", "power-users"],
  colors: {
    bgPrimary: "#0a0f1c",
    bgSecondary: "#0d1117",
    bgTertiary: "#161b22",
    bgCard: "rgba(255, 255, 255, 0.03)",
    bgHover: "rgba(255, 255, 255, 0.05)",
    bgActive: "rgba(255, 255, 255, 0.08)",
    accentPrimary: "#8b5cf6",
    accentSecondary: "#06b6d4",
    accentGradientFrom: "#8b5cf6",
    accentGradientTo: "#06b6d4",
    textPrimary: "#ffffff",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    borderPrimary: "rgba(255, 255, 255, 0.1)",
    borderSecondary: "rgba(255, 255, 255, 0.05)",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
    sidebarBg: "rgba(15, 23, 42, 0.95)",
    sidebarBorder: "rgba(51, 65, 85, 0.5)",
    sidebarHover: "rgba(51, 65, 85, 0.5)",
    sidebarActive: "rgba(6, 182, 212, 0.2)",
  }
};

// TEMA 3: NAVY TECH (Fintech / Risk / Scoring)
export const THEME_NAVY: Theme = {
  id: "navy",
  name: "Navy Tech",
  description: "Estética fintech y AI. Perfecto para módulos de scoring y decisiones.",
  preview: "#0B1220",
  category: "premium",
  recommendedFor: ["fintech", "risk", "scoring", "analytics"],
  colors: {
    bgPrimary: "#0B1220",
    bgSecondary: "#0A1A2F",
    bgTertiary: "#0F2847",
    bgCard: "rgba(15, 40, 71, 0.4)",
    bgHover: "rgba(15, 40, 71, 0.6)",
    bgActive: "rgba(15, 40, 71, 0.8)",
    accentPrimary: "#3b82f6",
    accentSecondary: "#06b6d4",
    accentGradientFrom: "#2563eb",
    accentGradientTo: "#0891b2",
    textPrimary: "#e2e8f0",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    borderPrimary: "rgba(59, 130, 246, 0.2)",
    borderSecondary: "rgba(59, 130, 246, 0.1)",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
    sidebarBg: "rgba(10, 26, 47, 0.98)",
    sidebarBorder: "rgba(59, 130, 246, 0.2)",
    sidebarHover: "rgba(59, 130, 246, 0.1)",
    sidebarActive: "rgba(59, 130, 246, 0.25)",
  }
};

// TEMA 4: GRADIENT PREMIUM (Demos / Marketing / Executives)
export const THEME_GRADIENT: Theme = {
  id: "gradient",
  name: "Gradient Premium",
  description: "Dinamismo visual para demos y presentaciones ejecutivas.",
  preview: "#020617",
  category: "premium",
  recommendedFor: ["demos", "marketing", "executives", "presentations"],
  colors: {
    bgPrimary: "#020617",
    bgSecondary: "#0F172A",
    bgTertiary: "#1E293B",
    bgCard: "rgba(15, 23, 42, 0.6)",
    bgHover: "rgba(30, 41, 59, 0.6)",
    bgActive: "rgba(30, 41, 59, 0.8)",
    accentPrimary: "#a855f7",
    accentSecondary: "#ec4899",
    accentGradientFrom: "#7c3aed",
    accentGradientTo: "#ec4899",
    textPrimary: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    borderPrimary: "rgba(168, 85, 247, 0.2)",
    borderSecondary: "rgba(168, 85, 247, 0.1)",
    success: "#4ade80",
    warning: "#facc15",
    error: "#fb7185",
    info: "#818cf8",
    sidebarBg: "rgba(15, 23, 42, 0.98)",
    sidebarBorder: "rgba(168, 85, 247, 0.2)",
    sidebarHover: "rgba(168, 85, 247, 0.1)",
    sidebarActive: "rgba(168, 85, 247, 0.25)",
  }
};

// TEMA 5: OLIVE GUNMETAL (White-label Premium / Exclusivo)
export const THEME_OLIVE: Theme = {
  id: "olive",
  name: "Olive Executive",
  description: "Elegante y exclusivo. Para clientes premium que buscan diferenciación.",
  preview: "#0D1B1E",
  category: "exclusive",
  recommendedFor: ["white-label", "premium-clients", "exclusive"],
  colors: {
    bgPrimary: "#0D1B1E",
    bgSecondary: "#0F1E17",
    bgTertiary: "#1A2F24",
    bgCard: "rgba(26, 47, 36, 0.5)",
    bgHover: "rgba(26, 47, 36, 0.7)",
    bgActive: "rgba(26, 47, 36, 0.9)",
    accentPrimary: "#10b981",
    accentSecondary: "#14b8a6",
    accentGradientFrom: "#059669",
    accentGradientTo: "#0d9488",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
    textMuted: "#6ee7b7",
    borderPrimary: "rgba(16, 185, 129, 0.2)",
    borderSecondary: "rgba(16, 185, 129, 0.1)",
    success: "#34d399",
    warning: "#fcd34d",
    error: "#fca5a5",
    info: "#67e8f9",
    sidebarBg: "rgba(15, 30, 23, 0.98)",
    sidebarBorder: "rgba(16, 185, 129, 0.2)",
    sidebarHover: "rgba(16, 185, 129, 0.1)",
    sidebarActive: "rgba(16, 185, 129, 0.25)",
  }
};


// TEMA 6: ARCTIC TURQUOISE (Light Theme - Turquesa con Blanco)
export const THEME_ARCTIC: Theme = {
  id: "arctic",
  name: "Arctic Turquoise",
  description: "Tema claro con turquesa y blanco. Fresco, moderno y profesional para uso diurno.",
  preview: "#f8fafc",
  category: "premium",
  recommendedFor: ["day-use", "presentations", "fresh-look", "modern"],
  colors: {
    bgPrimary: "#f8fafc",
    bgSecondary: "#ffffff",
    bgTertiary: "#f1f5f9",
    bgCard: "rgba(15, 23, 42, 0.03)",
    bgHover: "rgba(15, 23, 42, 0.06)",
    bgActive: "rgba(15, 23, 42, 0.09)",
    accentPrimary: "#0d9488",
    accentSecondary: "#0891b2",
    accentGradientFrom: "#0d9488",
    accentGradientTo: "#0891b2",
    textPrimary: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    borderPrimary: "rgba(15, 23, 42, 0.1)",
    borderSecondary: "rgba(15, 23, 42, 0.05)",
    success: "#059669",
    warning: "#d97706",
    error: "#dc2626",
    info: "#0284c7",
    sidebarBg: "#ffffff",
    sidebarBorder: "rgba(15, 23, 42, 0.08)",
    sidebarHover: "rgba(13, 148, 136, 0.08)",
    sidebarActive: "rgba(13, 148, 136, 0.15)",
  }
};

// Export all themes
export const THEMES: Record<ThemeId, Theme> = {
  arctic: THEME_ARCTIC,
  graphite: THEME_GRAPHITE,
  quantum: THEME_QUANTUM,
  navy: THEME_NAVY,
  gradient: THEME_GRADIENT,
  olive: THEME_OLIVE,
};

// DEFAULT: Graphite (enterprise standard, reduce eye strain)
export const DEFAULT_THEME: ThemeId = "graphite";

// Theme order for UI display
export const THEME_ORDER: ThemeId[] = ["graphite", "quantum", "navy", "gradient", "olive", "arctic"];


