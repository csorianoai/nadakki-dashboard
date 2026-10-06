"use client";

import { MesaDecisiones } from "@/components/credit-hub/bank-v2/mesa/MesaDecisiones";
import { useMarcaBanco } from "./BancoV2Shell";

/** Mesa de decisiones del banco (bank-v2). Cada solicitud abre el expediente v2. */
export default function MesaDecisionesV2Page() {
  const marca = useMarcaBanco();
  return (
    <MesaDecisiones
      marca={marca}
      hrefSolicitud={(id) => `/credit-hub/bank-v2/solicitudes/${encodeURIComponent(id)}`}
      hrefBandeja="/credit-hub/bank-v2/solicitudes"
      hrefAnalitica="/credit-hub/bank/analytics"
    />
  );
}
