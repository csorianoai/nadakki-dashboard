"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConsentApi } from "./useConsentApi";

export type ConsentStatus =
  | "INITIATED"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "FAILED"
  | "NOT_FOUND"
  | (string & {});

const TERMINAL = new Set(["ACCEPTED", "EXPIRED", "REJECTED", "FAILED"]);

export function useConsentStatusPolling(token: string | null, intervalMs = 10_000) {
  const api = useConsentApi();
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [haltedByErrors, setHaltedByErrors] = useState(false);
  const [pollEpoch, setPollEpoch] = useState(0);
  const lastErrorMsgRef = useRef("");
  const sameErrorCountRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const refetch = useCallback(() => {
    setHaltedByErrors(false);
    lastErrorMsgRef.current = "";
    sameErrorCountRef.current = 0;
    setPollEpoch((e) => e + 1);
  }, []);

  useEffect(() => {
    lastErrorMsgRef.current = "";
    sameErrorCountRef.current = 0;
    setHaltedByErrors(false);

    if (!token || !api) {
      setStatus(null);
      setAcceptedAt(null);
      setError(null);
      return;
    }

    let mounted = true;

    const clearTimer = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      intervalRef.current = window.setInterval(() => {
        void tick();
      }, intervalMs);
    };

    const tick = async () => {
      if (!mounted || !api || !token) return;
      try {
        const data = await api.getStatus(token);
        if (!mounted) return;
        setStatus(data.status as ConsentStatus);
        setAcceptedAt(data.accepted_at);
        setError(null);
        lastErrorMsgRef.current = "";
        sameErrorCountRef.current = 0;

        if (TERMINAL.has(String(data.status))) {
          clearTimer();
        }
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setError(msg);
        if (msg === lastErrorMsgRef.current) {
          sameErrorCountRef.current += 1;
        } else {
          lastErrorMsgRef.current = msg;
          sameErrorCountRef.current = 1;
        }
        if (sameErrorCountRef.current >= 2) {
          setHaltedByErrors(true);
          clearTimer();
        }
      }
    };

    void tick();
    scheduleNext();

    return () => {
      mounted = false;
      clearTimer();
    };
  }, [api, intervalMs, pollEpoch, token]);

  return { status, acceptedAt, error, haltedByErrors, refetch };
}
