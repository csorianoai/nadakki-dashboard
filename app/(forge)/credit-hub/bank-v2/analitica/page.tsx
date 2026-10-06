"use client";

import { AnaliticaV2 } from "@/components/credit-hub/bank-v2/analitica/AnaliticaV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** Analitica del banco (bank-v2). */
export default function AnaliticaV2Page() {
  return <AnaliticaV2 marca={useMarcaBanco()} />;
}
