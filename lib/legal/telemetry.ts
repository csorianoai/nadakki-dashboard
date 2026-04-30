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
