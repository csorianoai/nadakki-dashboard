import { fmtKm, fmtRD, fmtUS } from "@/lib/format";
import type { Vehicle } from "@/lib/vehicles";

export function VehicleHeader({ vehicle }: { vehicle: Vehicle }) {
  return (
    <header className="space-y-2">
      <h1 className="font-manrope text-[clamp(24px,3.4vw,32px)] font-extrabold leading-tight text-nk-fg">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h1>
      <p className="text-[13px] text-nk-fg-muted">
        {vehicle.loc} · {fmtKm(vehicle.km)} · {vehicle.trans}
      </p>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-manrope text-[26px] font-extrabold tabular-nums text-nk-fg">
          {fmtRD(vehicle.price)}
        </span>
        <span className="text-sm text-nk-fg-subtle">{fmtUS(vehicle.price)}</span>
      </div>
    </header>
  );
}
