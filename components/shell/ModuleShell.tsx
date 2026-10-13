"use client";

import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { DealerSuiteGate } from "@/components/dealer/DealerSuiteGate";
import { CLASES_FUENTES_FORGE } from "@/components/shell/fuentes-forge";
import { BuscadorNavegacion } from "@/components/nav/BuscadorNavegacion";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { PestanasMarketing } from "@/components/nav/PestanasMarketing";
import { TenantBrandedDocumentTitle } from "@/components/white-label/TenantBrandedDocumentTitle";
import { forgeAppDataTenantAttribute } from "@/lib/credit-hub/forge-test-tenant-override";
import { menuVisible, modulosVisibles, type GrupoMenu, type ModuloConfig } from "@/lib/modulos/registro";
import { CLASES } from "./clases";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleTopBar } from "./ModuleTopBar";
import { useContextoShell } from "./useContextoShell";

/** Menú de la Suite (portada y notificaciones): sirve para ELEGIR módulo. */
function menuDeSuite(modulos: ModuloConfig[]): GrupoMenu[] {
  return [
    {
      id: "suite",
      label: "Suite",
      items: [
        { id: "suite-inicio", label: "Inicio", href: "/" },
        { id: "suite-notificaciones", label: "Notificaciones", href: "/notifications" },
      ],
    },
    { id: "suite-modulos", label: "Elegir módulo", items: modulos.map((m) => ({ id: `modulo-${m.id}`, label: m.label, href: m.raiz, icono: m.icono })) },
  ];
}

export type ModuleShellProps = {
  /** Módulo que se abre; `null` = la Suite (portada), cuyo menú lista los módulos para elegir. */
  modulo: ModuloConfig | null;
  children: ReactNode;
};

/**
 * ARMAZÓN COMÚN de los módulos (PR 6a). Barra superior común (logotipo e Inicio, selector de módulos, migas,
 * Atrás/Adelante, Ctrl+K, notificaciones, usuario y el hueco del selector Empresa/Vista) + menú lateral del
 * módulo + contenido. Conserva lo que daba GlobalForgeAppShell a estas pantallas: fuentes y clase `forge-app`,
 * DealerSuiteGate, título de pestaña con la marca del tenant y el buscador Ctrl+K.
 */
export function ModuleShell({ modulo, children }: ModuleShellProps) {
  const pathname = usePathname();
  const { conSesion, usuario, esSuperadmin } = useContextoShell();
  const [cajon, setCajon] = useState(false);
  const cerrar = useCallback(() => setCajon(false), []);
  useEffect(() => setCajon(false), [pathname]);

  const modulos = useMemo(() => modulosVisibles(usuario), [usuario]);
  const grupos = useMemo(() => (modulo ? menuVisible(modulo, usuario) : menuDeSuite(modulos)), [modulo, modulos, usuario]);
  const Puerta = conSesion ? DealerSuiteGate : Fragment;

  return (
    <MarcoSuite
      barra={
        <ModuleTopBar
          modulos={modulos}
          actual={modulo?.id ?? null}
          onMenu={() => setCajon((a) => !a)}
          menuAbierto={cajon}
          conSesion={conSesion}
          esSuperadmin={esSuperadmin}
        />
      }
    >
      <Puerta>
        <div
          className={`${CLASES_FUENTES_FORGE} ${CLASES.raiz}`}
          data-testid="module-shell"
          data-modulo={modulo?.id ?? "suite"}
          data-tenant={forgeAppDataTenantAttribute()}
          style={modulo ? ({ ["--acento-modulo" as string]: modulo.acento } as CSSProperties) : undefined}
        >
          <a href="#main-content" className={CLASES.saltar}>Saltar al contenido</a>
          <div className={CLASES.cuerpo}>
            <ModuleSidebar titulo={modulo?.label ?? "Suite"} moduloId={modulo?.id ?? null} grupos={grupos} pathname={pathname} abierto={cajon} onCerrar={cerrar} />
            <div className={CLASES.columna}>
              <main id="main-content" className={CLASES.contenido}>
                {conSesion ? <TenantBrandedDocumentTitle /> : null}
                {modulo?.id === "marketing" ? <PestanasMarketing /> : null}
                {children}
              </main>
            </div>
          </div>
          {conSesion ? <BuscadorNavegacion /> : null}
        </div>
      </Puerta>
    </MarcoSuite>
  );
}
