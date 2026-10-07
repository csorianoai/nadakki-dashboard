"use client";

import { CumplimientoV2 } from "@/components/credit-hub/bank-v2/control/CumplimientoV2";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { useMarcaBanco } from "../BancoV2Shell";

/** Cumplimiento del banco (bank-v2). El perfil regulatorio sale del mismo branding que ya pidio el shell. */
export default function CumplimientoV2Page() {
  const branding = useTenantBranding();
  return (
    <CumplimientoV2
      marca={useMarcaBanco()}
      perfilRegulatorio={branding.data?.regulatory_profile ?? null}
      hrefSolicitud={(id) => `/credit-hub/bank-v2/solicitudes/${encodeURIComponent(id)}`}
    />
  );
}
