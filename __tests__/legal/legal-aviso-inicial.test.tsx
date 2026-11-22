/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { CLAVE_AVISO_LEGAL, LegalAvisoInicial } from "@/components/legal/LegalAvisoInicial";

beforeEach(() => window.sessionStorage.clear());

test("al entrar muestra el aviso de Ley 91 y con «Entendido» desaparece", () => {
  render(<LegalAvisoInicial />);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/Ley 91/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.sessionStorage.getItem(CLAVE_AVISO_LEGAL)).toBe("1");
});

test("ya visto en esta sesión: no vuelve a tapar el contenido", () => {
  window.sessionStorage.setItem(CLAVE_AVISO_LEGAL, "1");
  render(<LegalAvisoInicial />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("Escape también lo cierra", () => {
  render(<LegalAvisoInicial />);
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});
