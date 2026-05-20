"use client";

import { useState, useCallback } from "react";
import { submitFeedback as submitFeedbackApi } from "@/lib/feedback/feedback-api";

const NPS_LAST_SHOWN_KEY = "nadakki_nps_last_shown";
export const NPS_COOLDOWN_DAYS = 30;

export function useFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = useCallback(async (rating: number, comment?: string, context?: string, isAnonymous?: boolean) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitFeedbackApi({
        rating,
        comment,
        context,
        is_anonymous: isAnonymous,
      });
      setSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Envío no disponible temporalmente";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const shouldShowNPS = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    const lastShown = localStorage.getItem(NPS_LAST_SHOWN_KEY);
    if (!lastShown) return true;
    const ts = parseInt(lastShown, 10);
    if (!Number.isFinite(ts)) return true;
    const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return Number.isFinite(daysSince) && daysSince >= NPS_COOLDOWN_DAYS;
  }, []);

  const markNPSShown = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(NPS_LAST_SHOWN_KEY, Date.now().toString());
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSubmitted(false);
    setSubmitError(null);
  }, []);

  return {
    isOpen,
    isSubmitting,
    submitted,
    submitError,
    open,
    close,
    submit,
    shouldShowNPS,
    markNPSShown,
  };
}
