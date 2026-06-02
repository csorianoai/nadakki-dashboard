"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/forge/ui/Toast";
import { governanceApi } from "@/lib/api/governance";

const POLLING_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

async function waitForGovernanceRun(auditId: string, signal: AbortSignal): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    try {
      const report = await governanceApi.getReportById(auditId, signal);
      if (report.overall_status !== "RUNNING") {
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (err instanceof Error && err.name === "AbortError") throw err;
      /* reporte aún no listo o error transitorio — seguir polling */
    }

    await sleep(POLLING_INTERVAL_MS, signal);
  }

  throw new Error("NGC tardó más de 120 segundos");
}

export function useRunGovernance() {
  const queryClient = useQueryClient();
  const [progressSeconds, setProgressSeconds] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearRun = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => () => clearRun(), [clearRun]);

  const mutation = useMutation({
    mutationFn: async () => {
      clearRun();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      setProgressSeconds(0);
      const response = await governanceApi.runCheck(signal);
      const auditId = response.audit_id;
      const startTime = Date.now();

      progressTimerRef.current = setInterval(() => {
        setProgressSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      try {
        await waitForGovernanceRun(auditId, signal);
        return auditId;
      } finally {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
      }
    },
    onSuccess: () => {
      toast.success("Governance check completado");
      void queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (error: Error) => {
      if (error.name === "AbortError") return;
      toast.error(`Error: ${error.message}`);
    },
    onSettled: () => {
      clearRun();
    },
  });

  return {
    run: () => mutation.mutate(),
    isRunning: mutation.isPending,
    progressSeconds,
    error: mutation.error,
  };
}
