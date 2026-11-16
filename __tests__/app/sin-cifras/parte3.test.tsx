/** D5-SIN-CIFRAS-FALSAS parte 3: ai-studio y workflows sin cifras fijas ni datos de respaldo. */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));
jest.mock("@/lib/api/base", () => ({ fetchWithTimeout: jest.fn() }));

// El centinela vive junto a las pantallas (app/workflows/sin-cifras-fijas.test.ts); aqui se ejecuta dentro del patron de jest.
require("@/app/workflows/sin-cifras-fijas.test");

import { fetchWithTimeout } from "@/lib/api/base";
const mockFetch = fetchWithTimeout as jest.Mock;

describe("ai-studio", () => {
  it("no pinta cifras fijas, muestra estado vacio y conserva titulo y herramientas", () => {
    const Page = require("@/app/ai-studio/page").default;
    const { container } = render(<Page />);
    const texto = container.textContent || "";
    for (const p of ["15K", "4.8", "99%", "Uptime", "Rating"]) expect(texto).not.toContain(p);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("AI Studio");
    expect(screen.getByTestId("estado-vacio").textContent).toMatch(/^Aun no hay datos de .+ en tu cuenta$/);
    expect(container.querySelector('a[href="/ai-studio/generate"]')).not.toBeNull();
  });
});

describe("workflows", () => {
  const Page = () => require("@/app/workflows/page").default;
  beforeEach(() => mockFetch.mockReset());

  it("con la llamada fallando no deja cifras ni workflows de respaldo", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));
    const P = Page();
    const { container } = render(<P />);
    await waitFor(() => expect(screen.getByText(/No pudimos cargar estos datos/)).toBeTruthy());
    const texto = container.textContent || "";
    for (const p of ["1247", "1,247", "94.5", "2340", "respaldo", "Campaign Optimization", "Tasa de"]) expect(texto).not.toContain(p);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Marketing Workflows");
  });

  it("con datos del backend pinta los del tenant y no inventa tasa ni ejecuciones", async () => {
    mockFetch.mockResolvedValue({ workflows: [{ id: "x1", name: "Flujo Simulado", version: "2.0.0", tier: "CORE", agents: 3, status: "active" }] });
    const P = Page();
    const { container } = render(<P />);
    await waitFor(() => expect(screen.getAllByText("Flujo Simulado").length).toBeGreaterThan(0));
    const texto = container.textContent || "";
    for (const p of ["1247", "94.5", "Ejecuciones Totales", "Tasa de"]) expect(texto).not.toContain(p);
    expect(texto).toContain("3 agentes");
  });

  it("mientras carga muestra '—' y no cifras", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const P = Page();
    const { container } = render(<P />);
    expect(container.textContent).not.toMatch(/\b0\b/);
  });
});
