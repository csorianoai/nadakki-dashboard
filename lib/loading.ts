/** Search loading pulse — README §9 */

export const SEARCH_LOADING_MS = 700;

export function runLoading(setLoading: (value: boolean) => void): () => void {
  setLoading(true);
  const timer = window.setTimeout(() => setLoading(false), SEARCH_LOADING_MS);
  return () => window.clearTimeout(timer);
}
