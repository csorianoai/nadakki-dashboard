"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  postInviteTenantUsers,
  postOnboardingActivate,
  postOnboardingDraft,
  postTenantBankCredentialSecrets,
  postUploadTenantLogo,
} from "@/lib/admin/onboarding-api";
import type { TenantOnboardingState } from "@/types/onboarding";

export const ONBOARDING_STORAGE_KEY = "nadakki_tenant_onboarding_draft_v1";
export const ONBOARDING_AUTOSAVE_MS = 30_000;

export const EMPTY_ONBOARDING_STATE: TenantOnboardingState = {
  provisionalTenantId: null,
  step1: {
    slug: "",
    displayName: "",
    country: "DO",
    industry: "financial_services",
    contactEmail: "",
  },
  step2: {
    logoFileName: null,
    logoDataUrl: null,
    primaryColor: "#8b5cf6",
    secondaryColor: "#06b6d4",
    customDomain: "",
  },
  step3: {
    cores: [
      { core: "marketing", tier: "starter" },
      { core: "credit", tier: "pro" },
    ],
  },
  step4: {
    admin: { email: "", fullName: "", role: "tenant_admin" },
    additionalUsers: [],
  },
  step5: {
    bankCredentials: [
      { bankId: "popular", bankName: "Banco Popular (sintético)", clientId: "", clientSecret: "" },
      { bankId: "bhd", bankName: "Banco BHD (sintético)", clientId: "", clientSecret: "" },
    ],
  },
};

export function isTenantOnboardingFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_TENANT_ONBOARDING === "true";
}

export function hasCreditCoreSelected(state: TenantOnboardingState): boolean {
  return state.step3.cores.some((c) => c.core === "credit");
}

export function getNextStep(current: number, hasCredit: boolean): number {
  if (current === 4) return hasCredit ? 5 : 6;
  if (current >= 6) return 6;
  return current + 1;
}

export function getPrevStep(current: number, hasCredit: boolean): number {
  if (current === 6) return hasCredit ? 5 : 4;
  if (current <= 1) return 1;
  return current - 1;
}

function parseStored(raw: string | null): Partial<TenantOnboardingState> | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as unknown;
    return j && typeof j === "object" ? (j as Partial<TenantOnboardingState>) : null;
  } catch {
    return null;
  }
}

function mergeState(base: TenantOnboardingState, partial: Partial<TenantOnboardingState> | null): TenantOnboardingState {
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    step1: { ...base.step1, ...partial.step1 },
    step2: { ...base.step2, ...partial.step2 },
    step3: { ...base.step3, ...partial.step3, cores: partial.step3?.cores ?? base.step3.cores },
    step4: {
      ...base.step4,
      ...partial.step4,
      admin: { ...base.step4.admin, ...partial.step4?.admin },
      additionalUsers: partial.step4?.additionalUsers ?? base.step4.additionalUsers,
    },
    step5: {
      ...base.step5,
      ...partial.step5,
      bankCredentials: partial.step5?.bankCredentials ?? base.step5.bankCredentials,
    },
  };
}

export function validateOnboardingStep(step: number, s: TenantOnboardingState): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 1) {
    if (!s.step1.slug.trim()) e.slug = "Requerido";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.step1.slug)) {
      e.slug = "Solo minúsculas, números y guiones";
    }
    if (!s.step1.displayName.trim()) e.displayName = "Requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.step1.contactEmail.trim())) e.contactEmail = "Email inválido";
  }
  if (step === 2) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(s.step2.primaryColor)) e.primaryColor = "Color inválido";
    if (!/^#[0-9A-Fa-f]{6}$/.test(s.step2.secondaryColor)) e.secondaryColor = "Color inválido";
    if (s.step2.customDomain.trim()) {
      const d = s.step2.customDomain.trim();
      if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) e.customDomain = "Dominio inválido";
    }
  }
  if (step === 3) {
    if (!s.step3.cores.length) e.cores = "Selecciona al menos un core";
  }
  if (step === 4) {
    if (!s.step4.admin.fullName.trim()) e.adminName = "Nombre del admin requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.step4.admin.email.trim())) e.adminEmail = "Email admin inválido";
    s.step4.additionalUsers.forEach((u, i) => {
      if (!u.fullName.trim()) e[`user_${i}_name`] = "Nombre requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email.trim())) e[`user_${i}_email`] = "Email inválido";
    });
  }
  if (step === 5 && hasCreditCoreSelected(s)) {
    s.step5.bankCredentials.forEach((row, i) => {
      if (!row.clientId.trim()) e[`bank_${i}_id`] = "Client ID requerido";
      if (!row.clientSecret.trim()) e[`bank_${i}_secret`] = "Secret requerido";
    });
  }
  return e;
}

export function estimateMonthlyUsd(state: TenantOnboardingState): number {
  const tier: Record<string, number> = { starter: 79, pro: 249, enterprise: 699 };
  return state.step3.cores.reduce((acc, c) => acc + (tier[c.tier] ?? 99), 0);
}

export interface TenantOnboardingContextValue {
  state: TenantOnboardingState;
  setState: React.Dispatch<React.SetStateAction<TenantOnboardingState>>;
  replaceState: (patch: Partial<TenantOnboardingState>) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saving: boolean;
  activating: boolean;
  lastSavedAt: number | null;
  lastError: string | null;
  logoFileRef: React.MutableRefObject<File | null>;
  persistLocal: () => void;
  pushDraft: () => Promise<string | null>;
  goNext: (fromStep: number) => Promise<void>;
  goBack: (fromStep: number) => void;
  runActivation: () => Promise<void>;
}

