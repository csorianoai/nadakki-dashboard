import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

let roles: Array<{ role_key: string }> = [{ role_key: "marketing_user" }];
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "tenant-sesion" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: () => false }));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "TOKEN" } }));
jest.mock("@/lib/auth/jwt-decode", () => ({ decodeJWT: () => ({ sub: "usuario-7", roles }) }));

import AnunciosClient from "../AnunciosClient";

const resp = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const borrador = (o: Record<string, unknown>) => ({
  id: "d1", external_ref: "ref-1", customer_id: "1234567890", status: "draft",
  brief: { name: "Casas Miami", daily_budget: 20 }, plan: { headlines: [], descriptions: [], keywords: [] }, ...o,
});
let fetchMock: jest.Mock;
let lista: unknown[];
const BLOQUEO = "El anuncio menciona una clase protegida por la ley de vivienda justa.";
beforeEach(() => {
  roles = [{ role_key: "marketing_user" }];
  lista = [];
  fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/google-ads/accounts")) return resp(200, { success: true, data: { accounts: [] } });
    if (u.endsWith("/submit")) return resp(200, { success: true, data: { draft: borrador({}), blocks: [{ code: "vivienda_justa", message: BLOQUEO }], submitted: false } });
    if (u.endsWith("/approve")) return resp(200, { success: true, data: borrador({ status: "approved" }) });
    if (u.endsWith("/reject")) return resp(200, { success: true, data: borrador({ status: "rejected" }) });
    if (u.includes("/ad-drafts")) return resp(200, { success: true, data: lista });
    return resp(404, {});
  });
  (global as any).fetch = fetchMock;
});
const llamadas = (fin: string) => fetchMock.mock.calls.filter((c) => String(c[0]).endsWith(fin) && c[1]?.method === "POST");

describe("anuncios de Google Ads (parte 2/3)", () => {
  it("enviar a revisión muestra los bloqueos tal cual", async () => {
    lista = [borrador({})];
    render(<AnunciosClient />);
    fireEvent.click(await screen.findByRole("button", { name: "Enviar a revisión" }));
    expect(await screen.findByText(BLOQUEO)).toBeTruthy();
    expect(llamadas("/ad-drafts/d1/submit")).toHaveLength(1);
  });

  it("un usuario sin rol aprobador no ve Aprobar ni Rechazar ni Publicar", async () => {
    lista = [borrador({ status: "submitted" }), borrador({ id: "d2", status: "approved" })];
    render(<AnunciosClient />);
    await screen.findAllByText("Casas Miami");
    expect(screen.queryByRole("button", { name: "Aprobar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Publicar/ })).toBeNull();
  });

  it("tenant_admin aprueba un borrador en revisión", async () => {
    roles = [{ role_key: "tenant_admin" }];
    lista = [borrador({ status: "submitted" })];
    render(<AnunciosClient />);
    fireEvent.click(await screen.findByRole("button", { name: "Aprobar" }));
    await waitFor(() => expect(llamadas("/ad-drafts/d1/approve")).toHaveLength(1));
  });

  it("rechazar exige motivo y lo envía", async () => {
    roles = [{ role_key: "platform_admin" }];
    lista = [borrador({ status: "submitted" })];
    render(<AnunciosClient />);
    fireEvent.click(await screen.findByRole("button", { name: "Rechazar" }));
    const enviar = screen.getByRole("button", { name: "Confirmar rechazo" });
    expect((enviar as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Motivo del rechazo"), { target: { value: "Falta la URL final" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar rechazo" }));
    await waitFor(() => expect(llamadas("/ad-drafts/d1/reject")).toHaveLength(1));
    expect(JSON.parse(llamadas("/ad-drafts/d1/reject")[0][1].body)).toEqual({ reason: "Falta la URL final" });
  });

  it("Aprobar y Rechazar solo aparecen en borradores en revisión", async () => {
    roles = [{ role_key: "tenant_admin" }];
    lista = [borrador({ status: "draft" })];
    render(<AnunciosClient />);
    await screen.findByText("Casas Miami");
    expect(screen.queryByRole("button", { name: "Aprobar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Enviar a revisión" })).toBeTruthy();
  });
});
