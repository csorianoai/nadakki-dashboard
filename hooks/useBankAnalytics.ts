"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBankAnalytics,
  resolveBankAnalyticsRoleFromBrowser,
  type BankAnalyticsXRoleHeader,
} from "@/lib/bank/analytics-api";
import type { BankAnalytics, BankAnalyticsPeriod } from "@/types/bank-analytics";

interface UseBankAnalyticsResult {
  data: BankAnalytics | null;
  loading: boolean;
  error: Error | null;
  forbidden: boolean;
  roleHeader: BankAnalyticsXRoleHeader | null;
  refetch: () => void;
}

export function useBankAnalytics(period: BankAnalyticsPeriod = "30d"): UseBankAnalyticsResult {
  const [data, setData] = useState<BankAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [roleHeader, setRoleHeader] = useState<BankAnalyticsXRoleHeader | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const role = resolveBankAnalyticsRoleFromBrowser();
    setRoleHeader(role);
    if (!role) {
      setForbidden(true);
      setLoading(false);
      setData(null);
      setError(null);
      return () => {};
    }

    setForbidden(false);
    let active = true;
    setLoading(true);
    setError(null);
    getBankAnalytics(period)
      .then((result) => {
        if (!active || !mountedRef.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!active || !mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!active || !mountedRef.current) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const refetch = useCallback(() => {
    const role = resolveBankAnalyticsRoleFromBrowser();
    setRoleHeader(role);
    if (!role) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    setForbidden(false);
    setLoading(true);
    setError(null);
    void getBankAnalytics(period)
      .then((result) => {
        if (!mountedRef.current) return;
        setData(result);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!mountedRef.current) return;
        setLoading(false);
      });
  }, [period]);

  return { data, loading, error, forbidden, roleHeader, refetch };
}
