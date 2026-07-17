"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ActiveChipsBar } from "@/components/search/ActiveChipsBar";
import { SearchRefineBar } from "@/components/search/SearchRefineBar";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { EmptyState } from "@/components/search/EmptyState";
import { FilterPanel } from "@/components/search/FilterPanel";
import { FiltersBottomSheet } from "@/components/search/FiltersBottomSheet";
import { FiltersFab } from "@/components/search/FiltersFab";
import { ResultsGrid } from "@/components/search/ResultsGrid";
import { ResultsList } from "@/components/search/ResultsList";
import { ResultsMap } from "@/components/search/ResultsMap";
import { AutosErrorBoundary } from "@/components/system/AutosErrorBoundary";
import { searchVehiclesConsumer } from "@/lib/api/vehicles";
import { runLoading } from "@/lib/loading";
import { countActiveFilters, clearAllFilters } from "@/lib/search-filters";
import { buildSearchHref, filterStateFromSearchParams } from "@/lib/search-url";
import type { FilterState } from "@/lib/search-types";
import type { Vehicle } from "@/lib/vehicles";

export function AutosVehiculosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useMemo(() => filterStateFromSearchParams(searchParams), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [results, setResults] = useState<Vehicle[]>([]);
  const [displayCount, setDisplayCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const mounted = useRef(false);

  const fetchResults = useCallback(async (filterState: FilterState) => {
    const res = await searchVehiclesConsumer(filterState);
    setResults(res.vehicles);
    setDisplayCount(res.total);
    setDemoMode(!res.fromBackend);
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      void fetchResults(state).finally(() => runLoading(setLoading));
      return undefined;
    }
    runLoading(setLoading);
    void fetchResults(state);
    return undefined;
  }, [state, fetchResults]);

  const applyState = useCallback(
    (next: FilterState, triggerLoading = true) => {
      router.replace(buildSearchHref(next), { scroll: false });
      if (triggerLoading) runLoading(setLoading);
    },
    [router],
  );

  const activeFilterCount = countActiveFilters(state);

  return (
    <AutosErrorBoundary fallbackTitle="Error al cargar resultados">
      <div className="mx-auto max-w-[1440px] overflow-x-hidden px-[clamp(16px,3vw,22px)] py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/autos" className="text-sm text-nk-fg-muted hover:text-brand">
            ← Volver al inicio
          </Link>
          <DemoModeBadge visible={demoMode} />
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="hidden md:block">
            <FilterPanel state={state} onChange={(next) => applyState(next)} />
          </div>

          <div className="min-w-0 flex-1">
            <SearchRefineBar state={state} onChange={(next) => applyState(next)} />
            <ActiveChipsBar
              state={state}
              count={displayCount}
              onChange={(next) => applyState(next)}
              onViewChange={(view) => applyState({ ...state, view })}
              onSortChange={(sort) => applyState({ ...state, sort })}
              onPageSizeChange={(pageSize) => applyState({ ...state, pageSize })}
            />

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
          onApply={() => runLoading(setLoading)}
        />
      </div>
    </AutosErrorBoundary>
  );
}
