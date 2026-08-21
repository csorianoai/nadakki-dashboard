"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VdpBreadcrumb } from "@/components/vdp/Breadcrumb";
import { Gallery } from "@/components/vdp/Gallery";
import { VehicleHeader } from "@/components/vdp/VehicleHeader";
import { AddToCartButton } from "@/components/autos/AddToCartButton";
import { MatchScore } from "@/components/vdp/MatchScore";
import { TrustChips } from "@/components/vdp/TrustChips";
import { SpecTabs } from "@/components/vdp/SpecTabs";
import { PriceEvaluation } from "@/components/vdp/PriceEvaluation";
import { PaymentCalculator } from "@/components/vdp/PaymentCalculator";
import { ContactSeller } from "@/components/vdp/ContactSeller";
import { TradeIn } from "@/components/vdp/TradeIn";
import { StickyHeader, useVdpNavigation } from "@/components/vdp/StickyHeader";
import { SimilarVehicles } from "@/components/vdp/SimilarVehicles";
import { FinancingBridgeStatus } from "@/components/vdp/FinancingBridgeStatus";
import { VehicleChatWidget } from "@/components/vdp/VehicleChatWidget";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { AutosErrorBoundary } from "@/components/system/AutosErrorBoundary";
import { VehicleCardSkeleton } from "@/components/vehicle/VehicleCardSkeleton";
import { getVehicleConsumer } from "@/lib/api/vehicles";
import { MIN_LOADING_MS } from "@/lib/loading";
import type { Vehicle } from "@/lib/vehicles";

export default function AutosVehiculoDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params?.id ?? "");
  const financingReturn = searchParams.get("financing_return") === "1";
  const returnApplicationId = searchParams.get("application_id")?.trim() ?? "";
  const [vehicle, setVehicle] = useState<Vehicle | undefined>();
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [vdpStuck, setVdpStuck] = useState(false);
  const [saved, setSaved] = useState(false);

  const { navIndex, navTotal, goPrev, goNext } = useVdpNavigation(
    vehicle?.id ?? 0,
  );

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    setLoading(true);
    void getVehicleConsumer(id).then((res) => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_LOADING_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) {
          setVehicle(res.vehicle);
          setDemoMode(!res.fromBackend);
          setLoading(false);
        }
      }, wait);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const onScroll = () => setVdpStuck(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] px-[22px] py-8">
        <VehicleCardSkeleton />
      </div>
    );
  }

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

  return (
    <AutosErrorBoundary fallbackTitle="Error al cargar vehículo">
      <StickyHeader
        vehicle={vehicle}
        stuck={vdpStuck}
        saved={saved}
        onSaveToggle={() => setSaved((s) => !s)}
        onPrev={goPrev}
        onNext={goNext}
        navIndex={navIndex}
        navTotal={navTotal}
      />

      <div className="mx-auto max-w-[1440px] px-[22px] py-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <VdpBreadcrumb tipo={vehicle.type} provincia={vehicle.loc} />
          <DemoModeBadge visible={demoMode} />
        </div>

        {financingReturn && returnApplicationId ? (
          <FinancingBridgeStatus applicationId={returnApplicationId} />
        ) : null}

        <div className="mt-5 flex flex-wrap gap-8">
          <div className="min-w-0 flex-[999_1_540px] space-y-6">
            <Gallery vehicle={vehicle} />
            <VehicleHeader vehicle={vehicle} />
            <AddToCartButton vehicle={vehicle} vehicleRefId={id} className="mt-2" />
            <div className="flex flex-wrap items-center gap-4">
              <MatchScore match={vehicle.match} />
              <TrustChips />
            </div>
            <PriceEvaluation vehicle={vehicle} />
            <SpecTabs vehicle={vehicle} />
            <SimilarVehicles vehicle={vehicle} />
          </div>

          <div className="w-full min-w-[280px] flex-[1_1_320px] max-w-[370px] space-y-4">
            <PaymentCalculator
              vehicle={vehicle}
              vehicleRefId={id}
              saved={saved}
              onSaveToggle={() => setSaved((s) => !s)}
            />
            <ContactSeller vehicle={vehicle} />
            <TradeIn />
          </div>
        </div>
      </div>
      <VehicleChatWidget vehicle={vehicle} />
    </AutosErrorBoundary>
  );
}
