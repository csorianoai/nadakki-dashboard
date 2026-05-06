"use client";

import { useEffect, useRef, useCallback } from "react";
import { deleteLock, postLock } from "@/lib/legal/cases/legal-cases-api";
import type { LockScope } from "@/lib/legal/cases/case-types";

export function useCaseLock(
  tenantId: string | undefined,
  caseId: string | undefined,
  options: { auto_acquire?: boolean; scope?: LockScope; reason?: string } = {}
) {
  const lockIdRef = useRef<string | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  const acquire = useCallback(async () => {
    if (!tenantId?.trim() || !caseId?.trim()) return;
    const body = {
      lock_reason: optsRef.current.reason ?? "edición de expediente",
      lock_scope: optsRef.current.scope ?? "soft",
      duration_minutes: 5,
    };
    const r = await postLock(tenantId, caseId, body);
    if (r?.lock_id) lockIdRef.current = r.lock_id;
  }, [tenantId, caseId]);

  const release = useCallback(async () => {
    if (!tenantId?.trim() || !caseId?.trim()) return;
    await deleteLock(tenantId, caseId);
    lockIdRef.current = null;
  }, [tenantId, caseId]);

  useEffect(() => {
    if (!options.auto_acquire || !tenantId?.trim() || !caseId?.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        await acquire();
      } catch {
        if (!cancelled) lockIdRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
      void release();
    };
  }, [options.auto_acquire, tenantId, caseId, acquire, release]);

  useEffect(() => {
    if (!options.auto_acquire || !tenantId?.trim() || !caseId?.trim()) return;
    const id = setInterval(() => {
      void acquire();
    }, 30_000);
    return () => clearInterval(id);
  }, [options.auto_acquire, tenantId, caseId, acquire]);

  return { lockId: lockIdRef.current, acquire, release };
}
