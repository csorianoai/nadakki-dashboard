/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CaseList } from "@/components/legal/cases/CaseList";

function qc(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

describe("CaseList: fallo del backend", () => {
  it("mensaje fijo con acción, sin volcar el error crudo", () => {
    const onRetry = jest.fn();
    render(qc(<CaseList cases={[]} error onRetry={onRetry} />));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("un Error con detalle técnico no se muestra", () => {
    render(qc(<CaseList cases={[]} error={new Error("Error al cargar expedientes (502) <html>stack</html>")} onRetry={() => {}} />));
    expect(screen.queryByText(/502|stack|html/i)).toBeNull();
  });

  it("sin onRetry no hay botón, pero sí el aviso", () => {
    render(qc(<CaseList cases={[]} error />));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reintentar/i })).toBeNull();
  });
});
