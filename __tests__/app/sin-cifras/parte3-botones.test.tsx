/** D5-SIN-CIFRAS-FALSAS parte 3: ningun boton habilitado sin accion en workflows. */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));
jest.mock("@/lib/api/base", () => ({ fetchWithTimeout: jest.fn() }));

import { fetchWithTimeout } from "@/lib/api/base";
const mockFetch = fetchWithTimeout as jest.Mock;

describe("workflows: botones sin accion", () => {
  it("Ejecutar Todos, Programar y Metricas estan deshabilitados con su motivo visible", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));
    const P = require("@/app/workflows/page").default;
    const { container } = render(<P />);
    await waitFor(() => expect(screen.getByText(/No pudimos cargar estos datos/)).toBeTruthy());
    for (const nombre of [/Ejecutar Todos/, /Programar/, /Métricas/]) {
      const boton = screen.getByText(nombre).closest("button") as HTMLButtonElement;
      expect(boton).toBeTruthy();
      expect(boton.disabled).toBe(true);
      expect(boton.textContent).toMatch(/Aún no disponible/);
    }
    const sinAccion = Array.from(container.querySelectorAll("button")).filter(
      (b) => !b.disabled && !(b as any)[Object.keys(b).find((k) => k.startsWith("__reactProps")) as string]?.onClick
    );
    expect(sinAccion).toHaveLength(0);
  });
});
