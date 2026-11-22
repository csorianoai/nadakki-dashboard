import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "tenant-sesion" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: () => false,
}));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "T" } }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
}));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock("@/components/ui/NavigationBar", () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ success: jest.fn(), error: jest.fn() }),
}));

process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.prueba";

import SocialConnectionsClient from "@/app/marketing/social-connections/SocialConnectionsClient";
import IntegrationsPage from "@/app/marketing/integrations/page";

const resp = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

// El backend marca needs_refresh=true cuando al access token le quedan <30 min: no significa nada para el usuario.
const social = {
  platforms: {
    google: { connected: true, needs_refresh: true, user_email: "cuenta@baylara.com" },
    meta: { connected: true, needs_refresh: false },
  },
};

function mockFetch(googleStatus: any) {
  (global as any).fetch = jest.fn(async (url: any) => {
    const u = String(url);
    if (u.includes("/auth/google/status/")) return googleStatus;
    if (u.includes("/api/social/status/")) return resp(200, social);
    return resp(404, {});
  });
}

const casos: [string, any, RegExp, string | null][] = [
  ["connected", resp(200, { connection_status: "connected", user_email: "cuenta@baylara.com" }), /Conectado/, null],
  ["expired", resp(200, { connection_status: "expired" }), /La conexión venció/, "Reconectar Google Ads"],
  ["not_connected", resp(200, { connection_status: "not_connected" }), /Conectar Google Ads|No conectado/, "Conectar Google Ads"],
  ["unknown", resp(200, { connection_status: "unknown" }), /No pudimos comprobar la conexión/, null],
  ["valor raro / ausente", resp(200, { connected: true, needs_refresh: true }), /No pudimos comprobar la conexión/, null],
];

describe("social-connections: tarjeta de Google usa connection_status", () => {
  it.each(casos)("%s", async (_n, r, texto, boton) => {
    mockFetch(r);
    render(<SocialConnectionsClient />);
    const titulo = await screen.findByText("Google (Ads + Analytics)");
    const tarjeta = titulo.closest("#social-google") as HTMLElement;
    await waitFor(() => expect(within(tarjeta).getAllByText(texto).length).toBeGreaterThan(0));
    if (boton) expect(within(tarjeta).getByRole("button", { name: boton })).toBeTruthy();
    else expect(within(tarjeta).queryByRole("button", { name: /Reconectar|Conectar|Revisar/ })).toBeNull();
    expect(within(tarjeta).queryByText(/Requiere atención|Revisar conexión/)).toBeNull();
  });

  it("needs_refresh=true con connection_status=connected se ve Conectado, con correo", async () => {
    mockFetch(resp(200, { connection_status: "connected", user_email: "cuenta@baylara.com" }));
    render(<SocialConnectionsClient />);
    const titulo = await screen.findByText("Google (Ads + Analytics)");
    const tarjeta = titulo.closest("#social-google") as HTMLElement;
    await waitFor(() => expect(within(tarjeta).getByText(/Conectado/)).toBeTruthy());
    expect(within(tarjeta).getByText(/cuenta@baylara\.com/)).toBeTruthy();
    expect(within(tarjeta).queryByText(/Requiere atención/)).toBeNull();
  });
});

describe("integraciones: tarjeta de Google usa connection_status", () => {
  it.each(casos)("%s", async (_n, r, texto) => {
    mockFetch(r);
    render(<IntegrationsPage />);
    const titulo = await screen.findByText("Google");
    const tarjeta = titulo.closest("div")!.parentElement!.parentElement as HTMLElement;
    await waitFor(() => expect(within(tarjeta).getAllByText(texto).length).toBeGreaterThan(0));
    expect(within(tarjeta).queryByText(/Requiere atención|Revisar conexión/)).toBeNull();
  });

  it("needs_refresh=true con connection_status=connected se ve Conectado", async () => {
    mockFetch(resp(200, { connection_status: "connected" }));
    render(<IntegrationsPage />);
    const titulo = await screen.findByText("Google");
    const tarjeta = titulo.closest("div")!.parentElement!.parentElement as HTMLElement;
    await waitFor(() => expect(within(tarjeta).getAllByText(/Conectado/).length).toBeGreaterThan(0));
  });
});
