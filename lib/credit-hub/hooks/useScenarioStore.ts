"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScenarioResult, SimulationInputs } from "@/lib/credit/simulation/scenario-engine";

export interface SavedScenario {
  id: string;
  name: string;
  inputs: SimulationInputs;
  result: ScenarioResult;
  savedAt: string;
}

const STORAGE_KEY = "nadakki-credit-hub-scenarios";
const MAX_SCENARIOS = 3;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useScenarioStore() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setScenarios(JSON.parse(raw) as SavedScenario[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: SavedScenario[]) => {
    setScenarios(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }, []);

  const saveScenario = useCallback((name: string, inputs: SimulationInputs, result: ScenarioResult) => {
    const newScenario: SavedScenario = {
      id: newId(),
      name,
      inputs,
      result,
      savedAt: new Date().toISOString(),
    };
    setScenarios((prev) => {
      const next = [newScenario, ...prev].slice(0, MAX_SCENARIOS);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    return newScenario;
  }, []);

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { scenarios, saveScenario, removeScenario, clearAll };
}
