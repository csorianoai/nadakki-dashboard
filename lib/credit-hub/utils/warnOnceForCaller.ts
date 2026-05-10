/**
 * Set of already-warned call-site fingerprints. Module-level so the
 * deduplication survives across renders within a single page load. Cleared
 * implicitly on full page reload (acceptable for a deprecation hint).
 */
const warnedCallSites = new Set<string>();

/**
 * Inspects the current stack trace and returns a stable fingerprint for
 * the line that invoked `warnOnceForCaller` (the call site one frame up
 * from this helper). Returns `"unknown-caller"` when the stack trace is
 * unavailable (older runtimes, exotic environments).
 *
 * The fingerprint is `<message>::<file:line:col>` so two different call
 * sites with the same message dedupe independently.
 */
function getCallerFingerprint(message: string): string {
  const err = new Error();
  const stack = err.stack;
  if (typeof stack !== "string") return `${message}::unknown-caller`;

  const lines = stack.split("\n");
  // Stack layout (V8 / SpiderMonkey both put the message first):
  //   "Error"
  //   "    at getCallerFingerprint (...)"
  //   "    at warnOnceForCaller (...)"
  //   "    at <real caller> (...)"
  // Index 3 is the real caller; fall back to the deepest available frame.
  const callerLine = lines[3] ?? lines[lines.length - 1] ?? "unknown-caller";
  return `${message}::${callerLine.trim()}`;
}

/**
 * Emits `console.warn(message)` at most once per unique call site.
 *
 * - Silent in production (`process.env.NODE_ENV === 'production'`).
 * - Dedup key is the (message, caller stack frame) tuple, so the same
 *   message logged from two different files warns twice but the same
 *   message logged from the same line warns once even across many renders.
 *
 * Intended use: surfacing soft deprecations (e.g. `useTenantConfig` →
 * `useTenantBranding`) to developers without spamming the console.
 *
 * @param message - human-readable deprecation hint
 *
 * @example
 *   warnOnceForCaller("useTenantConfig is deprecated; migrate to useTenantBranding");
 */
export function warnOnceForCaller(message: string): void {
  if (process.env.NODE_ENV === "production") return;

  const fingerprint = getCallerFingerprint(message);
  if (warnedCallSites.has(fingerprint)) return;

  warnedCallSites.add(fingerprint);
  // eslint-disable-next-line no-console -- dev-only deprecation hint, gated above
  console.warn(message);
}

/**
 * Test-only helper to clear the dedup set between cases. Exported behind
 * a verbose name to discourage accidental runtime use.
 */
export function __resetWarnOnceForCallerForTests(): void {
  warnedCallSites.clear();
}
