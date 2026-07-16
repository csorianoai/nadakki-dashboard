import { Suspense } from "react";
import { AutosVehiculosContent } from "./AutosVehiculosContent";
import { VehicleCardSkeleton } from "@/components/vehicle/VehicleCardSkeleton";

export default function AutosVehiculosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1440px] px-[22px] py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
          </div>
        </div>
      }
    >
      <AutosVehiculosContent />
    </Suspense>
  );
}
