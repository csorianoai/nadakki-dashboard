"use client";

import { use } from "react";
import { BarraDecision } from "@/components/credit-hub/bank-v2/expediente/BarraDecision";
import { ExpedienteV2 } from "@/components/credit-hub/bank-v2/expediente/ExpedienteV2";
import { useMarcaBanco } from "../../BancoV2Shell";

/** Expediente del solicitante (bank-v2) con su barra de decision. Lo no portado aun se abre en /herramientas (misma pantalla v1, dentro de bank-v2; la ruta v1 redirige y no sirve de enlace). */
export default function ExpedienteV2Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const marca = useMarcaBanco();
  return (
    <ExpedienteV2
      applicationId={applicationId}
      marca={marca}
      hrefVistaActual={`/credit-hub/bank-v2/solicitudes/${encodeURIComponent(applicationId)}/herramientas`}
      hrefBandeja="/credit-hub/bank-v2/solicitudes"
      decision={(app) => <BarraDecision application={app} />}
    />
  );
}
