"use client";

import type { BankApplicationDetailResponse } from "@/lib/bank-application-detail/types";

export interface VehicleSectionProps {
  vehicle: BankApplicationDetailResponse["vehicle"];
}

export function VehicleSection({ vehicle }: VehicleSectionProps) {
  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="vehicle-section-title"
    >
      <h2 id="vehicle-section-title" className="text-lg font-semibold text-forgeGray-900">
        Vehículo
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Año / Marca / Modelo</dt>
          <dd className="mt-1 text-forge-sm text-forgeGray-900">
            {[vehicle?.year, vehicle?.make, vehicle?.model].filter((x) => x != null && x !== "").join(" · ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">VIN</dt>
          <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-900 break-all">{vehicle?.vin ?? "—"}</dd>
        </div>
        {vehicle?.dealer_location ? (
          <div className="sm:col-span-2">
            <dt className="text-forge-xs font-medium uppercase text-forgeGray-500">Ubicación dealer</dt>
            <dd className="mt-1 text-forge-sm text-forgeGray-800">{vehicle.dealer_location}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
