"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Vehicle } from "@/lib/vehicles";

const VehicleChatButton = dynamic(
  () => import("@/components/vdp/VehicleChatButton").then((m) => m.VehicleChatButton),
  { ssr: false },
);

const VehicleChatWindow = dynamic(
  () => import("@/components/vdp/VehicleChatWindow").then((m) => m.VehicleChatWindow),
  { ssr: false },
);

export function VehicleChatWidget({ vehicle }: { vehicle: Vehicle }) {
  const [open, setOpen] = useState(false);
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <>
      {!open ? (
        <VehicleChatButton
          expanded={false}
          onClick={() => setOpen(true)}
          vehicleLabel={label}
        />
      ) : null}
      <VehicleChatWindow vehicle={vehicle} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
