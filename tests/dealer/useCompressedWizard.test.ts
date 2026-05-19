/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import {
  decodeVinHeuristic,
  useCompressedWizard,
} from "@/hooks/useCompressedWizard";

describe("decodeVinHeuristic", () => {
  test("returns null for invalid length", () => {
    expect(decodeVinHeuristic("SHORT")).toBeNull();
  });

  test("returns null when I O Q present", () => {
    expect(decodeVinHeuristic("1HIGBH41JXMN109186")).toBeNull();
  });

  test("returns year for plausible VIN", () => {
    const r = decodeVinHeuristic("1HGBH41JXMN109186");
    expect(r?.year).toBeDefined();
  });
});

describe("useCompressedWizard", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("decodeVIN async returns year field", async () => {
    const { result } = renderHook(() =>
      useCompressedWizard({ tenantId: "t1", enableOfflineMode: true, trackTiming: true }),
    );
    await act(async () => {
      const r = await result.current.decodeVIN("1HGBH41JXMN109186");
      expect(r.year).toBeDefined();
    });
  });

  test("autocompleteAddress returns matches for Santo", async () => {
    const { result } = renderHook(() => useCompressedWizard({ tenantId: "t1" }));
    let suggestions: string[] = [];
    await act(async () => {
      suggestions = await result.current.autocompleteAddress("Santo");
    });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toMatch(/Santo/i);
  });

  test("saveDraft and loadDraft roundtrip", () => {
    const { result } = renderHook(() =>
      useCompressedWizard({ tenantId: "t1", enableOfflineMode: true }),
    );
    act(() => {
      result.current.saveDraft({ x: 1 });
    });
    expect(result.current.loadDraft()).toEqual({ x: 1 });
  });

  test("trackStepTime records telemetry events", () => {
    const { result } = renderHook(() =>
      useCompressedWizard({ tenantId: "t1", trackTiming: true }),
    );
    act(() => {
      result.current.trackStepTime(0, 1200);
    });
    const raw = sessionStorage.getItem("nadakki:cw-telemetry:t1");
    expect(raw).toBeTruthy();
    const arr = JSON.parse(raw ?? "[]") as { step: number }[];
    expect(arr[0]?.step).toBe(0);
  });

  test("syncDrafts resolves", async () => {
    const { result } = renderHook(() => useCompressedWizard({ tenantId: "t1" }));
    let r: { synced: number } = { synced: -1 };
    await act(async () => {
      r = await result.current.syncDrafts();
    });
    expect(r.synced).toBe(0);
  });
});
