/** Search loading pulse — README §9 */

export const SEARCH_LOADING_MS = 700;
export const MIN_LOADING_MS = 300;

export function runLoading(setLoading: (value: boolean) => void): () => void {
  setLoading(true);
  const started = Date.now();
  const timer = window.setTimeout(() => {
    const elapsed = Date.now() - started;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    window.setTimeout(() => setLoading(false), remaining);
  }, SEARCH_LOADING_MS);
  return () => window.clearTimeout(timer);
}
