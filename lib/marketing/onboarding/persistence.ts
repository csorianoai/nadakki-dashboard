import { tokenStorage } from "@/lib/auth/token-storage";
import {
  MARKETING_ONBOARDING_FLOW_ID,
  MARKETING_ONBOARDING_STORAGE_VERSION,
  MARKETING_ONBOARDING_STEP_ORDER,
  type MarketingOnboardingPersisted,
  type MarketingOnboardingStepId,
} from "./types";

const storageKey = (tenantKey: string) =>
  `nadakki:${MARKETING_ONBOARDING_FLOW_ID}:${MARKETING_ONBOARDING_STORAGE_VERSION}:${tenantKey}`;

function defaultState(): MarketingOnboardingPersisted {
  const now = new Date().toISOString();
  return {
    version: MARKETING_ONBOARDING_STORAGE_VERSION,
    currentStepIndex: 0,
    completedStepIds: [],
    goalKeys: [],
    notifyEmail: true,
    notifyInApp: true,
    notifySlack: false,
    updatedAt: now,
  };
}

export function loadMarketingOnboardingState(tenantId: string | null | undefined): MarketingOnboardingPersisted {
  if (typeof window === "undefined") return defaultState();
  const key = tenantId?.trim() ? storageKey(tenantId.trim()) : storageKey("anon");
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<MarketingOnboardingPersisted>;
    if (parsed.version !== MARKETING_ONBOARDING_STORAGE_VERSION) return defaultState();
    const merged = { ...defaultState(), ...parsed };
    merged.completedStepIds = Array.isArray(parsed.completedStepIds)
      ? (parsed.completedStepIds.filter((id): id is MarketingOnboardingStepId =>
          MARKETING_ONBOARDING_STEP_ORDER.includes(id as MarketingOnboardingStepId)
        ) as MarketingOnboardingStepId[])
      : [];
    merged.currentStepIndex = Math.min(
      Math.max(0, Number(parsed.currentStepIndex) || 0),
      MARKETING_ONBOARDING_STEP_ORDER.length - 1
    );
    return merged;
  } catch {
    return defaultState();
  }
}

export function saveMarketingOnboardingState(
  tenantId: string | null | undefined,
  state: MarketingOnboardingPersisted
): void {
  if (typeof window === "undefined") return;
  const key = tenantId?.trim() ? storageKey(tenantId.trim()) : storageKey("anon");
  const next = { ...state, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(key, JSON.stringify(next));
}

export function firstIncompleteStepIndex(completed: MarketingOnboardingStepId[]): number {
  const idx = MARKETING_ONBOARDING_STEP_ORDER.findIndex((id) => !completed.includes(id));
  return idx === -1 ? MARKETING_ONBOARDING_STEP_ORDER.length - 1 : idx;
}

export function percentComplete(completed: MarketingOnboardingStepId[]): number {
  const n = completed.length;
  const total = MARKETING_ONBOARDING_STEP_ORDER.length;
  return Math.round((n / total) * 100);
}

/**
 * Best-effort sync to Nadakki AI Suite via same-origin BFF.
 * Intended path once backend exposes `tenant_onboarding_status` / marketing-core slice.
 * Failures are swallowed — localStorage remains the source of truth in the portal.
 */
export async function syncMarketingOnboardingToBackend(
  tenantId: string,
  state: MarketingOnboardingPersisted
): Promise<void> {
  const token = tokenStorage.getAccessToken();
  if (!tenantId.trim() || !token) return;

  const payload = {
    flow_id: MARKETING_ONBOARDING_FLOW_ID,
    completed_steps: state.completedStepIds,
    current_step_index: state.currentStepIndex,
    percent_complete: percentComplete(state.completedStepIds),
    goal_keys: state.goalKeys ?? [],
    notification_prefs: {
      email: state.notifyEmail ?? false,
      slack: state.notifySlack ?? false,
      in_app: state.notifyInApp ?? false,
    },
    updated_at: state.updatedAt,
  };

  try {
    await fetch(`/api/v1/tenants/${encodeURIComponent(tenantId.trim())}/onboarding/marketing-core`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Tenant-ID": tenantId.trim(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    /* ignore — backend route may not exist yet */
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleMarketingOnboardingBackendSync(tenantId: string | null | undefined, state: MarketingOnboardingPersisted) {
  if (!tenantId?.trim()) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncMarketingOnboardingToBackend(tenantId.trim(), state);
  }, 600);
}
