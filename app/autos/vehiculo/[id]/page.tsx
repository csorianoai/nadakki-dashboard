"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getVehicleById } from "@/lib/vehicles";
import { fmtRD, fmtUS } from "@/lib/format";
import { cuota } from "@/lib/finance";

/** Phase 2 stub — full VDP lands in Fase 4. */
export default function AutosVehiculoDetailPage() {
  const params = useParams();
  const vehicle = getVehicleById(String(params?.id ?? ""));

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-[720px] px-[22px] py-16 text-center">
        <h1 className="font-manrope text-2xl font-extrabold">Vehículo no encontrado</h1>
        <Link href="/autos/vehiculos" className="mt-4 inline-block text-brand underline">
          Volver a resultados
        </Link>
      </div>
    );
  }

  const monthly = Math.round(cuota(vehicle.price, 20, 60));

  return (
    <div className="mx-auto max-w-[1440px] px-[22px] py-8">
      <Link href="/autos/vehiculos" className="text-sm text-nk-fg-muted hover:text-brand">
        ← Volver a resultados
      </Link>
      <h1 className="mt-3 font-manrope text-[clamp(24px,3.4vw,32px)] font-extrabold">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>
      <p className="mt-2 font-manrope text-[26px] font-extrabold tabular-nums">
        {fmtRD(vehicle.price)}{" "}
        <span className="text-[11px] font-medium text-nk-fg-subtle">{fmtUS(vehicle.price)}</span>
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-brand">
        {fmtRD(monthly)} a 60 meses · 13.5% anual
      </p>
      <div className="mt-6 aspect-[16/10] max-w-3xl rounded-r" style={{ background: vehicle.grad }} />
    </div>
  );
}
