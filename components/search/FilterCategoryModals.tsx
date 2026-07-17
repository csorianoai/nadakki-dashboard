"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterModal, formatFacetCount } from "@/components/search/FilterModal";
import {
  FILTER_CATEGORIES,
  type FilterCategoryId,
} from "@/components/search/filter-categories";
import { clearCategoryFilters } from "@/components/search/filter-category-summary";
import { getFacetsWithCounts } from "@/lib/api/facets";
import { countResults, getFacetCount, type FacetCounts } from "@/lib/search-facet-counts";
import {
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
  CONDICION_OPTIONS,
  DOOR_OPTIONS,
  DRIVETRAIN_OPTIONS,
  ENGINE_OPTIONS,
  EXTERIOR_COLORS,
  FEAT_OPTIONS,
  FUEL_OPTIONS,
  POPULAR_LOCATIONS,
  PRICE_BADGE_OPTIONS,
  PROVINCE_OPTIONS,
  PUBLISHED_OPTIONS,
  SEAT_OPTIONS,
  SELLER_TYPE_OPTIONS,
  TRANS_OPTIONS,
  YEAR_OPTIONS,
  type FilterState,
} from "@/lib/search-types";
import { MODELS_BY_BRAND } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

function toggleInList<T extends string | number>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckboxRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number | null;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-r-sm px-2 py-2 hover:bg-nk-surface-2">
      <span className="flex items-center gap-2 text-sm text-nk-fg">
        <input type="checkbox" checked={checked} onChange={onChange} className="accent-brand" />
        {label}
      </span>
      <span className="text-xs tabular-nums text-nk-fg-subtle">{formatFacetCount(count)}</span>
    </label>
  );
}

function RadioRow({
  label,
  count,
  checked,
  onChange,
  name,
}: {
  label: string;
  count?: number | null;
  checked: boolean;
  onChange: () => void;
  name: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-r-sm px-2 py-2 hover:bg-nk-surface-2">
      <span className="flex items-center gap-2 text-sm text-nk-fg">
        <input type="radio" name={name} checked={checked} onChange={onChange} className="accent-brand" />
        {label}
      </span>
      <span className="text-xs tabular-nums text-nk-fg-subtle">{formatFacetCount(count)}</span>
    </label>
  );
}

const TRIM_OPTIONS = ["Base", "Sport", "Premium", "Limited", "Touring"];

