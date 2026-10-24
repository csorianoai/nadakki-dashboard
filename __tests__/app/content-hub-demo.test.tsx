import React from "react";
import { render } from "@testing-library/react";
import ContentPage from "@/app/content/page";

// Literales de demostracion fijos del Content Hub: sin endpoint de lectura en el backend,
// AGENT_CONTRACT §3 exige badge DEMO sobre ellos.
const DEMO_LITERALS = ["1,250", "89", "4", "98%"];

function textOf(el: Element): string {
  return el.textContent || "";
}

describe("PS-6 Content Hub: datos de demostracion con badge DEMO", () => {
  it("ningun literal de demostracion se renderiza fuera de un contenedor DEMO", () => {
    const { container } = render(<ContentPage />);
    const demo = Array.from(container.querySelectorAll('[data-demo="true"]'));
    expect(demo.length).toBeGreaterThan(0);
    demo.forEach((d) => expect(textOf(d)).toContain("DEMO"));

    // Quita el contenido de los contenedores DEMO y comprueba que no queda ningun literal.
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-demo="true"]').forEach((n) => n.remove());
    const rest = clone.textContent || "";
    DEMO_LITERALS.forEach((lit) => expect(rest).not.toContain(lit));
    // y los literales si estan dentro del contenedor DEMO
    const inside = demo.map(textOf).join(" ");
    DEMO_LITERALS.forEach((lit) => expect(inside).toContain(lit));
  });

  it("no consume la API: no hay endpoint de lectura, nada se presenta como dato del tenant", () => {
    const spy = jest.spyOn(global as any, "fetch").mockImplementation(() => Promise.reject(new Error("no")));
    render(<ContentPage />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
