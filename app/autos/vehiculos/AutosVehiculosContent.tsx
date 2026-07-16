"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ActiveChips } from "@/components/search/ActiveChips";
import { EmptyState } from "@/components/search/EmptyState";
import { FilterPanel } from "@/components/search/FilterPanel";
import { FiltersBottomSheet } from "@/components/search/FiltersBottomSheet";
import { FiltersFab } from "@/components/search/FiltersFab";
import { ResultsGrid } from "@/components/search/ResultsGrid";
import { ResultsList } from "@/components/search/ResultsList";
import { ResultsMap } from "@/components/search/ResultsMap";
import { ResultsTopBar } from "@/components/search/ResultsTopBar";
import { runLoading } from "@/lib/loading";
import { parseNaturalQuery } from "@/lib/search-parser";
import {
  clearAllFilters,
  countActiveFilters,
  filterVehicles,
  hasActiveChips,
  sortVehicles,
} from "@/lib/search-filters";
import { buildSearchHref, filterStateFromSearchParams } from "@/lib/search-url";
import type { FilterState } from "@/lib/search-types";
import { VEHICLES_SEED } from "@/lib/vehicles";

export function AutosVehiculosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMemo(() => filterStateFromSearchParams(searchParams), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [refineDraft, setRefineDraft] = useState(state.query);
  const [sheetOpen, setSheetOpen] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    setRefineDraft(state.query);
  }, [state.query]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return runLoading(setLoading);
    }
    return undefined;
  }, []);

  const applyState = useCallback(
    (next: FilterState, triggerLoading = true) => {
      router.replace(buildSearchHref(next), { scroll: false });
      if (triggerLoading) runLoading(setLoading);
    },
    [router],
  );

  const results = useMemo(() => {
    const filtered = filterVehicles(VEHICLES_SEED, state);
    return sortVehicles(filtered, state.sort);
  }, [state]);

  const activeFilterCount = countActiveFilters(state);

  const handleRefineSubmit = () => {
    const parsed = parseNaturalQuery(refineDraft);
    applyState({
      ...state,
      ...parsed,
      query: refineDraft.trim(),
    });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-[22px] py-6 pb-24 md:pb-8">
      <Link href="/autos" className="text-sm text-nk-fg-muted hover:text-brand">
        ← Volver al inicio
      </Link>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <div className="hidden md:block">
          <FilterPanel state={state} onChange={(next) => applyState(next)} />
        </div>

        <div className="min-w-0 flex-[3_1_520px]">
          <ResultsTopBar
            state={state}
            count={results.length}
            refineValue={refineDraft}
            onRefineChange={setRefineDraft}
            onRefineSubmit={handleRefineSubmit}
            onViewChange={(view) => applyState({ ...state, view })}
            onSortChange={(sort) => applyState({ ...state, sort })}
          />

          {hasActiveChips(state) ? (
            <ActiveChips state={state} onChange={(next) => applyState(next)} />
          ) : null}

          {!loading && results.length === 0 ? (
            <EmptyState onClearFilters={() => applyState(clearAllFilters(state))} />
          ) : state.view === "list" ? (
            <ResultsList vehicles={results} loading={loading} />
          ) : state.view === "map" ? (
            <ResultsMap vehicles={results} loading={loading} />
          ) : (
            <ResultsGrid vehicles={results} loading={loading} />
          )}
        </div>
      </div>

      <FiltersFab count={activeFilterCount} onClick={() => setSheetOpen(true)} />

      <FiltersBottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        state={state}
        onChange={(next) => applyState(next, false)}
        resultCount={results.length}
        onApply={() => runLoading(setLoading)}
      />
    </div>
  );
}
