import React from "react";
import { render, screen } from "@testing-library/react";
import { fetchLibraryStatus } from "@/lib/legal/library-api";
import { fetchStrategies } from "@/lib/legal/cases/legal-cases-api";
import { LegalApiErrorPanel } from "@/components/legal/cases/LegalApiErrorPanel";
import { apiFetch } from "@/lib/api/fetch-client";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;
function httpError(status: number, body: Record<string, unknown>) {
  return { ok: false, status, text: async () => JSON.stringify(body) } as Response;
}

test.each([
  [501, "STRATEGY_GENERATION_NOT_IMPLEMENTED"],
  [503, "LLM_UNAVAILABLE"],
  [504, "LLM_TIMEOUT"],
])("preserva estado HTTP %i, mensaje y request_id del backend", async (status, code) => {
  const requestId = `req-${status}-fixture`;
  fetchMock.mockResolvedValueOnce(httpError(status, {
    code, request_id: requestId, message: `Estado backend ${status}`,
  }));
  const action = fetchStrategies("tenant-fixture", "case-fixture");
  const error = await action.catch((value: unknown) => value);
  expect(error).toMatchObject({ status, requestId });
  render(<LegalApiErrorPanel title="Error legal" error={error} />);
  expect(screen.getByText(`HTTP ${status}`)).toBeInTheDocument();
  expect(screen.getByText(requestId)).toBeInTheDocument();
  expect(screen.getByText(`Estado backend ${status}`)).toBeInTheDocument();
});

test("la biblioteca distingue configuración ausente con HTTP 503 y request_id", async () => {
  fetchMock.mockResolvedValueOnce(httpError(503, {
    code: "LIBRARY_NOT_CONFIGURED", request_id: "req-library-503", message: "Biblioteca no configurada",
  }));
  const error = await fetchLibraryStatus("tenant-fixture").catch((value: unknown) => value);
  expect(error).toMatchObject({ status: 503, requestId: "req-library-503" });
});
