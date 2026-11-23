/**
 * Recorrido QA 23-nov: las estrategias respondían SIN_DATOS (sin hechos) y la
 * pantalla no decía nada; tampoco había dónde escribir los hechos.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch-client";
import { CaseFactsCard } from "@/components/legal/cases/CaseFactsCard";
import { CaseActionsMenu } from "@/components/legal/cases/CaseActionsMenu";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
const http = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body }) as Response;
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/app/providers/DisasterModeProvider", () => ({ useDisasterLevel: () => "NORMAL" }));
const runAction = jest.fn();
jest.mock("@/hooks/legal/useCaseActions", () => ({
  useCaseActions: () => ({
    data: { available_actions: [{ action_name: "generate_strategies", display_name: "Generate Strategies" }], transitions_available: [] },
    isLoading: false, runAction, runTransition: jest.fn(), running: false,
  }),
}));
const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
beforeEach(() => jest.clearAllMocks());

it("sin hechos lo advierte y permite escribirlos con motivo (PATCH /classification)", async () => {
  fetchMock.mockResolvedValue(http(200, {}));
  const listo = jest.fn();
  wrap(<CaseFactsCard tenantId="t" caseId="c1" description={null} onSaved={listo} />);
  expect(screen.getByText(/las estrategias con IA no se pueden generar/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Escribir los hechos" }));
  await userEvent.type(screen.getByLabelText("Hechos"), "El deudor no pagó tres facturas por RD$850,000.");
  await userEvent.click(screen.getByRole("button", { name: "Guardar hechos" }));
  await waitFor(() => expect(listo).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toBe("/api/legal/cases/c1/classification");
  expect(JSON.parse(String((init as RequestInit).body))).toEqual({
    description: "El deudor no pagó tres facturas por RD$850,000.",
    correction_reason: "Se registran los hechos del caso",
  });
});

it("hechos demasiado cortos no se envían", async () => {
  wrap(<CaseFactsCard tenantId="t" caseId="c1" description="" />);
  await userEvent.click(screen.getByRole("button", { name: "Escribir los hechos" }));
  await userEvent.type(screen.getByLabelText("Hechos"), "corto");
  await userEvent.click(screen.getByRole("button", { name: "Guardar hechos" }));
  expect(screen.getByRole("alert")).toHaveTextContent("20 caracteres");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("«Generar estrategias» con SIN_DATOS muestra el motivo", async () => {
  runAction.mockResolvedValue({ estado: "sin_datos", motivo: "Faltan el tipo de caso y una descripcion de los hechos.", count: 0 });
  wrap(<CaseActionsMenu tenantId="t" caseId="c1" />);
  await userEvent.click(screen.getByRole("button", { name: /Generar estrategias/ }));
  expect(await screen.findByRole("status")).toHaveTextContent("No se generaron estrategias: Faltan");
});