export function FilterCategoryModals({
  openCategory,
  draft,
  onDraftChange,
  onClose,
  onApply,
}: {
  openCategory: FilterCategoryId | null;
  draft: FilterState;
  onDraftChange: (next: FilterState) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const [facets, setFacets] = useState<FacetCounts | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  const resultCount = useMemo(() => countResults(draft), [draft]);

  useEffect(() => {
    if (!openCategory) return;
    let cancelled = false;
    getFacetsWithCounts(draft).then((res) => {
      if (cancelled) return;
      setFacets(res.facets);
      setBackendAvailable(res.fromBackend);
    });
    return () => {
      cancelled = true;
    };
  }, [openCategory, draft]);

  const category = FILTER_CATEGORIES.find((c) => c.id === openCategory);
  if (!category) return null;

  const patch = (partial: Partial<FilterState>) => onDraftChange({ ...draft, ...partial });

  const filteredProvinces = locationQuery.trim()
    ? PROVINCE_OPTIONS.filter((p) =>
        p.toLowerCase().includes(locationQuery.trim().toLowerCase()),
      ).slice(0, 8)
    : [];

  const filteredEquipment = FEAT_OPTIONS.filter((f) =>
    f.toLowerCase().includes(equipmentSearch.trim().toLowerCase()),
  );

  const brandForModel = draft.brands[0] ?? "";
  const models = brandForModel ? (MODELS_BY_BRAND[brandForModel] ?? []) : [];

  const renderBody = () => {
    switch (openCategory) {
      case "location":
        return (
          <div className="space-y-4">
            <Input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Ciudad, provincia"
            />
            {filteredProvinces.length > 0 ? (
              <div className="space-y-1 rounded-r-sm border border-nk-border p-2">
                {filteredProvinces.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="block w-full rounded-r-sm px-2 py-1.5 text-left text-sm hover:bg-nk-surface-2"
                    onClick={() => {
                      patch({ provinces: toggleInList(draft.provinces, p) });
                      setLocationQuery("");
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
            <div>
              <div className="mb-2 flex justify-between text-xs text-nk-fg-muted">
                <span>Radio de búsqueda</span>
                <span className="font-semibold text-brand">{draft.locationRadius} km</span>
              </div>
              <Slider
                min={10}
                max={500}
                step={5}
                value={[draft.locationRadius]}
                onValueChange={([v]) => patch({ locationRadius: v ?? draft.locationRadius })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => patch({ provinces: toggleInList(draft.provinces, loc) })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    draft.provinces.includes(loc)
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-nk-border text-nk-fg-muted hover:bg-nk-surface-2",
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
            {draft.provinces.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draft.provinces.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-xs font-semibold text-brand"
                  >
                    {p}
                    <button type="button" onClick={() => patch({ provinces: draft.provinces.filter((x) => x !== p) })}>
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );

      case "condition":
        return (
          <div className="space-y-1">
            {CONDICION_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                label={opt}
                count={getFacetCount(facets, "condition", opt, draft)}
                checked={draft.condicion.includes(opt)}
                onChange={() => patch({ condicion: toggleInList(draft.condicion, opt) })}
              />
            ))}
          </div>
        );

      case "seller":
        return (
          <div className="space-y-1">
            {SELLER_TYPE_OPTIONS.map((opt) => (
              <RadioRow
                key={opt}
                name="seller"
                label={opt}
                count={getFacetCount(facets, "seller", opt, draft)}
                checked={draft.sellerType === opt}
                onChange={() => patch({ sellerType: opt, vendedor: [] })}
              />
            ))}
          </div>
        );

      case "makeModel":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Marca</label>
              <Select
                value={draft.brands[0] ?? ""}
                onValueChange={(v) => patch({ brands: v ? [v] : [], model: "", trim: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_OPTIONS.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand} ({formatFacetCount(getFacetCount(facets, "brands", brand, draft))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Modelo</label>
              <Select
                key={`model-${brandForModel}`}
                value={draft.model || ""}
                onValueChange={(v) => patch({ model: v === "any" ? "" : v, trim: "" })}
                disabled={!brandForModel}
              >
                <SelectTrigger>
                  <SelectValue placeholder={brandForModel ? "Seleccionar modelo" : "Elige marca primero"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Todos</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Trim</label>
              <Select
                value={draft.trim || ""}
                onValueChange={(v) => patch({ trim: v === "any" ? "" : v })}
                disabled={!draft.model}
              >
                <SelectTrigger>
                  <SelectValue placeholder={draft.model ? "Seleccionar trim" : "Elige modelo primero"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Todos</SelectItem>
                  {TRIM_OPTIONS.map((trim) => (
                    <SelectItem key={trim} value={trim}>
                      {trim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "year":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Desde</label>
              <Select
                value={draft.yearMin ? String(draft.yearMin) : ""}
                onValueChange={(v) => patch({ yearMin: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Hasta</label>
              <Select
                value={draft.yearMax ? String(draft.yearMax) : ""}
                onValueChange={(v) => patch({ yearMax: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "price":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Desde RD$"
                value={draft.minPrice ?? ""}
                onChange={(e) =>
                  patch({ minPrice: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <Input
                type="number"
                placeholder="Hasta RD$"
                value={draft.maxPrice ?? ""}
                onChange={(e) =>
                  patch({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.priceReduced}
                onChange={(e) => patch({ priceReduced: e.target.checked })}
                className="mt-0.5 accent-brand"
              />
              <span>
                Precio reducido
                <span className="mt-1 block text-[11px] text-nk-fg-subtle">
                  ^1 Al menos 2% descuento en últimos 30 días
                </span>
              </span>
            </label>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-nk-fg-subtle">
                Badges de precio
              </p>
              <div className="space-y-1">
                {PRICE_BADGE_OPTIONS.map((badge) => (
                  <CheckboxRow
                    key={badge}
                    label={badge}
                    checked={draft.priceBadges.includes(badge)}
                    onChange={() => patch({ priceBadges: toggleInList(draft.priceBadges, badge) })}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case "bodyType":
        return (
          <div className="grid grid-cols-2 gap-1">
            {BODY_TYPE_OPTIONS.map((type) => (
              <CheckboxRow
                key={type}
                label={type}
                count={getFacetCount(facets, "bodyType", type, draft)}
                checked={draft.types.includes(type)}
                onChange={() => patch({ types: toggleInList(draft.types, type) })}
              />
            ))}
          </div>
        );

      case "color":
        return (
          <div className="grid grid-cols-2 gap-1">
            {EXTERIOR_COLORS.map(({ name, hex }) => (
              <label
                key={name}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-r-sm px-2 py-2 hover:bg-nk-surface-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.colors.includes(name)}
                    onChange={() => patch({ colors: toggleInList(draft.colors, name) })}
                    className="accent-brand"
                  />
                  <span
                    className="inline-block h-5 w-5 rounded-sm border border-nk-border"
                    style={{ background: hex }}
                    aria-hidden
                  />
                  {name}
                </span>
                <span className="text-xs text-nk-fg-subtle">—</span>
              </label>
            ))}
          </div>
        );

      case "mileage":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Desde km"
                value={draft.kmMin ?? ""}
                onChange={(e) =>
                  patch({ kmMin: e.target.value ? Number(e.target.value) : undefined })
                }
              />
              <Input
                type="number"
                placeholder="Hasta km"
                value={draft.kmMax ?? ""}
                onChange={(e) =>
                  patch({ kmMax: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.kmVerifiedOnly}
                onChange={(e) => patch({ kmVerifiedOnly: e.target.checked })}
                className="accent-brand"
              />
              Solo verificados por Nadakki AI
            </label>
          </div>
        );

      case "drivetrain":
        return (
          <div className="space-y-1">
            {DRIVETRAIN_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                label={opt}
                count={getFacetCount(facets, "drivetrain", opt, draft)}
                checked={draft.drivetrain.includes(opt)}
                onChange={() => patch({ drivetrain: toggleInList(draft.drivetrain, opt) })}
              />
            ))}
          </div>
        );

      case "fuel":
        return (
          <div className="space-y-1">
            {FUEL_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                label={opt}
                count={getFacetCount(facets, "fuel", opt, draft)}
                checked={draft.fuels.includes(opt)}
                onChange={() => patch({ fuels: toggleInList(draft.fuels, opt) })}
              />
            ))}
          </div>
        );

      case "engine":
        return (
          <div className="space-y-1">
            {ENGINE_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                label={opt}
                checked={draft.engines.includes(opt)}
                onChange={() => patch({ engines: toggleInList(draft.engines, opt) })}
              />
            ))}
          </div>
        );

      case "transmission":
        return (
          <div className="space-y-1">
            {TRANS_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                label={opt}
                count={getFacetCount(facets, "trans", opt, draft)}
                checked={draft.trans.includes(opt)}
                onChange={() => patch({ trans: toggleInList(draft.trans, opt) })}
              />
            ))}
          </div>
        );

      case "seatsDoors":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Asientos</label>
              <Select
                value={draft.seats ? String(draft.seats) : ""}
                onValueChange={(v) => patch({ seats: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Asientos" />
                </SelectTrigger>
                <SelectContent>
                  {SEAT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n === 8 ? "8+" : n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-nk-fg-subtle">Puertas</label>
              <Select
                value={draft.doors ? String(draft.doors) : ""}
                onValueChange={(v) => patch({ doors: v ? Number(v) : undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Puertas" />
                </SelectTrigger>
                <SelectContent>
                  {DOOR_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "equipment":
        return (
          <div className="space-y-3">
            <Input
              value={equipmentSearch}
              onChange={(e) => setEquipmentSearch(e.target.value)}
              placeholder="Ej: Sunroof, Bluetooth..."
            />
            <div className="max-h-[360px] space-y-1 overflow-y-auto">
              {filteredEquipment.map((feat) => (
                <CheckboxRow
                  key={feat}
                  label={feat}
                  count={getFacetCount(facets, "equipment", feat, draft) ?? (feat === "Aire acondicionado" ? 7845 : undefined)}
                  checked={draft.feats.includes(feat)}
                  onChange={() => patch({ feats: toggleInList(draft.feats, feat) })}
                />
              ))}
            </div>
          </div>
        );

      case "published":
        return (
          <div className="space-y-1">
            {PUBLISHED_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.id}
                name="published"
                label={opt.label}
                checked={draft.publishedSince === opt.id}
                onChange={() => patch({ publishedSince: opt.id })}
              />
            ))}
          </div>
        );

      case "keyword":
        return (
          <div className="space-y-3">
            <Input
              value={draft.keyword}
              onChange={(e) => patch({ keyword: e.target.value })}
              placeholder="Buscar en descripción del vehículo"
            />
            <div className="flex flex-wrap gap-2">
              {["único dueño", "récord de servicio", "un solo dueño"].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => patch({ keyword: example })}
                  className="rounded-full border border-nk-border px-3 py-1 text-xs font-semibold text-nk-fg-muted hover:bg-nk-surface-2"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FilterModal
      title={category.label}
      icon={category.icon}
      isOpen={Boolean(openCategory)}
      onClose={onClose}
      onClear={() => onDraftChange(clearCategoryFilters(draft, openCategory!))}
      onApply={onApply}
      resultCount={resultCount}
      backendAvailable={backendAvailable}
    >
      {renderBody()}
    </FilterModal>
  );
}
