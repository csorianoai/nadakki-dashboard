import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

let roles: Array<{ role_key: string }> = [{ role_key: "tenant_admin" }];
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "tenant-sesion" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: () => false }));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "TOKEN" } }));
jest.mock("@/lib/auth/jwt-decode", () => ({ decodeJWT: () => ({ sub: "usuario-7", roles }) }));

import AnunciosClient from "../AnunciosClient";

const resp = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const borrador = (o: Record<string, unknown>) => ({
  id: "d1", external_ref: "ref-1", customer_id: "1234567890", status: "approved",
  brief: { name: "Casas Miami", daily_budget: 20 }, plan: { headlines: [], descriptions: [], keywords: [] }, ...o,
});
let fetchMock: jest.Mock;
let lista: unknown[];
let publicar: () => unknown;
beforeEach(() => {
  roles = [{ role_key: "tenant_admin" }];
  lista = [];
  publicar = () => resp(200, { success: true, data: borrador({ status: "published" }) });
  fetchMock = jest.fn(async (url: string) => {
    const u = String(url);
    if (u.includes("/google-ads/accounts")) return resp(200, { success: true, data: { accounts: [] } });
    if (u.endsWith("/publish")) return publicar();
    if (u.includes("/ad-drafts")) return resp(200, { success: true, data: lista });
    return resp(404, {});
  });
  (global as any).fetch = fetchMock;
});
const llamadas = () => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith("/ad-drafts/d1/publish") && c[1]?.method === "POST");

describe("anuncios de Google Ads (parte 3/3)", () => {
  it("Publicar solo aparece en aprobados y avisa que queda en pausa", async () => {
    lista = [borrador({ id: "d0", status: "submitted" }), borrador({ id: "d3", status: "draft" }), borrador({})];
    render(<AnunciosClient />);
    await screen.findAllByText("Casas Miami");
    expect(screen.getAllByRole("button", { name: "Publicar en Google (en pausa)" })).toHaveLength(1);
    expect(screen.getByText(/queda PAUSADA/)).toBeTruthy();
    expect(screen.getByText(/Google Ads/, { selector: "p" })).toBeTruthy();
  });

  it("sin rol aprobador no hay Publicar", async () => {
    roles = [{ role_key: "marketing_user" }];
    lista = [borrador({})];
    render(<AnunciosClient />);
    await screen.findByText("Casas Miami");
    expect(screen.queryByRole("button", { name: /Publicar/ })).toBeNull();
  });

  it("publicar llama al endpoint y confirma", async () => {
    lista = [borrador({})];
    render(<AnunciosClient />);
    fireEvent.click(await screen.findByRole("button", { name: "Publicar en Google (en pausa)" }));
    await waitFor(() => expect(llamadas()).toHaveLength(1));
    expect(await screen.findByText(/en pausa/i, { selector: "[role=status]" })).toBeTruthy();
  });

  it.each([
    [503, { detail: { code: "publicacion_desactivada" } }, /publicación está desactivada/],
    [409, { detail: { code: "google_not_connected" } }, /Conecta tu cuenta de Google/],
    [502, { detail: { code: "google_ads_publish_failed", message: "x" } }, /Google rechazó la publicación/],
  ])("muestra en español el error %s", async (status, body, texto) => {
    publicar = () => resp(status as number, body);
    lista = [borrador({})];
    render(<AnunciosClient />);
    fireEvent.click(await screen.findByRole("button", { name: "Publicar en Google (en pausa)" }));
    expect(await screen.findByText(texto)).toBeTruthy();
  });

  it("un borrador publish_failed se muestra en español y permite reintentar", async () => {
    lista = [borrador({ status: "publish_failed" })];
    render(<AnunciosClient />);
    expect(await screen.findByText("Falló la publicación")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publicar en Google (en pausa)" })).toBeTruthy();
  });
});
