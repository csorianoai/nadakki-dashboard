"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLeadCapture } from "@/lib/autos-portal/hooks/useLeadCapture";
import { useFinancingBridge } from "@/lib/autos-portal/hooks/useFinancingBridge";
import { getVehicleImaginUrl } from "@/lib/vehicle-images";
import type { Vehicle } from "@/lib/vehicles";

export function FinancingLeadButton({
  vehicle,
  vehicleRefId,
  downPayment,
  termMonths,
  className,
}: {
  vehicle: Vehicle;
  vehicleRefId: string;
  downPayment: number;
  termMonths: number;
  className?: string;
}) {
  const { captureLead } = useLeadCapture();
  const { requestFinancing } = useFinancingBridge();
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const returnUrl = `/autos/vehiculo/${encodeURIComponent(vehicleRefId)}?financing_return=1`;
      const financingResponse = await requestFinancing(
        vehicleRefId,
        termMonths,
        downPayment,
        returnUrl,
        vehicle.price,
      );

      await captureLead(
        vehicleRefId,
        {
          name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          price: vehicle.price,
          image: getVehicleImaginUrl(vehicle),
        },
        {
          requested_amount: financingResponse.requestedAmount,
          down_payment: downPayment,
          term_months: termMonths,
        },
        financingResponse.applicationId,
      );

      toast.success("Solicitud de financiamiento creada");
      window.location.href = financingResponse.creditHubUrl;
    } catch {
      toast.error("Error al crear solicitud de financiamiento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="brand"
      className={className}
      data-testid="financing-apply-button"
      disabled={submitting}
      onClick={() => void handleApply()}
    >
      {submitting ? "Procesando…" : "Aplicar financiamiento"}
    </Button>
  );
}
