"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/forge";
import { approveFactura, rejectFactura } from "@/app/hooks/useProyectos";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { Factura } from "@/types/finanzas";

export function FacturaApprovalActions({
  factura,
  onUpdated,
  compact,
}: {
  factura: Factura;
  onUpdated: () => void;
  compact?: boolean;
}) {
  const tenantId = useForgeProjectsTenantId();
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  const canAct =
    factura.validation_status === "needs_pm_review" || factura.validation_status === "received";

  const confirm = async (justification: string) => {
    if (!tenantId || !mode) return;
    setLoading(true);
    try {
      if (mode === "approve") {
        await approveFactura(tenantId, factura.id, { justification });
        toast.success("Factura aprobada");
      } else {
        await rejectFactura(tenantId, factura.id, {
          justification,
          reason_codes: factura.validation_reason_codes.length
            ? factura.validation_reason_codes
            : ["REJECTED_BY_PM"],
        });
        toast.success("Factura rechazada");
      }
      setMode(null);
      onUpdated();
    } catch (e) {
      toast.error("Error", { description: e instanceof Error ? e.message : "" });
    } finally {
      setLoading(false);
    }
  };

  if (!canAct) return null;

  return (
    <>
      {!compact ? (
        <>
          <Button type="button" onClick={() => setMode("approve")}>
            Aprobar
          </Button>
          <Button type="button" variant="danger" onClick={() => setMode("reject")}>
            Rechazar
          </Button>
        </>
      ) : null}
      <JustificationModal
        open={mode !== null}
        title={mode === "approve" ? "Aprobar factura" : "Rechazar factura"}
        confirmLabel={mode === "approve" ? "Aprobar" : "Rechazar"}
        variant={mode === "reject" ? "danger" : "primary"}
        loading={loading}
        onClose={() => setMode(null)}
        onConfirm={confirm}
      />
    </>
  );
}
