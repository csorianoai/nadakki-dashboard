/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockTenant = jest.fn();
const mockCases = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
jest.mock("@/hooks/useLegalCore", () => ({ useLegalEffectiveTenantId: () => mockTenant() }));
jest.mock("@/hooks/legal/useLegalCases", () => ({ useLegalCases: () => mockCases() }));

import LegalCasesListPage from "@/app/(forge)/legal/cases/page";

const tenantOk = { effectiveTenantId: "t-qa", tenantHydrated: true, tenantError: null };

describe("Legal › Expedientes (página)", () => {
  beforeEach(() => {
    mockTenant.mockReturnValue(tenantOk);
  });

  it("respuesta vacía: ausencia explícita, sin error", () => {
    mockCases.mockReturnValue({ data: { cases: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<LegalCasesListPage />);
    expect(screen.getByText(/No tienes expedientes activos/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("respuesta válida: lista los expedientes", () => {
    mockCases.mockReturnValue({
      data: {
        cases: [
          {
            case_id: "c1",
            case_number_internal: "INT-1",
            case_type: "defensa_civil_cobro_pesos",
            legal_jurisdiction: "do",
            state: "INGESTION",
            title: "Expediente uno",
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
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<LegalCasesListPage />);
    expect(screen.getByText("Expediente uno")).toBeInTheDocument();
  });

  it("fallo del backend: mensaje con acción, sin volcar el error crudo", () => {
    const refetch = jest.fn();
    mockCases.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Error al cargar expedientes (502) <html>stack</html>"),
      refetch,
    });
    render(<LegalCasesListPage />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/502|stack|html/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("tenant aún sin resolver: estado de carga, no error", () => {
    mockTenant.mockReturnValue({ effectiveTenantId: undefined, tenantHydrated: true, tenantError: null });
    mockCases.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<LegalCasesListPage />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it("tenant no determinado tras el tiempo de espera: mensaje con acción", () => {
    mockTenant.mockReturnValue({ effectiveTenantId: undefined, tenantHydrated: true, tenantError: "No se pudo determinar el tenant activo" });
    mockCases.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<LegalCasesListPage />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Volver al panel Legal/i })).toHaveAttribute("href", "/legal");
  });
});
