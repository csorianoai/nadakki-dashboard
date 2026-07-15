"use client";

import { useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { motion } from "@/lib/motion-stub";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useVehicleSearch, useCreateVehicle } from "@/lib/autos-portal/hooks";
import VehicleCard from "@/components/autos/VehicleCard";
import type { VehicleSearchFilters, VehicleCreatePayload } from "@/types/autos";

export default function InventoryPage() {
  const { tenantId } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [filters] = useState<VehicleSearchFilters>({
    page: 1,
    page_size: 50,
  });

  const { data, isLoading, isError, refetch } = useVehicleSearch({
    ...filters,
    query: searchQuery || undefined,
  });

  // TODO: dealerId should come from user context
  const dealerId = "current-dealer";
  const createMutation = useCreateVehicle(tenantId ?? "", dealerId);

  const [newVehicle, setNewVehicle] = useState<VehicleCreatePayload>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    condition: "used",
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(newVehicle);
      setShowNewForm(false);
      setNewVehicle({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        condition: "used",
      });
    } catch {
      // error is handled by mutation state
    }
  }

  return (
    <div className="ndk-page ndk-fade-in p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20 border border-green-500/30">
              <Package className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Inventario</h1>
              <p className="text-gray-400">
                Gestiona los vehículos de tu concesionario
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo vehículo
          </button>
        </div>
      </motion.div>

      {/* New vehicle form */}
      {showNewForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Agregar vehículo
          </h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Marca *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.make}
                  onChange={(e) =>
                    setNewVehicle((v) => ({ ...v, make: e.target.value }))
                  }
                  placeholder="Toyota"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={newVehicle.model}
                  onChange={(e) =>
                    setNewVehicle((v) => ({ ...v, model: e.target.value }))
                  }
                  placeholder="Corolla"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Año *
                </label>
                <input
                  type="number"
                  required
                  value={newVehicle.year}
                  onChange={(e) =>
                    setNewVehicle((v) => ({
                      ...v,
                      year: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Condición
                </label>
                <select
                  value={newVehicle.condition}
                  onChange={(e) =>
                    setNewVehicle((v) => ({ ...v, condition: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-green-500/50 focus:outline-none text-sm"
                >
                  <option value="used">Usado</option>
                  <option value="new">Nuevo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Precio (RD$)
                </label>
                <input
                  type="number"
                  value={newVehicle.price_rd ?? ""}
                  onChange={(e) =>
                    setNewVehicle((v) => ({
                      ...v,
                      price_rd: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="750,000"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">VIN</label>
                <input
                  type="text"
                  value={newVehicle.vin ?? ""}
                  onChange={(e) =>
                    setNewVehicle((v) => ({
                      ...v,
                      vin: e.target.value || undefined,
                    }))
                  }
                  placeholder="1HGCM82633A004352"
                  maxLength={17}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  value={newVehicle.province ?? ""}
                  onChange={(e) =>
                    setNewVehicle((v) => ({
                      ...v,
                      province: e.target.value || undefined,
                    }))
                  }
                  placeholder="Santo Domingo"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Kilometraje
                </label>
                <input
                  type="number"
                  value={newVehicle.mileage_km ?? ""}
                  onChange={(e) =>
                    setNewVehicle((v) => ({
                      ...v,
                      mileage_km: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="45,000"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-white/20"
              >
                Cancelar
              </button>
              {createMutation.isError && (
                <p className="text-red-400 text-sm self-center">
                  Error al crear vehículo
                </p>
              )}
            </div>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en tu inventario..."
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-green-500/50 focus:outline-none"
        />
      </div>

      {/* Inventory grid */}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Error al cargar inventario</p>
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
          <p className="text-sm text-gray-400 mb-4">
            {data.total} vehículo{data.total !== 1 ? "s" : ""} en inventario
          </p>
          {data.vehicles.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">
                Inventario vacío
              </p>
              <p className="text-gray-500 text-sm">
                Agrega tu primer vehículo para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