const TenantOnboardingContext = createContext<TenantOnboardingContextValue | null>(null);

export function TenantOnboardingRuntimeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<TenantOnboardingState>(() => EMPTY_ONBOARDING_STATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const logoFileRef = useRef<File | null>(null);
  const hydrated = useRef(false);

  const replaceState = useCallback((patch: Partial<TenantOnboardingState>) => {
    setState((prev) => mergeState(prev, patch));
  }, []);

  const persistLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const parsed = parseStored(raw);
    if (parsed) {
      setState(mergeState(EMPTY_ONBOARDING_STATE, parsed));
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    persistLocal();
  }, [state, persistLocal]);

  const pushDraft = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    setLastError(null);
    try {
      const r = await postOnboardingDraft(state);
      if (!r.ok) {
        setLastError(r.error ?? "draft error");
        return null;
      }
      const tid = r.data?.tenant_id ?? null;
      if (tid) {
        setState((s) => (s.provisionalTenantId === tid ? s : { ...s, provisionalTenantId: tid }));
      }
      setLastSavedAt(Date.now());
      return tid ?? state.provisionalTenantId;
    } finally {
      setSaving(false);
    }
  }, [state]);

  const pushDraftRef = useRef(pushDraft);
  pushDraftRef.current = pushDraft;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => {
      void pushDraftRef.current();
    }, ONBOARDING_AUTOSAVE_MS);
    return () => window.clearInterval(id);
  }, []);

  const hasCredit = useMemo(() => hasCreditCoreSelected(state), [state]);

  const goBack = useCallback(
    (fromStep: number) => {
      const prev = getPrevStep(fromStep, hasCredit);
      router.push(`/tenant-onboarding/${prev}`);
    },
    [hasCredit, router],
  );

  const goNext = useCallback(
    async (fromStep: number) => {
      const err = validateOnboardingStep(fromStep, state);
      setFieldErrors(err);
      if (Object.keys(err).length) {
        toast.error("Revisa los campos marcados antes de continuar.");
        return;
      }

      const draftTid = await pushDraft();
      const resolvedTid = draftTid ?? state.provisionalTenantId;

      if (fromStep === 2 && logoFileRef.current) {
        if (!resolvedTid) {
          toast.error("No hay tenant provisional todavía; reintenta en unos segundos.");
          return;
        }
        const up = await postUploadTenantLogo(resolvedTid, logoFileRef.current);
        if (!up.ok) {
          toast.error(up.error ?? "No se pudo subir el logo");
          return;
        }
        logoFileRef.current = null;
      }

      if (fromStep === 5 && hasCredit) {
        const tid = draftTid ?? state.provisionalTenantId;
        if (!tid) {
          toast.error("Falta tenant provisional — espera el autoguardado o vuelve al paso anterior.");
          return;
        }
        const cred = await postTenantBankCredentialSecrets(tid, {
          banks: state.step5.bankCredentials.map((b) => ({
            bank_id: b.bankId,
            bank_name: b.bankName,
            client_id: b.clientId,
            client_secret: b.clientSecret,
          })),
        });
        if (!cred.ok) {
          toast.error(cred.error ?? "Credenciales bancarias rechazadas");
          return;
        }
      }

      const n = getNextStep(fromStep, hasCredit);
      router.push(`/tenant-onboarding/${n}`);
    },
    [hasCredit, pushDraft, router, state],
  );

  const runActivation = useCallback(async () => {
    setActivating(true);
    setLastError(null);
    try {
      const body = {
        ...state,
        estimated_monthly_usd: estimateMonthlyUsd(state),
      };
      const act = await postOnboardingActivate(body);
      if (!act.ok) {
        const msg = act.error ?? "Activate failed";
        setLastError(msg);
        toast.error(msg);
        return;
      }
      const tid = act.data?.tenant_id ?? state.provisionalTenantId;
      if (tid) {
        const invitePayload = {
          users: [state.step4.admin, ...state.step4.additionalUsers],
        };
        const inv = await postInviteTenantUsers(tid, invitePayload);
        if (!inv.ok) {
          toast.message("Tenant activado; invitaciones pendientes de reintento.", { description: inv.error });
        } else {
          toast.success("Tenant activado");
        }
      }
      const until = act.data?.provisional_access_until;
      toast.message("Acceso provisional (24h)", {
        description: until
          ? `Vence: ${until}`
          : "Revisa el correo de confirmación y la consola de administración.",
      });
      router.push("/admin");
    } finally {
      setActivating(false);
    }
  }, [router, state]);

  const value = useMemo<TenantOnboardingContextValue>(
    () => ({
      state,
      setState,
      replaceState,
      fieldErrors,
      setFieldErrors,
      saving,
      activating,
      lastSavedAt,
      lastError,
      logoFileRef,
      persistLocal,
      pushDraft,
      goNext,
      goBack,
      runActivation,
    }),
    [
      activating,
      fieldErrors,
      goBack,
      goNext,
      lastError,
      lastSavedAt,
      persistLocal,
      pushDraft,
      replaceState,
      runActivation,
      saving,
      state,
    ],
  );

  return <TenantOnboardingContext.Provider value={value}>{children}</TenantOnboardingContext.Provider>;
}

export function useTenantOnboarding(): TenantOnboardingContextValue {
  const ctx = useContext(TenantOnboardingContext);
  if (!ctx) {
    throw new Error("useTenantOnboarding must be used within TenantOnboardingRuntimeProvider");
  }
  return ctx;
}
