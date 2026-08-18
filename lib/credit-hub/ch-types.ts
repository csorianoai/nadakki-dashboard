/** Credit Hub Package 0 — shared primitive & shell types. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type PersonaType = "bank" | "dealer";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type DecisionState = "idle" | "loading" | "success" | "error" | "conflict";

export type DecisionMode = "approve" | "counter" | "reject";

export type EmptyStateVariant = "empty" | "error" | "filter-empty" | "placeholder";

export type RiskBandSize = "sm" | "md" | "lg";

export interface ScoreVisualProps {
  score?: number;
  min?: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: boolean;
}

export interface RiskBandProps {
  level?: RiskLevel;
  size?: RiskBandSize;
  showDot?: boolean;
  label?: string;
  className?: string;
}

export interface DecisionPanelProps {
  amount?: number;
  term?: number;
  rate?: number;
  state?: DecisionState;
  sticky?: boolean;
  className?: string;
  /** When false, decision actions are disabled (role guard). */
  canDecide?: boolean;
  /** Specific backend error (e.g. OFFER_ROOM_CLOSED). */
  errorDetail?: string | null;
  onSubmit?: (mode: DecisionMode, justification: string) => void;
}

export interface EvidenceItem {
  id?: string;
  icon?: LucideIcon;
  title: string;
  body: string;
  source?: string;
  sourceLabel?: string;
  conf?: "alto" | "medio" | "bajo";
  confidence?: "high" | "medium" | "low";
}

export interface IdentityEvidence {
  liveness?: {
    status: "live" | "spoof" | "needs_review" | "not_applicable" | null;
    pad_score: number | null;
    provider: string | null;
    evidence_id: string | null;
    checked_at?: string | null;
  } | null;
  face_match?: {
    status: "matched" | "no_match" | "needs_review" | "not_applicable" | null;
    score: number | null;
    provider: string | null;
  } | null;
  cedula?: {
    verified: boolean;
    document_id: string | null;
    extracted_name: string | null;
  } | null;
}

export interface EvidenceGridProps {
  items?: EvidenceItem[];
  identity?: IdentityEvidence;
  className?: string;
}

export interface BulkActionBarProps {
  count?: number;
  selectedCount?: number;
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
}

export interface StepperWizardStep {
  id?: string;
  label: string;
  href?: string;
}

export interface StepperWizardProps {
  steps?: StepperWizardStep[] | string[];
  current?: number;
  currentIndex?: number;
  errorStep?: number | null;
  onStep?: (index: number) => void;
  className?: string;
}

export interface EmptyStateRichProps {
  variant?: EmptyStateVariant;
  title?: string;
  body?: string;
  description?: string;
  primary?: ReactNode;
  secondary?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "success" | "warning";
  className?: string;
}

export interface ChNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  href?: string;
}

export interface ChNavGroup {
  label: string;
  items: ChNavItem[];
}

export interface ChSidebarProps {
  persona?: PersonaType;
  active?: string | null;
  activePath?: string;
  onNavigate?: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  institutionName?: string;
  logoUrl?: string | null;
  /** Real signed-in user for the sidebar footer. Falls back to "Usuario" when absent. */
  user?: { name: string; role?: string; initials: string };
  /** Real nav counts keyed by nav id (e.g. { bandeja: 12 }). Badge is hidden when absent — never hardcoded. */
  navBadges?: Record<string, string | number>;
  className?: string;
}

export interface ChBottomNavProps {
  persona?: PersonaType;
  active?: string | null;
  activePath?: string;
  onNavigate?: (id: string) => void;
  className?: string;
}

export interface ChNotification {
  id?: string;
  title: string;
  body?: string;
  read?: boolean;
  at?: string;
  category?: string;
  application_id?: string;
}

export interface ChTenantOption {
  id: string;
  name: string;
}

export interface ChTopbarProps {
  persona?: PersonaType;
  trail?: string[];
  breadcrumbs?: Array<{ label: string; href?: string }>;
  tenantName?: string;
  multiTenant?: boolean;
  notif?: number;
  /** When false, notification bell is not rendered (404 / feature off). */
  showNotificationsBell?: boolean;
  user?: { name: string; initials: string };
  /** Real account email shown in the avatar menu. Hidden when absent. */
  userEmail?: string;
  /** Real notifications; when empty the bell shows an explicit empty state (no demo rows). */
  notifications?: ChNotification[];
  /** Message notifications for dealer - applications with unread messages */
  messageNotifications?: Array<{ applicationId: string; applicantName: string; unread: number }>;
  /** Callback when clicking on a message notification */
  onMessageNotificationClick?: (applicationId: string) => void;
  /** Real list of tenants the user can switch to; when absent the tenant is a static label (no demo entries). */
  tenants?: ChTenantOption[];
  onSelectTenant?: (tenantId: string) => void;
  onOpenSearch?: () => void;
  onSearchClick?: () => void;
  compact?: boolean;
  userInitials?: string;
  className?: string;
}

export interface ChAppShellProps {
  persona?: PersonaType;
  tenantName?: string;
  trail?: string[];
  mode?: "desktop" | "mobile";
  multiTenant?: boolean;
  frame?: boolean;
  /** Real signed-in user forwarded to the default topbar. Falls back to "Usuario" when absent. */
  user?: { name: string; initials: string };
  /** Real account email forwarded to the default topbar avatar menu. */
  userEmail?: string;
  children: ReactNode;
  topbar?: ReactNode;
  sidebar?: ReactNode;
  bottomNav?: ReactNode;
  className?: string;
}

export interface ChShellContextValue {
  persona: PersonaType;
  trail: string[];
  openPalette: () => void;
  paletteOpen: boolean;
}
