"use client";

import { useCallback, useState } from "react";
import {
  pollLiveRun,
  redirectLiveRun,
  stopLiveRun,
  type NautaLivePollResponse,
} from "@/lib/nauta/liveRunClient";
import { logNautaViewError } from "@/lib/nauta/safeValues";

export function useNautaLiveRunControl() {
  const [busy, setBusy] = useState(false);

  const stop = useCallback(async (runId: string): Promise<NautaLivePollResponse> => {
    setBusy(true);
    try {
      return await stopLiveRun(runId);
    } catch (error) {
      logNautaViewError("midrun-stop", error, { runId, field: "stopLiveRun" });
      throw error;
    } finally {
      setBusy(false);
    }
  }, []);

  const redirect = useCallback(
    async (runId: string, instruction: string): Promise<NautaLivePollResponse> => {
      setBusy(true);
      try {
        return await redirectLiveRun(runId, instruction);
      } catch (error) {
        logNautaViewError("midrun-redirect", error, { runId, field: "redirectLiveRun" });
        throw error;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const refresh = useCallback(async (runId: string): Promise<NautaLivePollResponse> => {
    try {
      return await pollLiveRun(runId);
    } catch (error) {
      logNautaViewError("midrun-refresh", error, { runId, field: "pollLiveRun" });
      throw error;
    }
  }, []);

  return { busy, stop, redirect, refresh };
}
