"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mic, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { filterVehicles } from "@/lib/search-filters";
import { buildSearchHref } from "@/lib/search-url";
import { BRAND_OPTIONS, PROVINCE_OPTIONS, type FilterState } from "@/lib/search-types";
import { MODELS_BY_BRAND, VEHICLES_SEED } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "jeepeta hasta 1.5M",
  "Honda CR-V bajo 1.5M",
  "algo pa Uber",
  "carrito automático pa mi mamá",
  "yipeta pa la playa",
  "tengo 300 mil de inicial",
] as const;

const CHIPS = [
  { label: "Yipeta familiar", q: "yipeta familiar" },
  { label: "Automático", q: "automático" },
  { label: "Bajo 1.5M", q: "1.5M" },
  { label: "Ideal Uber", q: "uber" },
  { label: "SUV Santiago", q: "suv santiago" },
  { label: "Premium", q: "premium" },
] as const;

const INVENTORY_TOTAL = 1247;

function estimateInventoryCount(partial: Pick<FilterState, "brands" | "provinces" | "query">): number {
  const filtered = filterVehicles(VEHICLES_SEED, {
    brands: partial.brands,
    provinces: partial.provinces,
    query: partial.query,
    types: [],
    years: [],
    fuels: [],
    trans: [],
    condicion: [],
    vendedor: [],
    feats: [],
    aiSignals: [],
    maxMonthly: 30_000,
    initial: 300_000,
    usePayment: false,
    sort: "relevance",
    view: "grid",
  });

  const hasFilters =
    partial.brands.length > 0 || partial.provinces.length > 0 || partial.query.trim().length > 0;

  if (!hasFilters) return INVENTORY_TOTAL;
  if (filtered.length === 0) return 0;
  return Math.max(filtered.length, Math.round(INVENTORY_TOTAL * (filtered.length / VEHICLES_SEED.length)));
}

export function DualSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [brand, setBrand] = useState<string>("all");
  const [model, setModel] = useState<string>("all");
  const [province, setProvince] = useState<string>("all");

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setModel("all");
  }, [brand]);

  const models = brand !== "all" ? (MODELS_BY_BRAND[brand] ?? []) : [];

  const traditionalCount = useMemo(
    () =>
      estimateInventoryCount({
        brands: brand !== "all" ? [brand] : [],
        provinces: province !== "all" ? [province] : [],
        query: model !== "all" ? model : "",
      }),
    [brand, model, province],
  );

  const aiSearch = (q: string) => {
    const trimmed = q.trim();
    router.push(
      trimmed
        ? buildSearchHref({ ...defaultPartial(), query: trimmed })
        : "/autos/vehiculos",
    );
  };

  const traditionalSearch = () => {
    const brands = brand !== "all" ? [brand] : [];
    const provinces = province !== "all" ? [province] : [];
    const href = buildSearchHref({
      ...defaultPartial(),
      brands,
      provinces,
      query: model !== "all" ? model : "",
    });
    router.push(href);
  };

  return (
    <div className="mt-8 max-w-[820px]">
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="mb-3 h-auto w-full flex-wrap justify-start gap-1 p-1 sm:w-auto">
          <TabsTrigger value="ai" className="gap-1.5 px-4">
            <Sparkles className="h-4 w-4" aria-hidden />
            Búsqueda con AI
          </TabsTrigger>
          <TabsTrigger value="traditional" className="gap-1.5 px-4">
            <Search className="h-4 w-4" aria-hidden />
            Búsqueda tradicional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <div className="rounded-r border border-nk-border bg-nk-surface p-2 shadow-nk-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aiSearch(query)}
                placeholder={`Ej: "${PLACEHOLDERS[placeholderIdx]}"…`}
                className="h-12 flex-1 border-0 bg-transparent text-base shadow-none focus-visible:shadow-none"
                aria-label="Búsqueda con AI"
              />
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 min-h-11 min-w-11"
                  aria-label="Búsqueda por voz"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  className="h-11 min-h-11 gap-2 px-5"
                  onClick={() => aiSearch(query)}
                >
                  <Sparkles className="h-4 w-4" />
                  Buscar con AI
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => aiSearch(chip.q)}
                className={cn(
                  "rounded-full border border-nk-border bg-nk-surface px-3 py-1.5 text-xs font-medium text-nk-fg-muted transition",
                  "hover:border-brand hover:bg-brand hover:text-[var(--on-brand)]",
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="traditional">
          <div className="rounded-r border border-nk-border bg-nk-surface p-4 shadow-nk-lg">
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="h-11" aria-label="Marca">
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {BRAND_OPTIONS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={model} onValueChange={setModel} disabled={brand === "all"}>
                <SelectTrigger className="h-11" aria-label="Modelo">
                  <SelectValue placeholder="Todos los modelos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los modelos</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger className="h-11" aria-label="Provincia">
                  <SelectValue placeholder="Provincia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las provincias</SelectItem>
                  {PROVINCE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={traditionalSearch}
              className={cn(
                "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-brand to-brand-2 px-8 py-5",
                "text-[22px] font-semibold text-[var(--on-brand)] shadow-nk-md transition",
                "hover:brightness-105 hover:shadow-nk-lg sm:w-auto",
              )}
            >
              {traditionalCount.toLocaleString("en-US")} vehículos
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function defaultPartial(): FilterState {
  return {
    query: "",
    brands: [],
    types: [],
    provinces: [],
    years: [],
    fuels: [],
    trans: [],
    condicion: [],
    vendedor: [],
    feats: [],
    aiSignals: [],
    maxMonthly: 30_000,
    initial: 300_000,
    usePayment: false,
    sort: "relevance",
    view: "grid",
  };
}
