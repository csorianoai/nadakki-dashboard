"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Gauge,
  Fuel,
  Calendar,
  Shield,
  Calculator,
} from "lucide-react";
import { motion } from "@/lib/motion-stub";
import { useVehicleDetail } from "@/lib/autos-portal/hooks";

function formatPrice(price: number | null | undefined): string {
  if (!price) return "Consultar";
  return `RD$ ${price.toLocaleString("es-DO")}`;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const { data: vehicle, isLoading, isError } = useVehicleDetail(vehicleId);

  if (isLoading) {
    return (
      <div className="ndk-page p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-48 mb-6" />
        <div className="aspect-[16/9] bg-gray-800 rounded-2xl mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-700 rounded w-3/4" />
          <div className="h-8 bg-gray-700 rounded w-1/3" />
          <div className="h-20 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="ndk-page p-6 text-center py-20">
        <p className="text-red-400 text-lg mb-4">Vehículo no encontrado</p>
        <Link
          href="/autos/marketplace"
          className="text-blue-400 hover:underline"
        >
          Volver al marketplace
        </Link>
      </div>
    );
  }

  const specs = [
    { label: "Año", value: vehicle.year, icon: Calendar },
    { label: "Kilometraje", value: vehicle.mileage_km ? `${vehicle.mileage_km.toLocaleString("es-DO")} km` : null, icon: Gauge },
    { label: "Combustible", value: vehicle.fuel_type, icon: Fuel },
    { label: "Transmisión", value: vehicle.transmission, icon: Shield },
    { label: "Carrocería", value: vehicle.body_type, icon: Shield },
    { label: "Tracción", value: vehicle.drivetrain, icon: Shield },
    { label: "Color exterior", value: vehicle.exterior_color, icon: Shield },
    { label: "Color interior", value: vehicle.interior_color, icon: Shield },
    { label: "Provincia", value: vehicle.province, icon: MapPin },
  ].filter((s) => s.value != null);

  return (
    <div className="ndk-page ndk-fade-in p-6 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/autos/marketplace"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al marketplace
      </Link>

      {/* Hero photo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="aspect-[16/9] bg-gray-800 rounded-2xl overflow-hidden mb-6"
      >
        {vehicle.cover_photo_url ? (
          <img
            src={vehicle.cover_photo_url}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <span className="text-6xl">🚗</span>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ""}
              </h1>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {vehicle.condition === "new" ? "Nuevo" : "Usado"}
              </span>
            </div>

            <p className="text-3xl font-bold text-blue-400 mb-6">
              {formatPrice(vehicle.price_rd)}
            </p>

            {vehicle.vin && (
              <p className="text-sm text-gray-500 mb-4">VIN: {vehicle.vin}</p>
            )}

            {/* Specs grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {specs.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div
                    key={spec.label}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {spec.label}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {spec.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">
                  Descripción
                </h3>
                <p className="text-sm text-gray-300 whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar actions */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-6 space-y-4"
          >
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white mb-4">
                Interesado?
              </h3>
              <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors mb-3">
                Contactar vendedor
              </button>
              <Link
                href={`/autos/finance?price=${vehicle.price_rd ?? 0}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:border-white/20 transition-all"
              >
                <Calculator className="w-4 h-4" />
                Calcular financiamiento
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
