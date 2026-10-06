"use client";

import { KpisBancoV2 } from "@/components/credit-hub/bank-v2/kpis/KpisBancoV2";
import { useMarcaBanco } from "../BancoV2Shell";

/** KPIs de banco (bank-v2): resumen, por prestamista y tendencia. */
export default function KpisBancoV2Page() {
  return <KpisBancoV2 marca={useMarcaBanco()} />;
}
