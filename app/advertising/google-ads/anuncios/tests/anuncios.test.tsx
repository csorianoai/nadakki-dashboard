import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: "tenant-sesion" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({ refreshAccessToken: jest.fn(async () => false), isTokenExpiringSoon: () => false }));
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "TOKEN" } }));
jest.mock("@/lib/auth/jwt-decode", () => ({ decodeJWT: () => ({ sub: "usuario-7", roles: [{ role_key: "marketing_user" }] }) }));

import AnunciosClient from "../AnunciosClient";

const resp = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const cuenta = { customer_id: "1234567890", name: "Cuenta Uno", currency_code: "USD", manager: false, readable: true };
const borrador = (o: Record<string, unknown>) => ({
  id: "d1", external_ref: "ref-1", customer_id: "1234567890", status: "draft",
  brief: { name: "Casas Miami", daily_budget: 20 }, plan: { headlines: [], descriptions: [], keywords: [] }, ...o,
});
let fetchMock: jest.Mock;
let lista: unknown[];
beforeEach(() => {
  lista = [];
  fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/google-ads/accounts")) return resp(200, { success: true, data: { accounts: [cuenta] } });
    if (u.endsWith("/ad-drafts") && init?.method === "POST") return resp(201, { success: true, data: borrador({}) });
    if (u.includes("/ad-drafts")) return resp(200, { success: true, data: lista });
    return resp(404, {});
  });
  (global as any).fetch = fetchMock;
});

describe("anuncios de Google Ads (parte 1/3)", () => {
  it("estado vacío honesto", async () => {
    render(<AnunciosClient />);
    expect(await screen.findByText("Todavía no hay borradores de anuncios.")).toBeTruthy();
  });

  it("lista borradores con el estado en español", async () => {
    lista = [borrador({ status: "submitted" }), borrador({ id: "d2", status: "publish_failed", brief: { name: "Otro" } })];
    render(<AnunciosClient />);
    expect(await screen.findByText("En revisión")).toBeTruthy();
    expect(screen.getByText("Falló la publicación")).toBeTruthy();
    expect(screen.getByText("Casas Miami")).toBeTruthy();
  });

  it("crear manda brief y plan con los nombres del backend", async () => {
    render(<AnunciosClient />);
    await screen.findByText("Todavía no hay borradores de anuncios.");
    await screen.findByRole("option", { name: /Cuenta Uno/ });
    fireEvent.change(screen.getByLabelText("Cuenta de Google Ads"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Casas Miami" } });
    fireEvent.change(screen.getByLabelText("Página de destino (https://)"), { target: { value: "https://ejemplo.com" } });
    fireEvent.change(screen.getByLabelText("Presupuesto diario"), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText("Títulos (uno por línea, máx. 30 caracteres)"), { target: { value: "a\nb\nc" } });
    fireEvent.change(screen.getByLabelText("Descripciones (una por línea, máx. 90 caracteres)"), { target: { value: "d1\nd2" } });
    fireEvent.change(screen.getByLabelText("Palabras clave (una por línea)"), { target: { value: "casas miami" } });
    fireEvent.change(screen.getByLabelText("Concordancia"), { target: { value: "PHRASE" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => c[1]?.method === "POST")).toBe(true));
    const post = fetchMock.mock.calls.find((c) => c[1]?.method === "POST")!;
    expect(String(post[0])).toContain("/api/v1/tenants/tenant-sesion/google-ads/ad-drafts");
    const body = JSON.parse(post[1].body);
    expect(typeof body.external_ref).toBe("string");
    expect(body.brief).toMatchObject({ customer_id: "1234567890", final_url: "https://ejemplo.com", daily_budget: 20, name: "Casas Miami" });
    expect(body.plan).toEqual({
      headlines: ["a", "b", "c"], descriptions: ["d1", "d2"], keywords: [{ text: "casas miami", match_type: "PHRASE" }],
    });
  });

  it("muestra contadores de caracteres", async () => {
    render(<AnunciosClient />);
    fireEvent.change(await screen.findByLabelText("Títulos (uno por línea, máx. 30 caracteres)"), { target: { value: "hola\nx" } });
    expect(screen.getByText("2 de 3 a 15 títulos · más largo: 4/30")).toBeTruthy();
  });
});
