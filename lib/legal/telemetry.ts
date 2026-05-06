export function trackEvent(
  eventName: string,
  payload: Record<string, string | number | boolean | undefined>
): void {
  if (typeof console === "undefined" || !console.log) return;
  console.log(
    "[NADAKKI_LEGAL_TELEMETRY]",
    JSON.stringify({
      event: eventName,
      timestamp: new Date().toISOString(),
      ...payload,
    })
  );
}

export type LegalTaskInvokedPayload = {
  type: "legal.task.invoked";
  tenant_id: string;
  task_id: string;
  user_id: string;
  timestamp: string;
  sync_mode: string;
};

/** Emits legal.task.invoked (console + optional ingest endpoint). */
export function emitLegalTaskInvoked(payload: Omit<LegalTaskInvokedPayload, "type">): void {
  const body: LegalTaskInvokedPayload = {
    type: "legal.task.invoked",
    ...payload,
  };
  trackEvent("legal.task.invoked", {
    tenant_id: payload.tenant_id,
    task_id: payload.task_id,
    user_id: payload.user_id,
    sync_mode: payload.sync_mode,
    timestamp: payload.timestamp,
  });
  if (typeof window === "undefined") return;
  if (typeof fetch === "undefined") return;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  void fetch(`${apiBase}/api/v1/telemetry/legal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}
