/** @jest-environment jsdom */

// Reproducción de extremo a extremo de la carga de Expedientes: la pantalla real,
// el hook real y el cliente real (fetchCasesList → apiFetch). Solo se simula la red
// (fetch) y el tenant. Cada caso fija una respuesta del backend y mide qué ve el usuario.

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockTenant = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
jest.mock("@/hooks/useLegalCore", () => ({ useLegalEffectiveTenantId: () => mockTenant() }));

import LegalCasesListPage from "@/app/(forge)/legal/cases/page";

const tenantOk = { effectiveTenantId: "tenant-qa", tenantHydrated: true, tenantError: null };

// jsdom no trae `Response`; basta con lo que lee fetchCasesList (ok, status, text()).
function fakeResponse(status: number, text: string): Response {
  return { ok: status >= 200 && status < 300, status, text: async () => text } as unknown as Response;
}

function jsonResponse(status: number, body: unknown): Response {
  return fakeResponse(status, JSON.stringify(body));
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LegalCasesListPage />
    </QueryClientProvider>
  );
}

describe("Legal › Expedientes (cadena real de carga)", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    mockTenant.mockReturnValue(tenantOk);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("pide /api/legal/cases con el tenant de la sesión en X-Tenant-ID", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { cases: [], total: 0 }));
    renderPage();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/^\/api\/legal\/cases(\?|$)/);
    expect(new Headers(init.headers).get("X-Tenant-ID")).toBe("tenant-qa");
  });

  it("respuesta vacía (200 con lista vacía): ausencia explícita, sin error", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { cases: [], total: 0 }));
    renderPage();
    expect(await screen.findByText(/No tienes expedientes activos/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("respuesta vacía sin cuerpo (200 vacío): ausencia explícita, sin error", async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, ""));
    renderPage();
    expect(await screen.findByText(/No tienes expedientes activos/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("respuesta válida: lista los expedientes reales del tenant", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        cases: [
          {
            case_id: "case-1",
            case_number_internal: "INT-1",
            case_type: "defensa_civil_cobro_pesos",
            legal_jurisdiction: "do",
            state: "INGESTION",
            title: "Expediente de prueba",
            priority: "normal",
            actors: [],
            documents: [],
            deadlines: [],
            strategies: [],
            practice_area_tags: [],
            open_issues_count: 0,
          },
        ],
        total: 1,
      })
    );
    renderPage();
    expect(await screen.findByText("Expediente de prueba")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("fallo del backend (502): mensaje con acción, sin volcar el código ni el cuerpo", async () => {
    fetchMock.mockResolvedValue(fakeResponse(502, "<html>Bad Gateway</html>"));
    renderPage();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/No se pudieron cargar los expedientes/);
    expect(screen.queryByText(/502|Bad Gateway|html/i)).toBeNull();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("reintentar tras el fallo vuelve a pedir y muestra los datos", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { detail: "unavailable" }))
      .mockResolvedValueOnce(jsonResponse(200, { cases: [], total: 0 }));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /reintentar/i }));
    expect(await screen.findByText(/No tienes expedientes activos/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("respuesta 200 que no es JSON: mensaje con acción, nunca pantalla de carga infinita", async () => {
    fetchMock.mockResolvedValue(fakeResponse(200, "<!doctype html><html></html>"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudieron cargar los expedientes/);
  });

  it("sesión expirada (401): mensaje con acción, sin error crudo", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Not authenticated" }));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudieron cargar los expedientes/);
    expect(screen.queryByText(/Not authenticated/)).toBeNull();
  });
});
