import type { ReactNode } from "react";
import type { Metadata } from "next";
import BlueprintProjectsChrome from "@/components/proyectos/BlueprintProjectsChrome";
import { ProyectosTenantGate } from "@/components/proyectos/ProyectosTenantGate";
import { ContableSubNav } from "@/components/contable/ContableSubNav";
import { ContableTokensPortal } from "@/components/contable/ContableTokensPortal";
import { TOKENS_CONTABLE } from "@/components/contable/tokens-contable";

export const metadata: Metadata = {
  title: "Contable | NADAKKI",
  description: "Contabilidad general — plan de cuentas, asientos, mayor y balance",
};

export default function ContableLayout({ children }: { children: ReactNode }) {
  return (
    <BlueprintProjectsChrome>
      <ProyectosTenantGate>
        <div className="px-4 py-8 md:px-8" style={TOKENS_CONTABLE}>
          <ContableTokensPortal />
          <ContableSubNav />
          {children}
        </div>
      </ProyectosTenantGate>
    </BlueprintProjectsChrome>
  );
}
