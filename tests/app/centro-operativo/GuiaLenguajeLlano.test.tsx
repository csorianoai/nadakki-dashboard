/** @jest-environment jsdom */

/**
 * Auditoria Mapaal QA (P1): la guia del Centro Operativo en lenguaje llano,
 * igual que "Primeros pasos" del Inicio (#662). Lo que se mide es lo que el
 * dealer VE sin abrir nada: ni `is_opening` ni codigos de cuenta. El detalle
 * contable validado sigue entero, plegado y cerrado.
 */
import { render, screen } from "@testing-library/react";

import CentroOperativoPage from "@/app/centro-operativo/page";
import { contenidoCentroOperativo } from "@/app/centro-operativo/contenido";

jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ tenant: { id: "mapaal" } }) }));

/** "1220 — ...", "Debe 1220", "is_opening": lo tecnico que no va a la vista. */
const TECNICO = /is_opening|\b\d{4}\s—|\bDebe\b|\bHaber\b/;

function textoVisible(): string {
  const copia = document.body.cloneNode(true) as HTMLElement;
  copia.querySelectorAll("details").forEach((d) => d.remove());
  return copia.textContent ?? "";
}

it("a la vista no hay is_opening ni codigos de cuenta", () => {
  render(<CentroOperativoPage />);
  expect(textoVisible()).not.toMatch(TECNICO);
});

it("los pasos visibles son los de lenguaje llano del Inicio", () => {
  render(<CentroOperativoPage />);
  const bloque = contenidoCentroOperativo("mapaal").bloques.find((b) => b.id === "primeros-pasos");
  for (const paso of bloque?.pasosInicio ?? []) expect(screen.getAllByText(paso).length).toBeGreaterThan(0);
});

it("el detalle contable validado sigue entero, plegado y cerrado", () => {
  render(<CentroOperativoPage />);
  const detalles = document.querySelectorAll("details");
  expect(detalles.length).toBeGreaterThan(0);
  detalles.forEach((d) => {
    expect(d.open).toBe(false);
    expect(d.querySelector("summary")).toHaveTextContent("Ver detalle contable");
  });
  const pasosValidados = screen.getByTestId("centro-detalle-contable-primeros-pasos");
  expect(pasosValidados).toHaveTextContent("is_opening=true");
  expect(screen.getByTestId("centro-detalle-contable-cuentas")).toHaveTextContent("1220");
});
