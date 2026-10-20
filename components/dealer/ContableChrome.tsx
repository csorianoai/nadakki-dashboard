"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import OnboardingAgent from "@/components/ai/OnboardingAgent";
import { DealerShell } from "@/components/dealer-management/shell/DealerShell";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { ModuleShell } from "@/components/shell/ModuleShell";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyDealerContext } from "@/lib/dealer/dealer-context-api";
import { MODULOS } from "@/lib/modulos/registro";

const CONCESIONARIOS = MODULOS.find((m) => m.id === "concesionarios") ?? null;
const CONTABILIDAD = MODULOS.find((m) => m.id === "contabilidad") ?? null;

/**
 * Chrome de /contable/*: el del dealer para un usuario de dealer, el de la Suite
 * para el resto.
 *
 * La contabilidad es la unica pantalla de la Suite que el menu del dealer
 * enlaza (`isDealerReachableSuitePath`). Se pintaba siempre dentro de
 * `GlobalForgeAppShell`, asi que un dealer de Mapaal que abria "Libro mayor"
 * desde su panel caia en el menu completo de la Suite: Marketing Hub, Credit
 * Hub, Compliance (root), Legacy y herramientas (auditoria Mapaal QA, P1).
 *
 * PS-9-CARCASAS-2: el usuario de dealer la ve en el armazón común con el módulo
 * Concesionarios (ModuleShell: su barra y el menú del dealer, filtrado por plan),
 * con DealerShell dentro (sincronización, avisos y acciones); el resto, el módulo
 * Contabilidad en el mismo armazón (PS-9-CARCASAS-3). Cada rama pinta UNA barra: por eso MarcoSuite va
 * aquí y no en AppGate.
 *
 * Solo cambia el chrome. Los permisos no se tocan: el menu del dealer filtra por
 * entitlements como en el resto del panel, y la pagina contable sigue siendo la
 * misma, con sus mismas llamadas.
 *
 * La senal es la de `DealerSuiteGate`: `GET /api/v1/autos/me/dealer-context`,
 * con al menos una asignacion.
 * - Mientras consulta pinta "Verificando…": ni un frame del chrome equivocado.
 * - Si la consulta FALLA se pinta la Suite, como antes de este cambio: un
 *   backend lento no deja a un administrador sin su menu.
 * - Se pregunta una vez por usuario (react-query, sin caducidad), no en cada
 *   navegacion entre pantallas contables.
 */
export function ContableChrome({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const contexto = useQuery({
    queryKey: ["contable-chrome-dealer-context", userId ?? "anon"],
    queryFn: fetchMyDealerContext,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (contexto.isPending) {
    return (
      <MarcoSuite>
        <div
          data-testid="contable-verificando"
          className="flex min-h-screen items-center justify-center text-sm text-zinc-400"
        >
          Verificando…
        </div>
      </MarcoSuite>
    );
  }

  if (contexto.isSuccess && contexto.data.length > 0) {
    return (
      <ModuleShell modulo={CONCESIONARIOS}>
        <DealerShell>{children}</DealerShell>
      </ModuleShell>
    );
  }

  if (contexto.isError) {
    console.warn("[contable-chrome] dealer-context fallo; se pinta el módulo Contabilidad:", contexto.error);
  }
  // PS-9-CARCASAS-3: quien no es dealer (o si la consulta falla) ve el módulo Contabilidad en el armazón común.
  return (
    <>
      <ModuleShell modulo={CONTABILIDAD}>{children}</ModuleShell>
      <OnboardingAgent />
    </>
  );
}
