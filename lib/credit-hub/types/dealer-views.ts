import type { CreditApplication, CreditEvent, CreditStats } from "./creditCore";

export interface DealerDashboardViewProps {
  applications: CreditApplication[];
  stats?: CreditStats;
  institutionName: string;
  userName?: string;
  locale: string;
  /**
   * Moneda del tenant, ISO 4217. `null` cuando el branding no la trae: sin
   * moneda no se pinta importe (#517), en vez de caer a una por defecto.
   */
  currency: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export interface DealerApplicationsListViewProps {
  applications: CreditApplication[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export interface DealerApplicationDetailViewProps {
  applicationId: string;
}

export type DealerNotificationTab = "all" | "unread" | "decisions" | "system";

export interface DealerNotificationItem {
  id: string;
  applicationId: string;
  title: string;
  body: string;
  category: "decision" | "system" | "update";
  createdAt: string;
  read: boolean;
}

export interface DealerNotificationsViewProps {
  items: DealerNotificationItem[];
  isLoading?: boolean;
  /** True when GET /api/v2/credit/notifications is not available — no synthetic fallback. */
  sourceUnavailable?: boolean;
  /** When set, marks read via API instead of local-only state. */
  onMarkRead?: (id: string) => void | Promise<void>;
}

export interface DealerProfileViewProps {
  email?: string;
  institutionName: string;
  roleLabel?: string;
  locale: string;
}

export interface DealerWizardStepProps {
  onNext?: () => void;
  onPrev?: () => void;
}

export interface DealerPreApprovalViewProps {
  locale: string;
  currency: string;
}

export type { CreditEvent };
