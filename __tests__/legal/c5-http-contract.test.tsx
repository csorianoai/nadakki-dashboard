/**
 * Contrato HTTP del panel Legal contra RESPUESTAS REALES del backend.
 * Los cuerpos salen de __tests__/legal/fixtures/backend-respuestas-reales.json, generado con FastAPI TestClient
 * sobre el código del backend (ver su campo _fuente). Solo se simula el transporte, nunca el cuerpo.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { fetchLibraryStatus } from "@/lib/legal/library-api";
import { fetchStrategies } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";
import { extractLegalApiDetail } from "@/lib/legal/parse-api-error";
import { apiFetch } from "@/lib/api/fetch-client";
import REAL from "./fixtures/backend-respuestas-reales.json";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
type Caso = { status: number; body: Record<string, unknown> };
const casos = REAL as unknown as Record<string, Caso>;
function http({ status, body }: Caso) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body), json: async () => body } as Response;
}

test.each([
  "strategies_generate_503_LLM_UNAVAILABLE",
  "strategies_generate_504_LLM_TIMEOUT",
  "strategies_generate_502_LLM_INVALID_RESPONSE",
])("estrategias %s: estado HTTP y motivo del backend, nunca el JSON en bruto", async (clave) => {
  const caso = casos[clave];
  fetchMock.mockResolvedValueOnce(http(caso));
  const error = await fetchStrategies("tenant-fixture", "case-fixture").catch((value: unknown) => value);
  expect(error).toMatchObject({ status: caso.status });
  render(<LegalApiErrorPanel title="Error legal" error={error} />);
  expect(screen.getByText(`HTTP ${caso.status}`)).toBeInTheDocument();
  expect(screen.getByText(String(caso.body.motivo))).toBeInTheDocument();
  expect(screen.queryByText(/"code"/)).toBeNull();
});

test("biblioteca sin configurar: HTTP 503 con el detail real", async () => {
  const caso = casos.library_status_503;
  fetchMock.mockResolvedValueOnce(http(caso));
  const error = await fetchLibraryStatus("tenant-fixture").catch((value: unknown) => value);
  expect(error).toMatchObject({ status: 503 });
  expect(extractLegalApiDetail(JSON.stringify(caso.body))).toBe(caso.body.detail);
});

test("biblioteca sin sesión: HTTP 401 (desde #2817 el estado exige sesión)", async () => {
  fetchMock.mockResolvedValueOnce(http(casos.library_status_401));
  const error = await fetchLibraryStatus("tenant-fixture").catch((value: unknown) => value);
  expect(error).toMatchObject({ status: 401 });
});

test("biblioteca vacía: 200 con el cuerpo real, sin error", async () => {
  const caso = casos.library_status_200_vacia;
  fetchMock.mockResolvedValueOnce(http(caso));
  await expect(fetchLibraryStatus("tenant-fixture")).resolves.toEqual(caso.body);
});
