"use client";

import { AuditoriaV2 } from "@/components/credit-hub/bank-v2/control/AuditoriaV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Auditoría del banco (bank-v2). */
export default function AuditoriaV2Page() {
  return <AuditoriaV2 marca={useMarcaBanco()} hrefSolicitud={(id) => `/credit-hub/bank-v2/solicitudes/${encodeURIComponent(id)}`} />;
}
