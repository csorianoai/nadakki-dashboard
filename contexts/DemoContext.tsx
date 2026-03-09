"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const STORAGE_KEY = "nadakki_sic_demo";
const ESCENARIO_KEY = "nadakki_sic_demo_escenario";

export type EscenarioDemo =
  | "banco_conservador"
  | "banco_agresivo"
  | "crisis_economica"
  | "alta_morosidad"
  | "expansion_crediticia";

export const ESCENARIOS: { id: EscenarioDemo; label: string; desc: string }[] = [
  { id: "banco_conservador", label: "Banco conservador", desc: "Criterios restrictivos, baja aprobación" },
  { id: "banco_agresivo", label: "Banco agresivo", desc: "Alta aprobación, mayor riesgo" },
  { id: "crisis_economica", label: "Crisis económica", desc: "Morosidad elevada, ajustes" },
  { id: "alta_morosidad", label: "Alta morosidad", desc: "Portafolio con indicadores de riesgo" },
  { id: "expansion_crediticia", label: "Expansión crediticia", desc: "Crecimiento, más aprobaciones" },
];

interface DemoContextType {
  demoMode: boolean;
  escenario: EscenarioDemo;
  setDemoMode: (on: boolean) => void;
  setEscenario: (e: EscenarioDemo) => void;
  tourActivo: boolean;
  iniciarTour: () => void;
  cerrarTour: () => void;
}

const defaultContext: DemoContextType = {
  demoMode: false,
  escenario: "banco_conservador",
  setDemoMode: () => {},
  setEscenario: () => {},
  tourActivo: false,
  iniciarTour: () => {},
  cerrarTour: () => {},
};

const DemoContext = createContext<DemoContextType>(defaultContext);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(false);
  const [escenario, setEscenarioState] = useState<EscenarioDemo>("banco_conservador");
  const [tourActivo, setTourActivo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem(STORAGE_KEY);
    setDemoModeState(v === "true");
    const e = localStorage.getItem(ESCENARIO_KEY) as EscenarioDemo | null;
    if (e && ESCENARIOS.some((s) => s.id === e)) setEscenarioState(e);
  }, []);

  const setDemoMode = useCallback((on: boolean) => {
    setDemoModeState(on);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, String(on));
  }, []);

  const setEscenario = useCallback((e: EscenarioDemo) => {
    setEscenarioState(e);
    if (typeof window !== "undefined") localStorage.setItem(ESCENARIO_KEY, e);
  }, []);

  const iniciarTour = useCallback(() => setTourActivo(true), []);
  const cerrarTour = useCallback(() => setTourActivo(false), []);

  return (
    <DemoContext.Provider
      value={{
        demoMode,
        escenario,
        setDemoMode,
        setEscenario,
        tourActivo,
        iniciarTour,
        cerrarTour,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextType {
  return useContext(DemoContext);
}
