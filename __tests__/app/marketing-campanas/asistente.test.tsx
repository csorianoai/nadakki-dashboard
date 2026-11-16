/** D6-CAMPANAS-ENCAUZAR: el asistente de campañas de correo y mensajes, en español llano. */
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
  { id: "tpl1", name: "Oferta", type: "email", objective: "convert", source: "system", subject: "{emoji} {key_message}", content: "{emoji} {key_message} - Limited Time Offer" },
];
const segmentos = [
  { id: "seg0", name: "Clientes nuevos", type: "dynamic", source: "system", size: 0 },
  { id: "seg5", name: "Clientes activos", type: "dynamic", source: "tenant", persisted: true, size: 5 },
];
jest.mock("@/lib/api/marketing", () => ({
  fetchMarketingTemplates: jest.fn(async () => ({ templates: plantillas, error: null })),
  fetchMarketingSegments: jest.fn(async () => ({ segments: segmentos, error: null })),
  createMarketingCampaign: jest.fn(),
  activateMarketingCampaign: jest.fn(),
  postMarketingLaunchPilot: jest.fn(),
}));

const INGLES = [
  "Compose", "Schedule", "Target", "Assign", "Review", "Next", "Launch Campaign", "Send Immediately",
  "Campaign Details", "Campaign Name", "Objective", "Channel", "Template", "Preview", "Save as Draft", "Save Draft",
  "audience size", "Estimated Reach", "Made a Purchase", "Upgraded Plan", "Completed Signup", "Referred a Friend",
  "Left a Review", "Conversion Window", "Schedule for Later", "Action-Based", "Recurring", "Limited Time Offer",
  "Loading", "No templates", "Select a template", "Push Notification", "In-App Message",
];

async function cargar() {
  const Page = require("@/app/marketing/campaigns/new/page").default;
  const r = render(<Page />);
  await waitFor(() => expect(screen.getByText("Oferta")).toBeInTheDocument());
  return r;
}
const sinIngles = (texto: string) => { for (const p of INGLES) expect(texto).not.toContain(p); };

describe("asistente de campaña de correo y mensajes", () => {
  it("se titula 'Campaña de correo y mensajes' y enlaza a Google Ads", async () => {
    const { container } = await cargar();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Campaña de correo y mensajes");
    const enlace = screen.getByRole("link", { name: /Publicidad > Google Ads/ });
    expect(enlace.getAttribute("href")).toBe("/advertising/google-ads");
    expect(container.textContent).toContain("Para anunciar en Google usa");
  });

  it("el listado de campañas usa el mismo nombre", () => {
    jest.doMock("@/hooks/useMarketingCampaigns", () => ({
      useMarketingCampaigns: () => ({ campaigns: [], total: 0, loading: false, error: null, source: "api", refresh: jest.fn() }),
    }));
    jest.doMock("@/components/ui/NavigationBar", () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
    const Lista = require("@/app/marketing/campaigns/page").default;
    const { container } = render(<Lista />);
    expect(container.textContent).toContain("Campaña de correo y mensajes");
    expect(container.textContent).not.toContain("Campaigns");
  });

  it("los cinco pasos no muestran la lista de textos en inglés", async () => {
    const { container } = await cargar();
    for (let paso = 1; paso <= 5; paso++) {
      if (paso === 1) fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Mi campaña" } });
      if (paso === 1) fireEvent.click(screen.getByText("Oferta"));
      if (paso === 3) fireEvent.click(screen.getByText("Clientes activos"));
      sinIngles(container.textContent || "");
      if (paso < 5) fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    }
    expect(screen.getByRole("button", { name: /Enviar campaña/ })).toBeInTheDocument();
  });

  it("la vista previa nunca muestra llaves de variable", async () => {
    await cargar();
    fireEvent.click(screen.getByText("Oferta"));
    const previa = screen.getByTestId("vista-previa");
    expect(previa.textContent).not.toMatch(/[{}]/);
    expect(previa.textContent).toContain("Ejemplo");
  });

  it("con audiencia 0 avisa y el botón final muestra el alcance", async () => {
    const { container } = await cargar();
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Mi campaña" } });
    fireEvent.click(screen.getByText("Oferta"));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(container.textContent).toContain("Aún no tienes contactos en este segmento");
    fireEvent.click(screen.getByText("Clientes nuevos"));
    expect(screen.getByTestId("aviso-audiencia-cero").textContent).toContain("Aún no tienes contactos en este segmento");
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByRole("button", { name: /Enviar campaña a 0 personas/ })).toBeInTheDocument();
    expect(screen.getByTestId("aviso-audiencia-cero")).toBeInTheDocument();
  });

  it("deja margen inferior para que el botón flotante no tape 'Siguiente'", async () => {
    const { container } = await cargar();
    expect(container.querySelector('[data-testid="margen-copiloto"]')).not.toBeNull();
  });
});
