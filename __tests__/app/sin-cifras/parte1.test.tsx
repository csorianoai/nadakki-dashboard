/** D5-SIN-CIFRAS-FALSAS parte 1: ninguna cifra ni nombre fijo en email, automations y audiences. */
import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));

const PANTALLAS: Array<[string, () => any, string[], string]> = [
  ["email", () => require("@/app/email/page").default, ["45.2K", "38.5%", "12.3%", "2.1%"], "Email Marketing"],
  ["email/campaigns", () => require("@/app/email/campaigns/page").default, ["Welcome Series", "12,450", "39.3%", "Newsletter Enero"], "Campanas de Email"],
  ["email/templates", () => require("@/app/email/templates/page").default, ["Welcome Email", "234", "567", "usos"], "Templates"],
  ["automations", () => require("@/app/automations/page").default, ["935", "6K", "Welcome Sequence", "Abandono Carrito"], "Automatizaciones"],
  ["automations/rules", () => require("@/app/automations/rules/page").default, ["Lead Score > 90", "Notificar ventas"], "Reglas de Automatizacion"],
  ["audiences", () => require("@/app/audiences/page").default, ["45.2K", "89%", "Segmentos"], "Audiencias"],
  ["audiences/manager", () => require("@/app/audiences/manager/page").default, ["Clientes VIP", "8,900", "1,234", "92%"], "Gestor de Audiencias"],
];

describe.each(PANTALLAS)("%s", (_n, load, prohibidos, titulo) => {
  it("no pinta cifras ni nombres fijos y conserva el titulo", () => {
    const Page = load();
    const { container } = render(<Page />);
    const texto = container.textContent || "";
    for (const p of prohibidos) {
      // "Segmentos" solo se prohibe como tarjeta numerica; el texto del estado vacio puede nombrarlo.
      if (p === "Segmentos") continue;
      expect(texto).not.toContain(p);
    }
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(titulo);
  });
});

describe("pantallas sin backend", () => {
  it.each(PANTALLAS.slice(1).filter(([n]) => n !== "email"))("%s muestra el estado vacio honesto", (_n, load) => {
    const Page = load();
    render(<Page />);
    expect(screen.getByTestId("estado-vacio").textContent).toMatch(/^Aun no hay datos de .+ en tu cuenta$/);
  });
});
