"use client";

import Link from "next/link";
import { MapPin, Gauge, Calendar, Fuel } from "lucide-react";
import type { Vehicle } from "@/types/autos";

interface VehicleCardProps {
  vehicle: Vehicle;
  className?: string;
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return "Consultar";
  return `RD$ ${price.toLocaleString("es-DO")}`;
}

export default function VehicleCard({ vehicle, className }: VehicleCardProps) {
  return (
    <Link href={`/autos/marketplace/${vehicle.id}`}>
      <div
        className={`group rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-xl hover:border-white/20 hover:shadow-lg transition-all overflow-hidden ${className ?? ""}`}
      >
        {/* Cover photo placeholder */}
        <div className="aspect-[16/10] bg-gray-800 relative overflow-hidden">
          {vehicle.cover_photo_url ? (
            <img
              src={vehicle.cover_photo_url}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <span className="text-4xl">🚗</span>
            </div>
          )}
          {vehicle.condition && (
            <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full bg-black/60 text-white backdrop-blur-sm">
              {vehicle.condition === "new" ? "Nuevo" : "Usado"}
            </span>
          )}
          {vehicle.photo_count != null && vehicle.photo_count > 0 && (
            <span className="absolute bottom-3 right-3 px-2 py-1 text-xs rounded-full bg-black/60 text-white backdrop-blur-sm">
              {vehicle.photo_count} fotos
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </h3>

          <p className="text-xl font-bold text-blue-400 mt-1">
            {formatPrice(vehicle.price_rd)}
          </p>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
            {vehicle.mileage_km != null && (
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                {vehicle.mileage_km.toLocaleString("es-DO")} km
              </span>
            )}
            {vehicle.fuel_type && (
              <span className="flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5" />
                {vehicle.fuel_type}
              </span>
            )}
            {vehicle.transmission && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {vehicle.transmission}
              </span>
            )}
            {vehicle.province && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {vehicle.province}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
