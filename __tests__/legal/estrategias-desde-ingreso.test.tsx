/**
 * Validación en producción 27-nov-2026: en un expediente recién creado («Ingreso de documentos») el botón
 * «Generar estrategias» devolvía «Error al ejecutar acción (409): Action 'generate_strategies' not available in
 * state 'INGESTION'». Ahora pasa primero a «Análisis automático» con motivo y nunca muestra el texto técnico.
 */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mensajeErrorEstrategias } from "@/lib/legal/cases/mensaje-estrategias";

const runAction = jest.fn();
const runTransition = jest.fn();
let estado = "INGESTION";
jest.mock("@/hooks/useLegalCore", () => ({ useLegalEffectiveTenantId: () => ({ effectiveTenantId: "t", tenantHydrated: true, tenantError: null }) }));
jest.mock("@/hooks/legal/useLegalCase", () => ({ useLegalCase: () => ({ data: { id: "c1", state: estado, strategies: [] }, isLoading: false, error: null, refetch: jest.fn() }) }));
jest.mock("@/hooks/legal/useCaseStrategies", () => ({ useCaseStrategies: () => ({ data: { strategies: [] }, isLoading: false, error: null, selectStrategies: jest.fn(), selecting: false }) }));
jest.mock("@/hooks/legal/useCaseActions", () => ({ useCaseActions: () => ({ runAction, runTransition, running: false }) }));
jest.mock("@/components/legal/cases/CaseDetailHeader", () => ({ CaseDetailHeader: () => null }));
jest.mock("@/components/legal/cases/CaseStrategyMultiSelect", () => ({ CaseStrategyMultiSelect: () => null }));

const Pagina = require("@/app/(forge)/legal/cases/[id]/strategy/page").default;
// La página lee los params con use(): se le da una promesa ya resuelta, como hace React con una promesa cacheada.
const params = () => Object.assign(Promise.resolve({ id: "c1" }), { status: "fulfilled", value: { id: "c1" } });
const ver = async () => {
  await act(async () => {
    render(<QueryClientProvider client={new QueryClient()}><React.Suspense fallback={null}><Pagina params={params()} /></React.Suspense></QueryClientProvider>);
  });
};
beforeEach(() => { jest.clearAllMocks(); estado = "INGESTION"; });

it("en «Ingreso de documentos» pasa a análisis con motivo y luego genera", async () => {
  runTransition.mockResolvedValue({});
  runAction.mockResolvedValue({ count: 3 });
  await ver();
  await userEvent.click(await screen.findByRole("button", { name: "Generar estrategias" }));
  await waitFor(() => expect(runAction).toHaveBeenCalledWith({ actionName: "generate_strategies", payload: {} }));
  expect(runTransition).toHaveBeenCalledWith({ newState: "TRIAGE", reason: "Paso a análisis para generar estrategias" });
  expect(runTransition.mock.invocationCallOrder[0]).toBeLessThan(runAction.mock.invocationCallOrder[0]);
});

it("ya en análisis no cambia la etapa", async () => {
  estado = "TRIAGE";
  runAction.mockResolvedValue({ count: 2 });
  await ver();
  await userEvent.click(await screen.findByRole("button", { name: "Generar estrategias" }));
  await waitFor(() => expect(runAction).toHaveBeenCalled());
  expect(runTransition).not.toHaveBeenCalled();
});

it("nunca muestra el error técnico del servidor", async () => {
  estado = "TRIAGE";
  runAction.mockRejectedValue(new Error("Error al ejecutar acción (409): Action 'generate_strategies' not available in state 'CLOSED'"));
  await ver();
  await userEvent.click(await screen.findByRole("button", { name: "Generar estrategias" }));
  const aviso = await screen.findByRole("status");
  expect(aviso.textContent).toMatch(/etapa actual del expediente/);
  expect(aviso.textContent).not.toMatch(/Action|409|state/);
});

it("traduce 503 y errores desconocidos", () => {
  expect(mensajeErrorEstrategias(new Error("HTTP 503"))).toMatch(/modelo no está disponible/);
  expect(mensajeErrorEstrategias("x")).toBe("No se pudieron generar las estrategias. Intente de nuevo.");
});
