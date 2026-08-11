import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";

function mockQuery(partial: {
  isFetched?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  fetchStatus?: "fetching" | "idle" | "paused";
}) {
  return {
    isFetched: partial.isFetched ?? false,
    isError: partial.isError ?? false,
    isFetching: partial.isFetching ?? false,
    fetchStatus: partial.fetchStatus ?? "idle",
  };
}

describe("isChPanelLoading", () => {
  test("disabled query never loads", () => {
    expect(isChPanelLoading(mockQuery({ isFetching: true }), false)).toBe(false);
  });

  test("first fetch in flight", () => {
    expect(
      isChPanelLoading(mockQuery({ isFetching: true, fetchStatus: "fetching" }), true),
    ).toBe(true);
  });

  test("settled success is not loading", () => {
    expect(isChPanelLoading(mockQuery({ isFetched: true }), true)).toBe(false);
  });

  test("settled error is not loading", () => {
    expect(isChPanelLoading(mockQuery({ isError: true }), true)).toBe(false);
  });
});
