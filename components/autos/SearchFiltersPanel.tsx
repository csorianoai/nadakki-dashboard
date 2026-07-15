"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import type { VehicleSearchFilters } from "@/types/autos";

interface SearchFiltersPanelProps {
  filters: VehicleSearchFilters;
  onChange: (filters: VehicleSearchFilters) => void;
  className?: string;
}

const PROVINCES = [
  "Santo Domingo",
  "Distrito Nacional",
  "Santiago",
  "La Vega",
  "San Cristóbal",
  "Puerto Plata",
  "San Pedro de Macorís",
  "La Romana",
  "Duarte",
  "La Altagracia",
];

const BODY_TYPES = [
  "sedan",
  "suv",
  "pickup",
  "hatchback",
  "coupe",
  "minivan",
  "convertible",
];

const FUEL_TYPES = ["gasolina", "diesel", "hibrido", "electrico", "glp"];
const TRANSMISSIONS = ["automatica", "manual"];
const CONDITIONS = ["new", "used"];

export default function SearchFiltersPanel({
  filters,
  onChange,
  className,
}: SearchFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  function update(patch: Partial<VehicleSearchFilters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  function clearAll() {
    onChange({ page: 1, page_size: filters.page_size ?? 20 });
  }

  const hasActiveFilters =
    filters.make ||
    filters.condition ||
    filters.body_type ||
    filters.fuel_type ||
    filters.transmission ||
    filters.province ||
    filters.year_min ||
    filters.year_max ||
    filters.price_min ||
    filters.price_max;

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-white/20 transition-all"
      >
        <Filter className="w-4 h-4" />
        Filtros
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-blue-400" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <SelectFilter
              label="Condición"
              value={filters.condition}
              options={CONDITIONS}
              labels={{ new: "Nuevo", used: "Usado" }}
              onChange={(v) => update({ condition: v || undefined })}
            />
            <SelectFilter
              label="Carrocería"
              value={filters.body_type}
              options={BODY_TYPES}
              onChange={(v) => update({ body_type: v || undefined })}
            />
            <SelectFilter
              label="Combustible"
              value={filters.fuel_type}
              options={FUEL_TYPES}
              onChange={(v) => update({ fuel_type: v || undefined })}
            />
            <SelectFilter
              label="Transmisión"
              value={filters.transmission}
              options={TRANSMISSIONS}
              labels={{ automatica: "Automática", manual: "Manual" }}
              onChange={(v) => update({ transmission: v || undefined })}
            />
            <SelectFilter
              label="Provincia"
              value={filters.province}
              options={PROVINCES}
              onChange={(v) => update({ province: v || undefined })}
            />

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Año desde
              </label>
              <input
                type="number"
                value={filters.year_min ?? ""}
                onChange={(e) =>
                  update({
                    year_min: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="2015"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Año hasta
              </label>
              <input
                type="number"
                value={filters.year_max ?? ""}
                onChange={(e) =>
                  update({
                    year_max: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="2026"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Precio mín (RD$)
              </label>
              <input
                type="number"
                value={filters.price_min ?? ""}
                onChange={(e) =>
                  update({
                    price_min: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="200,000"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Precio máx (RD$)
              </label>
              <input
                type="number"
                value={filters.price_max ?? ""}
                onChange={(e) =>
                  update({
                    price_max: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="3,000,000"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal select helper
// ---------------------------------------------------------------------------

function SelectFilter({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:border-blue-500/50 focus:outline-none appearance-none"
      >
        <option value="">Todos</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels?.[opt] ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}
