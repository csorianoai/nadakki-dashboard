/** Credit Hub Package 0 — shared primitive & shell types. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type PersonaType = "bank" | "dealer";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type DecisionState = "idle" | "loading" | "success" | "error" | "conflict";

export interface ScoreVisualProps {
  score: number;
  min?: number;
  max?: number;
  size?: number;
  thickness?: number;
  label?: boolean;
}

export interface RiskBandProps {
  level: RiskLevel;
  label?: string;
  className?: string;
}

export interface DecisionPanelProps {
  state: DecisionState;
  title?: string;
  description?: string;
  conflictMessage?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  loadingLabel?: string;
  className?: string;
}

export interface EvidenceItem {
  id: string;
  title: string;
  body: string;
  sourceLabel?: string;
  confidence?: "high" | "medium" | "low";
}

export interface EvidenceGridProps {
  items: EvidenceItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}

export interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onApply: () => void;
  applyLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export interface StepperWizardStep {
  id: string;
  label: string;
  href?: string;
}

export interface StepperWizardProps {
  steps: StepperWizardStep[];
  currentIndex: number;
  className?: string;
}

export interface EmptyStateRichProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "success" | "warning";
  className?: string;
}

export interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export interface ChNavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface ChAppShellProps {
  persona: PersonaType;
  tenantName?: string;
  children: ReactNode;
  topbar?: ReactNode;
  sidebar?: ReactNode;
  bottomNav?: ReactNode;
  className?: string;
}

export interface ChSidebarProps {
  persona: PersonaType;
  activePath?: string;
  institutionName?: string;
  logoUrl?: string | null;
  className?: string;
}

export interface ChTopbarProps {
  persona: PersonaType;
  tenantName: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onSearchClick?: () => void;
  userInitials?: string;
  className?: string;
}
