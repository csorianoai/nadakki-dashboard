"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DRAFT_PREFIX = "nadakki:cw-draft";
const TELEMETRY_PREFIX = "nadakki:cw-telemetry";
const MOCK_ADDRESSES = [
  "Santo Domingo, DN, RD",
  "Santiago de los Caballeros, RD",
  "La Vega, RD",
  "Puerto Plata, RD",
  "San Pedro de Macorís, RD",
];

export interface UseCompressedWizardConfig {
  tenantId: string;
  applicationId?: string;
  enableOfflineMode?: boolean;
  trackTiming?: boolean;
}

export interface CompressedWizardTelemetryEvent {
  step: number;
  durationMs: number;
  at: string;
}

/** Model year from VIN pos 10 — UX pre-fill only, not a legal decode. */
export function decodeVinHeuristic(vin: string): { year?: number } | null {
  const v = vin.trim().toUpperCase();
  if (v.length !== 17 || /[IOQ]/.test(v)) return null;
  const code = v[9]!;
  const map = "ABCDEFGHJKLMNPRSTVWXY123456789";
  const idx = map.indexOf(code);
  if (idx < 0) return null;
  let year = idx <= 9 ? 2_000 + idx : idx <= 15 ? 2_000 + idx : 1980 + (idx - 16);
  if (year < 1980 || year > 2039) year = 2_000 + (idx % 20);
  return { year };
}

export function useCompressedWizard(config: UseCompressedWizardConfig) {
  const { tenantId, applicationId, enableOfflineMode = true, trackTiming = true } = config;
  const [smartDefaults, setSmartDefaults] = useState<Record<string, string>>({});
  const [vinBusy, setVinBusy] = useState(false);

  const draftKey = `${DRAFT_PREFIX}:${tenantId || "no-tenant"}:${applicationId ?? "new"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rc = window.localStorage.getItem(`nadakki:cw-returning:${tenantId}`);
    if (rc) {
      try {
        setSmartDefaults(JSON.parse(rc) as Record<string, string>);
      } catch {
        /* ignore */
      }
    }
  }, [tenantId]);

  const decodeVIN = useCallback(async (vin: string) => {
    setVinBusy(true);
    await new Promise((r) => setTimeout(r, 80));
    const local = decodeVinHeuristic(vin);
    setVinBusy(false);
    return {
      year: local?.year,
      make: undefined as string | undefined,
      model: undefined as string | undefined,
    };
  }, []);

  const autocompleteAddress = useCallback(async (query: string) => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as string[];
    return MOCK_ADDRESSES.filter((a) => a.toLowerCase().includes(q)).slice(0, 5);
  }, []);

  const saveDraft = useCallback(
    (data: unknown) => {
      if (!enableOfflineMode || typeof window === "undefined") return;
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({ data, ts: Date.now() }));
      } catch {
        /* quota */
      }
    },
    [draftKey, enableOfflineMode],
  );

  const loadDraft = useCallback((): unknown | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { data?: unknown };
      return parsed.data ?? null;
    } catch {
      return null;
    }
  }, [draftKey]);

  const syncDrafts = useCallback(async () => {
    return { synced: 0 };
  }, []);

  const pushTelemetry = useCallback(
    (step: number, durationMs: number) => {
      if (!trackTiming || typeof window === "undefined") return;
      const key = `${TELEMETRY_PREFIX}:${tenantId || "no-tenant"}`;
      try {
        const prev = JSON.parse(window.sessionStorage.getItem(key) ?? "[]") as CompressedWizardTelemetryEvent[];
        prev.push({ step, durationMs, at: new Date().toISOString() });
        window.sessionStorage.setItem(key, JSON.stringify(prev.slice(-50)));
      } catch {
        /* noop */
      }
    },
    [tenantId, trackTiming],
  );

  return useMemo(
    () => ({
      smartDefaults,
      decodeVIN,
      vinBusy,
      autocompleteAddress,
      saveDraft,
      loadDraft,
      syncDrafts,
      trackStepTime: pushTelemetry,
    }),
    [smartDefaults, decodeVIN, vinBusy, autocompleteAddress, saveDraft, loadDraft, syncDrafts, pushTelemetry],
  );
}

export function useStepTimer(
  stepIndex: number,
  onElapsed: (step: number, ms: number) => void,
  enabled: boolean,
) {
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    return () => {
      if (!enabled) return;
      onElapsed(stepIndex, Date.now() - startRef.current);
    };
  }, [stepIndex, onElapsed, enabled]);
}
