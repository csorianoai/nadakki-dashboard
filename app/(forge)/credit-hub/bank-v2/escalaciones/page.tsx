"use client";

import { EscalacionesV2 } from "@/components/credit-hub/bank-v2/control/EscalacionesV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Escalaciones KYC / OCR del banco (bank-v2). */
export default function EscalacionesV2Page() {
  return <EscalacionesV2 marca={useMarcaBanco()} hrefSolicitud={(id) => `/credit-hub/bank-v2/solicitudes/${encodeURIComponent(id)}`} />;
}
