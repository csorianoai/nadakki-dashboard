"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FEATURE_VEHICLE_CHAT_BACKEND } from "@/lib/autos-agent/feature-flags";
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
  // Sin chat real no se ofrece: antes respondia con un mock.
  if (!FEATURE_VEHICLE_CHAT_BACKEND) return null;
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
