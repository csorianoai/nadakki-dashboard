import type { CreditApplication, CreditEvent, CreditStats } from "./creditCore";

export interface DealerDashboardViewProps {
  applications: CreditApplication[];
  stats?: CreditStats;
  institutionName: string;
  userName?: string;
  locale: string;
  currency: string;
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
