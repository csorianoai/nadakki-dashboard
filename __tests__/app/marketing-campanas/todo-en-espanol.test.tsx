/** C2-ASISTENTE-TODO-EN-ESPANOL: plantillas y segmentos del sistema, sin inglés ni ids crudos. */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...r }: any) => <a href={href} {...r}>{children}</a> }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/marketing/campaigns/new",
}));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "t-qa" }) }));

const plantillas = [
  { id: "convert-email", name: "Convert — EMAIL", type: "email", objective: "convert", source: "system", subject: "Hola", content: "Hola" },
  { id: "convert-sms", name: "Convert — SMS", type: "sms", objective: "convert", source: "system", content: "Hola" },
  { id: "recover-email", name: "Recover — EMAIL", type: "email", objective: "recover", source: "system", subject: "Hola", content: "Hola" },
  { id: "reactivate-email", name: "Reactivate — EMAIL", type: "email", objective: "reactivate", source: "system", subject: "Hola", content: "Hola" },
  { id: "onboard-email", name: "Onboard — EMAIL", type: "email", objective: "onboard", source: "system", subject: "Hola", content: "Hola" },
];
const segmentos = [
  { id: "new-customers", name: "Clientes nuevos", type: "behavioral", source: "system", size: 3 },
  { id: "seg-demo", name: "Por edad", type: "demographic", source: "system", size: 2 },
  { id: "seg-valor", name: "Los mejores", type: "value", source: "system", size: 1 },
];
jest.mock("@/lib/api/marketing", () => ({
  fetchMarketingTemplates: jest.fn(async () => ({ templates: plantillas, error: null })),
  fetchMarketingSegments: jest.fn(async () => ({ segments: segmentos, error: null })),
  createMarketingCampaign: jest.fn(),
  activateMarketingCampaign: jest.fn(),
  postMarketingLaunchPilot: jest.fn(),
}));

const PROHIBIDO = [
  "Convert", "Recover", "Reactivate", "Onboard", "EMAIL", "behavioral", "demographic", "value",
  "convert-email", "new-customers", "recover", "reactivate", "onboard",
];
const limpio = (t: string) => { for (const p of PROHIBIDO) expect(t).not.toMatch(new RegExp(`(^|[^\\p{L}-])${p}($|[^\\p{L}-])`, "u")); };

describe("asistente: todo en español con plantillas y segmentos del sistema", () => {
  it("pasos 1, 3 y 5 no muestran inglés ni ids crudos", async () => {
    const Page = require("@/app/marketing/campaigns/new/page").default;
    const { container } = render(<Page />);
    await waitFor(() => expect(screen.getByText("Convertir — Correo")).toBeInTheDocument());
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Mi campaña" } });
    expect(screen.getByText("Recuperar — Correo")).toBeInTheDocument();
    expect(screen.getByText("Reactivar — Correo")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Convertir — SMS"));
    fireEvent.click(screen.getByText("Convertir — Correo"));
    limpio(container.textContent || "");
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    fireEvent.click(screen.getByText("Clientes nuevos"));
    limpio(container.textContent || "");
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByRole("button", { name: /Enviar campaña/ })).toBeInTheDocument();
    limpio(container.textContent || "");
    expect(container.textContent).toContain("Convertir — Correo");
  });

  it("el fondo cubre todo el alto", async () => {
    const Page = require("@/app/marketing/campaigns/new/page").default;
    const { container } = render(<Page />);
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.className).toMatch(/min-h-screen/);
    expect(raiz.className).toMatch(/bg-\[#0a0f1c\]/);
    expect(raiz.className).not.toMatch(/shrink-0/);
  });
});
