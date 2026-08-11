import type { UseQueryResult } from "@tanstack/react-query";

type PanelQuery = Pick<
  UseQueryResult<unknown>,
  "isFetched" | "isError" | "isFetching" | "fetchStatus"
>;

/** True only while the first fetch for an enabled query is in flight. */
export function isChPanelLoading(query: PanelQuery, enabled: boolean): boolean {
  if (!enabled) return false;
  if (query.isError) return false;
  if (query.isFetched) return false;
  return query.isFetching || query.fetchStatus === "fetching";
}
