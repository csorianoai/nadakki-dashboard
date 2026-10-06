"use client";

import { DccCard } from "@/components/dcc/DccCard";
import { DccGrid, DccPageMarco } from "@/components/dcc/DccPageMarco";
import { useMarcaBanco } from "./BancoV2Shell";

/** Esqueleto de la Mesa de decisiones. Su contenido llega en B3. */
export default function MesaDecisionesV2Page() {
  const marca = useMarcaBanco();
  return (
    <DccPageMarco titulo="Mesa de decisiones" marca={marca}>
      <DccGrid>
        <DccCard titulo="Cola de decisión" calidad={{ estado: "no_disponible", motivo: "Pantalla en construcción (serie B, B3)" }} />
      </DccGrid>
    </DccPageMarco>
  );
}
