"use client";

import { MesaDecisiones } from "@/components/credit-hub/bank-v2/mesa/MesaDecisiones";
import { useMarcaBanco } from "./BancoV2Shell";

/** Mesa de decisiones del banco (bank-v2). El expediente sigue siendo el actual hasta B4. */
export default function MesaDecisionesV2Page() {
  const marca = useMarcaBanco();
  return (
    <MesaDecisiones
      marca={marca}
      hrefSolicitud={(id) => `/credit-hub/bank/applications/${encodeURIComponent(id)}`}
      hrefBandeja="/credit-hub/bank/applications"
      hrefAnalitica="/credit-hub/bank/analytics"
    />
  );
}
