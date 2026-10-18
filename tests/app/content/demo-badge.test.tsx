import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ContentPage from "@/app/content/page";
import CalendarPage from "@/app/content/calendar/page";
import StudioPage from "@/app/content/studio/page";

// No existe endpoint de listado del tenant para Content Hub (openapi.json solo
// expone POST /api/v1/marketing/content/assets), asi que todo literal fijo
// debe llevar badge DEMO. Recorremos el arbol renderizado.
function insideDemo(el: HTMLElement): boolean {
  const scope = el.closest("[data-demo]");
  return !!scope && /DEMO/.test(scope.textContent ?? "");
}

describe("Content Hub: datos fijos con badge DEMO", () => {
  it("las cifras del hub estan dentro de un contenedor DEMO", () => {
    render(<ContentPage />);
    for (const literal of ["1,250", "89", "4", "98%"]) {
      expect(insideDemo(screen.getByText(literal))).toBe(true);
    }
  });

  it("el calendario marca sus publicaciones fijas como DEMO", () => {
    const { container } = render(<CalendarPage />);
    const marks = container.querySelectorAll("[title]");
    const posts = Array.from(marks).filter((m) =>
      ["Post de producto", "Thread educativo", "Caso de éxito"].includes(m.getAttribute("title") ?? ""),
    );
    // Solo se ven si el mes actual es el de los datos fijos; el badge debe existir siempre.
    expect(container.querySelector("[data-demo]")).not.toBeNull();
    posts.forEach((p) => expect(insideDemo(p as HTMLElement)).toBe(true));
  });

  it("el estudio marca las variantes simuladas como DEMO", async () => {
    jest.useFakeTimers();
    render(<StudioPage />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "algo" } });
    fireEvent.click(screen.getByRole("button", { name: /generar/i }));
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    const variant = screen.getByText(/Variante 1/);
    expect(insideDemo(variant)).toBe(true);
    jest.useRealTimers();
  });
});
