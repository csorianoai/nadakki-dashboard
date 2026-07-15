"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "@/lib/motion-stub";
import { useVehicleSearch } from "@/lib/autos-portal/hooks";
import VehicleCard from "@/components/autos/VehicleCard";
import SearchFiltersPanel from "@/components/autos/SearchFiltersPanel";
import type { VehicleSearchFilters } from "@/types/autos";

export default function MarketplacePage() {
  const [filters, setFilters] = useState<VehicleSearchFilters>({
    page: 1,
    page_size: 20,
  });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, refetch } = useVehicleSearch(filters);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, query: searchInput || undefined, page: 1 }));
  }

  return (
    <div className="ndk-page ndk-fade-in p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Marketplace</h1>
        <p className="text-gray-400">
          Explora vehículos disponibles en la red de concesionarios
        </p>
      </motion.div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por marca, modelo, tipo..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Filters */}
      <SearchFiltersPanel
        filters={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Results */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/5 border border-white/10 animate-pulse"
            >
              <div className="aspect-[16/10] bg-gray-800 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-700 rounded w-3/4" />
                <div className="h-6 bg-gray-700 rounded w-1/2" />
                <div className="h-4 bg-gray-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Error al cargar vehículos</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {data.total} vehículo{data.total !== 1 ? "s" : ""} encontrado
              {data.total !== 1 ? "s" : ""}
            </p>
          </div>

          {data.vehicles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">
                No se encontraron vehículos con estos filtros
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.total > (filters.page_size ?? 20) && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={data.page <= 1}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page ?? 1) - 1,
                  }))
                }
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 disabled:opacity-30 hover:border-white/20 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-sm text-gray-400">
                Página {data.page} de{" "}
                {Math.ceil(data.total / (filters.page_size ?? 20))}
              </span>
              <button
                disabled={!data.has_next}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: (prev.page ?? 1) + 1,
                  }))
                }
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 disabled:opacity-30 hover:border-white/20 transition-all"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
