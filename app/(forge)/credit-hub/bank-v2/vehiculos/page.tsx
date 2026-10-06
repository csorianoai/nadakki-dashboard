"use client";

import { VehiculosV2 } from "@/components/credit-hub/bank-v2/control/VehiculosV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Historial de vehiculos del banco (bank-v2). */
export default function VehiculosV2Page() {
  return <VehiculosV2 marca={useMarcaBanco()} />;
}
