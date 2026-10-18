/** PS-5-CARGA-PROYECTOS: el panel nunca queda en error crudo ni en carga infinita. */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/motion-stub", () => {
  const React = require("react");
  const make = (tag: string) =>
    React.forwardRef(({ initial, animate, transition, ...rest }: any, ref: any) =>
      React.createElement(tag, { ref, ...rest }));
  return { motion: new Proxy({}, { get: (_t, tag: string) => make(tag) }) };
});
jest.mock("@/components/ui/NavigationBar", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/proyectos/useAnimatedMetric", () => ({
  useAnimatedCount: (n: number) => n,
}));

const mockProyectos = jest.fn();
const mockHealth = jest.fn();
jest.mock("@/hooks/projects/useProyectos", () => ({
  useProyectos: () => mockProyectos(),
  useProyectoHealth: () => mockHealth(),
}));

import ProyectosDashboardPage from "@/app/proyectos/page";
import { ProjectsApiError } from "@/lib/projects/projectsClient";

const healthOk = { data: { ok: true }, isError: false, isPending: false, error: null };
const base = { refetch: jest.fn(), isError: false, error: null, fetchStatus: "idle" };

describe("Proyectos › Panel", () => {
  beforeEach(() => {
    mockHealth.mockReturnValue(healthOk);
  });

  it("respuesta válida: muestra la tabla con el proyecto", () => {
    mockProyectos.mockReturnValue({
      ...base,
      isPending: false,
      data: [{ id: "p1", name: "Torre Norte", state: "ACTIVE" }],
    });
    render(<ProyectosDashboardPage />);
    expect(screen.getByText("Torre Norte")).toBeInTheDocument();
  });

  it("respuesta vacía: muestra «Sin datos» y no un error", () => {
    mockProyectos.mockReturnValue({ ...base, isPending: false, data: [] });
    render(<ProyectosDashboardPage />);
    expect(screen.getByText(/Sin datos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Reintentar/i)).toBeNull();
  });

  it("sin tenant activo (consulta inactiva): «Sin datos», no carga infinita", () => {
    mockProyectos.mockReturnValue({ ...base, isPending: true, fetchStatus: "idle", data: undefined });
    render(<ProyectosDashboardPage />);
    expect(screen.getByText(/Sin datos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cargando proyectos/i)).toBeNull();
  });

  it("cargando de verdad: muestra el estado de carga", () => {
    mockProyectos.mockReturnValue({ ...base, isPending: true, fetchStatus: "fetching", data: undefined });
    render(<ProyectosDashboardPage />);
    expect(screen.getByText(/Cargando proyectos/i)).toBeInTheDocument();
  });

  it("fallo del backend: mensaje con acción, sin volcar el error crudo", () => {
    mockProyectos.mockReturnValue({
      ...base,
      isPending: false,
      isError: true,
      data: undefined,
      error: new ProjectsApiError("psycopg2.OperationalError: connection refused", 500),
    });
    render(<ProyectosDashboardPage />);
    expect(screen.getByRole("button", { name: /Reintentar/i })).toBeInTheDocument();
    expect(screen.queryByText(/psycopg2/)).toBeNull();
  });

  it("health caído: no vuelca el mensaje crudo", () => {
    mockProyectos.mockReturnValue({ ...base, isPending: false, data: [] });
    mockHealth.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      error: new ProjectsApiError("Traceback: upstream 502 at 10.0.0.4", 502),
    });
    render(<ProyectosDashboardPage />);
    expect(screen.queryByText(/Traceback|10\.0\.0\.4/)).toBeNull();
  });
});
