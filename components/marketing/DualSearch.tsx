"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { VoiceMicButton } from "@/components/voice/VoiceMicButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterVehicles } from "@/lib/search-filters";
import { buildSearchHref } from "@/lib/search-url";
import { BRAND_OPTIONS, DEFAULT_FILTER_STATE, type FilterState } from "@/lib/search-types";
import { RD_PROVINCES_ORDERED } from "@/lib/rd-geography";
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
    ...DEFAULT_FILTER_STATE,
    brands: partial.brands,
    provinces: partial.provinces,
    query: partial.query,
  });

  const hasFilters =
    partial.brands.length > 0 || partial.provinces.length > 0 || partial.query.trim().length > 0;

  if (!hasFilters) return INVENTORY_TOTAL;
  if (filtered.length === 0) return 0;
  return Math.max(filtered.length, Math.round(INVENTORY_TOTAL * (filtered.length / VEHICLES_SEED.length)));
}

function traditionalButtonLabel(
  brand: string,
  model: string,
  province: string,
  count: number,
): string {
  const formatted = count.toLocaleString("en-US");
  const brandOnly = brand !== "all" && model === "all" && province === "all";
  if (brandOnly) return `${brand}: ${formatted} vehículos`;
  return `${formatted} vehículos`;
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

  const buttonLabel = useMemo(
    () => traditionalButtonLabel(brand, model, province, traditionalCount),
    [brand, model, province, traditionalCount],
  );

  const aiSearch = (q: string) => {
    const trimmed = q.trim();
    router.push(
      trimmed ? buildSearchHref({ ...defaultPartial(), query: trimmed }) : "/autos/vehiculos",
    );
  };

  const traditionalSearch = () => {
    const params = new URLSearchParams();
    if (brand !== "all") params.set("marca", brand);
    if (model !== "all") params.set("modelo", model);
    if (province !== "all") params.set("provincia", province);
    const qs = params.toString();
    router.push(qs ? `/autos/vehiculos?${qs}` : "/autos/vehiculos");
  };

  return (
    <div className="mt-8 max-w-[920px] space-y-6">
      {/* AI Search — always visible */}
      <div>
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
              <VoiceMicButton />
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
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 py-0">
        <hr className="flex-1 border-nk-border" />
        <span className="shrink-0 text-[13px] text-nk-fg-muted">o busca de forma clásica</span>
        <hr className="flex-1 border-nk-border" />
      </div>

      {/* Traditional Search — always visible */}
      <div className="rounded-r border border-nk-border bg-nk-surface p-4 shadow-nk-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
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

            <Select
              key={`model-${brand}`}
              value={model}
              onValueChange={setModel}
              disabled={brand === "all"}
            >
              <SelectTrigger className="h-11" aria-label="Modelo">
                <SelectValue
                  placeholder={
                    brand === "all" ? "Selecciona una marca primero" : "Todos los modelos"
                  }
                />
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
              <SelectContent className="max-h-[min(320px,50vh)]">
                <SelectItem value="all">Todas las provincias</SelectItem>
                {RD_PROVINCES_ORDERED.map((p) => (
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
              "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-brand to-brand-2 px-8 py-5",
              "text-[22px] font-semibold text-[var(--on-brand)] shadow-nk-md transition",
              "hover:brightness-105 hover:shadow-nk-lg lg:w-auto",
            )}
          >
            {buttonLabel}
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultPartial(): FilterState {
  return { ...DEFAULT_FILTER_STATE };
}
