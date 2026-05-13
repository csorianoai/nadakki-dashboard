import type { LucideIcon } from "lucide-react";
import { Building2, Megaphone, Scale, Settings, Wallet, Workflow } from "lucide-react";

export type SidebarCoreThemeId = "credit" | "legal" | "marketing" | "sic" | "workflows" | "admin";

/** Visual system: one identity per top-level hub (Tailwind utility classes). */
export type SidebarCoreTheme = {
  id: SidebarCoreThemeId;
  Icon: LucideIcon;
  iconBox: string;
  iconText: string;
  headerIdle: string;
  headerActive: string;
  headerRing: string;
  borderExpanded: string;
  sectionTint: string;
  rowHover: string;
  linkMuted: string;
  linkHover: string;
  linkActiveBg: string;
  linkActiveText: string;
  linkActiveBorder: string;
  linkActiveShadow: string;
  folderMuted: string;
  folderHover: string;
  gradient: string;
};

export const SIDEBAR_SECTION_TO_THEME: Record<string, SidebarCoreThemeId> = {
  "credit-hub": "credit",
  "legal-hub": "legal",
  "marketing-hub": "marketing",
  "sic-hub": "sic",
  workflows: "workflows",
  admin: "admin",
};

export const SIDEBAR_CORE_THEMES: Record<SidebarCoreThemeId, SidebarCoreTheme> = {
  credit: {
    id: "credit",
    Icon: Building2,
    iconBox: "bg-amber-500/15",
    iconText: "text-amber-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-amber-200",
    headerRing: "ring-amber-500/25",
    borderExpanded: "border-l-amber-500",
    sectionTint: "bg-amber-500/[0.04]",
    rowHover: "hover:bg-amber-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-amber-500/10",
    linkActiveText: "text-amber-300",
    linkActiveBorder: "border-l-amber-400",
    linkActiveShadow: "shadow-md shadow-amber-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-amber-500/10 hover:text-zinc-200",
    gradient: "from-amber-500 to-orange-500",
  },
  legal: {
    id: "legal",
    Icon: Scale,
    iconBox: "bg-violet-500/15",
    iconText: "text-violet-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-violet-200",
    headerRing: "ring-violet-500/25",
    borderExpanded: "border-l-violet-500",
    sectionTint: "bg-violet-500/[0.04]",
    rowHover: "hover:bg-violet-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-violet-500/10",
    linkActiveText: "text-violet-300",
    linkActiveBorder: "border-l-violet-400",
    linkActiveShadow: "shadow-md shadow-violet-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-violet-500/10 hover:text-zinc-200",
    gradient: "from-violet-500 to-purple-500",
  },
  marketing: {
    id: "marketing",
    Icon: Megaphone,
    iconBox: "bg-pink-500/15",
    iconText: "text-pink-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-pink-200",
    headerRing: "ring-pink-500/25",
    borderExpanded: "border-l-pink-500",
    sectionTint: "bg-pink-500/[0.04]",
    rowHover: "hover:bg-pink-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-pink-500/10",
    linkActiveText: "text-pink-300",
    linkActiveBorder: "border-l-pink-400",
    linkActiveShadow: "shadow-md shadow-pink-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-pink-500/10 hover:text-zinc-200",
    gradient: "from-pink-500 to-rose-500",
  },
  sic: {
    id: "sic",
    Icon: Wallet,
    iconBox: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-emerald-200",
    headerRing: "ring-emerald-500/25",
    borderExpanded: "border-l-emerald-500",
    sectionTint: "bg-emerald-500/[0.04]",
    rowHover: "hover:bg-emerald-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-emerald-500/10",
    linkActiveText: "text-emerald-300",
    linkActiveBorder: "border-l-emerald-400",
    linkActiveShadow: "shadow-md shadow-emerald-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-emerald-500/10 hover:text-zinc-200",
    gradient: "from-emerald-500 to-teal-500",
  },
  workflows: {
    id: "workflows",
    Icon: Workflow,
    iconBox: "bg-cyan-500/15",
    iconText: "text-cyan-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-cyan-200",
    headerRing: "ring-cyan-500/25",
    borderExpanded: "border-l-cyan-500",
    sectionTint: "bg-cyan-500/[0.04]",
    rowHover: "hover:bg-cyan-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-cyan-500/10",
    linkActiveText: "text-cyan-300",
    linkActiveBorder: "border-l-cyan-400",
    linkActiveShadow: "shadow-md shadow-cyan-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-cyan-500/10 hover:text-zinc-200",
    gradient: "from-cyan-500 to-blue-500",
  },
  admin: {
    id: "admin",
    Icon: Settings,
    iconBox: "bg-slate-500/15",
    iconText: "text-slate-400",
    headerIdle: "text-zinc-200",
    headerActive: "text-slate-200",
    headerRing: "ring-slate-500/25",
    borderExpanded: "border-l-slate-400",
    sectionTint: "bg-slate-500/[0.06]",
    rowHover: "hover:bg-slate-500/12",
    linkMuted: "text-zinc-400",
    linkHover: "hover:text-zinc-200",
    linkActiveBg: "bg-slate-500/10",
    linkActiveText: "text-slate-300",
    linkActiveBorder: "border-l-slate-400",
    linkActiveShadow: "shadow-md shadow-slate-500/20",
    folderMuted: "text-zinc-400",
    folderHover: "hover:bg-slate-500/10 hover:text-zinc-200",
    gradient: "from-slate-500 to-zinc-600",
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
    case "platform":
      return "border border-slate-500/30 bg-slate-500/15 text-slate-300";
    default:
      return "border border-zinc-600 bg-zinc-800/80 text-zinc-300";
  }
}
