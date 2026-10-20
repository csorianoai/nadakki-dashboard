"use client";

import { usePathname } from "next/navigation";
import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { DealerSuiteGate } from "@/components/dealer/DealerSuiteGate";
import { CLASES_FUENTES_FORGE } from "@/components/shell/fuentes-forge";
import { BuscadorNavegacion } from "@/components/nav/BuscadorNavegacion";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { SinModulos } from "@/components/nav/SinModulos";
import { TenantBrandedDocumentTitle } from "@/components/white-label/TenantBrandedDocumentTitle";
import { forgeAppDataTenantAttribute } from "@/lib/credit-hub/forge-test-tenant-override";
import { isDealerChromePath } from "@/lib/autos-portal/routes";
import { grupoDePantalla, grupoDeRuta, menuVisible, modulosVisibles, tienePantallaGrupo, grupoEnlazable, type GrupoMenu, type ModuloConfig } from "@/lib/modulos/registro";
import { capacidadesDe, ConCapacidades } from "./capacidades";
import { CLASES } from "./clases";
import { ModuleSidebar } from "./ModuleSidebar";
import { ModuleTopBar } from "./ModuleTopBar";
import { PestanasGrupo } from "./PestanasGrupo";
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
    ...(modulos.length > 0
      ? [{ id: "suite-modulos", label: "Elegir módulo", items: modulos.map((m) => ({ id: `modulo-${m.id}`, label: m.label, href: m.raiz, icono: m.icono })) }]
      : []),
  ];
}

/**
 * Lo que está dentro de ModuleShell lo sabe (PS-9-CARCASAS-2): la carcasa de un core migrado (DealerShell) deja de
 * pintar su propia barra y su propio menú cuando ya la envuelve el armazón común, y se queda con lo demás.
 */
const DentroDeModuleShell = createContext(false);
export function useDentroDeModuleShell(): boolean {
  return useContext(DentroDeModuleShell);
}

/** Turquesa de las tarjetas y pestañas: el matiz del turquesa de DCC (lib/dcc/tokens.ts, --dcc-teal), que no es un token global. */
const TURQUESA_MODULO = "#0ea5a4";

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
  const todos = useMemo(() => (modulo ? menuVisible(modulo, usuario) : menuDeSuite(modulos)), [modulo, modulos, usuario]);
  // Items con capability (Dealer OS): solo con permiso explícito del lote de acceso. Sin capabilities no se pide nada.
  const claves = useMemo(() => capacidadesDe(todos), [todos]);
  // DealerSuiteGate saca al dealer de la Suite hacia su panel. El panel del dealer (/autos/dealer/**, /centro-operativo)
  // también abre en ModuleShell (PS-9-CARCASAS-2): ahí la puerta lo mandaría a donde ya está, en bucle («Llevándote a tu
  // panel…» para siempre en staging, César 20-oct). En su propio panel no hay puerta.
  const Puerta = conSesion && !isDealerChromePath(pathname) ? DealerSuiteGate : Fragment;

  const cuerpo = (grupos: GrupoMenu[]) => {
    // Pestañas: las páginas del grupo de la pantalla actual; en un módulo sin grupos (menú plano), todas las suyas.
    // La pantalla del grupo (tarjetas) no lleva pestañas: ya muestra todas las páginas.
    const conGrupos = modulo ? tienePantallaGrupo(modulo, grupos, esSuperadmin) : false;
    const enPantallaGrupo = modulo ? grupoDePantalla(modulo, grupos, pathname) !== null : false;
    const grupoPestanas = !modulo || enPantallaGrupo ? null : conGrupos ? grupoDeRuta(grupos, pathname) : (grupos.filter(grupoEnlazable).length === 1 ? grupos.find(grupoEnlazable)! : null);
    return (
      <div className={CLASES.cuerpo}>
        <ModuleSidebar titulo={modulo?.label ?? "Suite"} moduloId={modulo?.id ?? null} grupos={grupos} pathname={pathname} abierto={cajon} onCerrar={cerrar} plano={!modulo} modulo={conGrupos ? modulo : null} />
        <div className={CLASES.columna}>
          <main id="main-content" className={CLASES.contenido}>
            {conSesion ? <TenantBrandedDocumentTitle /> : null}
            {modulo && grupoPestanas ? <PestanasGrupo titulo={conGrupos ? grupoPestanas.label : modulo.label} paginas={grupoPestanas.items} pathname={pathname} /> : null}
            {!modulo && conSesion && modulos.length === 0 && (pathname ?? "/").replace(/\/+$/, "") === "" ? <SinModulos /> : children}
          </main>
        </div>
      </div>
    );
  };

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
          style={modulo ? ({ ["--acento-modulo" as string]: modulo.acento, ["--turquesa-modulo" as string]: TURQUESA_MODULO } as CSSProperties) : undefined}
        >
          <a href="#main-content" className={CLASES.saltar}>Saltar al contenido</a>
          <DentroDeModuleShell.Provider value>
            {claves.length > 0 ? <ConCapacidades claves={claves} grupos={todos}>{cuerpo}</ConCapacidades> : cuerpo(todos)}
          </DentroDeModuleShell.Provider>
          {conSesion ? <BuscadorNavegacion /> : null}
        </div>
      </Puerta>
    </MarcoSuite>
  );
}
