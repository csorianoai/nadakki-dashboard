"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/forge/ui/Toast";
import { governanceApi } from "@/lib/api/governance";

const POLLING_INTERVAL_MS = 3000;
const TIMEOUT_MS = 120_000;

export function useRunGovernance() {
  const queryClient = useQueryClient();
  const [progressSeconds, setProgressSeconds] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (pollingRef.current) clearInterval(pollingRef.current);
    progressTimerRef.current = null;
    pollingRef.current = null;
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      setProgressSeconds(0);
      const response = await governanceApi.runCheck();
      const auditId = response.audit_id;
      const startTime = Date.now();

      progressTimerRef.current = setInterval(() => {
        setProgressSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return new Promise<string>((resolve, reject) => {
        pollingRef.current = setInterval(async () => {
          const elapsed = Date.now() - startTime;
          if (elapsed > TIMEOUT_MS) {
            clearTimers();
            reject(new Error("NGC tardó más de 120 segundos"));
            return;
          }

          try {
            const report = await governanceApi.getReportById(auditId);
            if (report.overall_status !== "RUNNING") {
              clearTimers();
              resolve(auditId);
            }
          } catch {
            /* reporte aún no listo */
          }
        }, POLLING_INTERVAL_MS);
      });
    },
    onSuccess: () => {
      toast.success("Governance check completado");
      void queryClient.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (error: Error) => {
      clearTimers();
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    run: () => mutation.mutate(),
    isRunning: mutation.isPending,
    progressSeconds,
    error: mutation.error,
  };
}
