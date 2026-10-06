"use client";

import { use } from "react";
import { BarraDecision } from "@/components/credit-hub/bank-v2/expediente/BarraDecision";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { useMarcaBanco } from "../../BancoV2Shell";

/** Expediente del solicitante (bank-v2) con su barra de decision. Lo no portado aun se abre en la vista actual. */
export default function ExpedienteV2Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const marca = useMarcaBanco();
  return (
    <ExpedienteV2
      applicationId={applicationId}
      marca={marca}
      hrefVistaActual={`/credit-hub/bank/applications/${encodeURIComponent(applicationId)}`}
      hrefBandeja="/credit-hub/bank-v2/solicitudes"
      decision={(app) => <BarraDecision application={app} />}
    />
  );
}
