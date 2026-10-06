"use client";

import { FiltrosPoolV2 } from "@/components/credit-hub/bank-v2/config/FiltrosPoolV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Filtros de pool del banco (bank-v2). */
export default function FiltrosPoolV2Page() {
  return <FiltrosPoolV2 marca={useMarcaBanco()} />;
}
