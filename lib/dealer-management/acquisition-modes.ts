/**
 * Modos de adquisicion del tenant (F4D-3: GET /api/v1/autos/acquisition-modes).
 *
 * Es la unica fuente del desplegable "Codigo de adquisicion": si la lectura
 * falla se ofrece reintento, nunca una lista inventada ni un campo libre.
 * El tenant lo pone el backend desde el token.
 */

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/fetch-client";

export type AcquisitionMode = { code: string; label: string };
export type AcquisitionModesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; items: AcquisitionMode[] };

export const ACQUISITION_MODES_PATH = "/api/v1/autos/acquisition-modes";

export async function fetchAcquisitionModes(): Promise<AcquisitionMode[]> {
  const response = await apiFetch(ACQUISITION_MODES_PATH, { method: "GET", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const body: unknown = await response.json().catch(() => null);
  const items = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) throw new Error("BAD_SHAPE");
  return items
    .filter((i): i is AcquisitionMode => typeof i?.code === "string" && i.code.trim() !== "" && typeof i?.label === "string")
    .map((i) => ({ code: i.code, label: i.label }));
}

export function useAcquisitionModes(enabled: boolean): AcquisitionModesState & { retry: () => void } {
  const [state, setState] = useState<AcquisitionModesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setState({ status: "loading" });
    fetchAcquisitionModes().then(
      (items) => alive && setState({ status: "ok", items }),
      () => alive && setState({ status: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [enabled, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
