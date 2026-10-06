"use client";

import { CumplimientoV2 } from "@/components/credit-hub/bank-v2/control/CumplimientoV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Cumplimiento del banco (bank-v2). */
export default function CumplimientoV2Page() {
  return <CumplimientoV2 marca={useMarcaBanco()} hrefSolicitud={(id) => `/credit-hub/bank-v2/solicitudes/${encodeURIComponent(id)}`} />;
}
