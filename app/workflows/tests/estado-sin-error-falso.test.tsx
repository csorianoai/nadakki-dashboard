/**
 * C3-FLUJOS-SIN-ERROR-FALSO: /workflows pedia "/workflows" (ruta relativa, sin reescritura ni ruta en el backend):
 * el servidor devolvia el HTML de la propia pagina, response.json() lanzaba y la pantalla mostraba un error falso.
 * Sin flujos en la cuenta => estado vacio honesto. Un fallo real (500) sigue mostrando el error.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/base", () => ({ fetchWithTimeout: jest.fn() }));
import { fetchWithTimeout } from "@/lib/api/base";
import WorkflowsPage from "../page";

const mockFetch = fetchWithTimeout as jest.Mock;
const ERROR = /No pudimos cargar estos datos/;

beforeEach(() => mockFetch.mockReset());

describe("/workflows", () => {
  it("respuesta no JSON (HTML de la propia pagina): estado vacio, sin error", async () => {
    mockFetch.mockRejectedValue(new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"));
    render(<WorkflowsPage />);
    expect(await screen.findByText(/Aún no hay flujos en tu cuenta/)).toBeTruthy();
    expect(screen.queryByText(ERROR)).toBeNull();
  });

  it("404 (el backend no tiene la ruta): estado vacio, sin error", async () => {
    mockFetch.mockRejectedValue({ status: 404, endpoint: "/workflows", error: { message: "Recurso no encontrado" } });
    render(<WorkflowsPage />);
    expect(await screen.findByText(/Aún no hay flujos en tu cuenta/)).toBeTruthy();
    expect(screen.queryByText(ERROR)).toBeNull();
  });

  it("lista vacia valida: estado vacio", async () => {
    mockFetch.mockResolvedValue({ workflows: [] });
    render(<WorkflowsPage />);
    expect(await screen.findByText(/Aún no hay flujos en tu cuenta/)).toBeTruthy();
  });

  it("500 real: muestra el error y no el estado vacio", async () => {
    mockFetch.mockRejectedValue({ status: 500, endpoint: "/workflows", error: { message: "HTTP 500" } });
    render(<WorkflowsPage />);
    expect(await screen.findByText(ERROR)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(/Aún no hay flujos/)).toBeNull());
  });

  it("con flujos: los lista", async () => {
    mockFetch.mockResolvedValue({
      workflows: [{ id: "campaign-optimization", name: "Optimización", version: "1.0", tier: "CORE", agents: 3, status: "active" }],
    });
    render(<WorkflowsPage />);
    expect(await screen.findByText("Optimización")).toBeTruthy();
    expect(screen.queryByText(/Aún no hay flujos/)).toBeNull();
  });
});
