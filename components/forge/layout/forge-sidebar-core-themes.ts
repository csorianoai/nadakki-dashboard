import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  FileSpreadsheet,
  Megaphone,
  Scale,
  Settings,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

export type SidebarCoreThemeId =
  | "credit"
  | "legal"
  | "marketing"
  | "sic"
  | "projects"
  | "contable"
  | "ai-studio"
  | "advertising"
  | "admin";

/** Visual system: one identity per top-level hub (Tailwind utility classes). */
export type SidebarCoreTheme = {
  id: SidebarCoreThemeId;
  Icon: LucideIcon;
  iconText: string;
};

export const SIDEBAR_SECTION_TO_THEME: Record<string, SidebarCoreThemeId> = {
  "marketing-hub": "marketing",
  "credit-hub": "credit",
  "legal-hub": "legal",
  "sic-hub": "sic",
  "projects-hub": "projects",
  "contable-hub": "contable",
  "ai-studio-hub": "ai-studio",
  "advertising-hub": "advertising",
  admin: "admin",
};

export const SIDEBAR_CORE_THEMES: Record<SidebarCoreThemeId, SidebarCoreTheme> = {
  credit: {
    id: "credit",
    Icon: Wallet,
    iconText: "text-amber-400",
  },
  legal: {
    id: "legal",
    Icon: Scale,
    iconText: "text-violet-400",
  },
  marketing: {
    id: "marketing",
    Icon: Megaphone,
    iconText: "text-pink-400",
  },
  projects: {
    id: "projects",
    Icon: Building2,
    iconText: "text-indigo-400",
  },
  sic: {
    id: "sic",
    Icon: FileSpreadsheet,
    iconText: "text-emerald-400",
  },
  contable: {
    id: "contable",
    Icon: BookOpen,
    iconText: "text-teal-400",
  },
  "ai-studio": {
    id: "ai-studio",
    Icon: Sparkles,
    iconText: "text-fuchsia-400",
  },
  advertising: {
    id: "advertising",
    Icon: Target,
    iconText: "text-orange-400",
  },
  admin: {
    id: "admin",
    Icon: Settings,
    iconText: "text-slate-400",
  },
};

export function getSidebarTheme(sectionId: string): SidebarCoreTheme {
  const key = SIDEBAR_SECTION_TO_THEME[sectionId] ?? "admin";
  return SIDEBAR_CORE_THEMES[key];
}

export function roleAccentClasses(coreName: string | undefined): string {
  switch (coreName) {
    case "credit":
      return "border border-amber-500/30 bg-amber-500/15 text-amber-300";
    case "legal":
      return "border border-violet-500/30 bg-violet-500/15 text-violet-300";
    case "marketing":
      return "border border-pink-500/30 bg-pink-500/15 text-pink-300";
    case "sic":
      return "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300";
    case "projects":
      return "border border-indigo-500/30 bg-indigo-500/15 text-indigo-300";
    case "platform":
      return "border border-slate-500/30 bg-slate-500/15 text-slate-300";
    default:
      return "border border-zinc-600 bg-zinc-800/80 text-zinc-300";
  }
}
