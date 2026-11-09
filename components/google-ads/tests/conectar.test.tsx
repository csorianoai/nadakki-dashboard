import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "tenant-sesion" }),
}));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: () => false,
}));
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => "TOKEN-DE-PRUEBA" },
}));

import ConectarGoogleAds from "@/components/google-ads/ConectarGoogleAds";

const resp = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

let fetchMock: jest.Mock;
let assign: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn();
  (global as any).fetch = fetchMock;
  assign = jest.fn();
});

const casos: [string, any, RegExp, string | null][] = [
  ["connected", resp(200, { connected: true, connection_status: "connected" }), /Conectado/, null],
  ["expired", resp(200, { connection_status: "expired" }), /venci/, "Reconectar"],
  ["not_connected", resp(200, { connection_status: "not_connected" }), /^Conectar Google Ads$/, "Conectar Google Ads"],
  ["unknown", resp(200, { connection_status: "unknown" }), /No pudimos comprobar/, null],
  ["valor raro", resp(200, { connection_status: "activo" }), /No pudimos comprobar/, null],
  ["cuerpo raro", resp(200, "texto"), /No pudimos comprobar/, null],
  ["solo connected=true sin connection_status", resp(200, { connected: true, scope: "adwords" }), /No pudimos comprobar/, null],
  ["500", resp(500, {}), /No pudimos comprobar/, null],
];

describe("estado de la conexion", () => {
  it.each(casos)("%s", async (_n, r, texto, boton) => {
    fetchMock.mockResolvedValue(r);
    render(<ConectarGoogleAds navegar={assign} />);
    expect(await screen.findByText(texto)).toBeTruthy();
    if (boton) expect(screen.getByRole("button", { name: boton })).toBeTruthy();
    else expect(screen.queryByRole("button")).toBeNull();
    if (boton === "Reconectar") expect(screen.getByRole("button", { name: "Reconectar" })).toBeTruthy();
    else expect(screen.queryByRole("button", { name: "Reconectar" })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/auth/google/status/tenant-sesion");
    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer TOKEN-DE-PRUEBA");
  });

  it("fallo de red -> unknown sin Reconectar", async () => {
    fetchMock.mockRejectedValue(new Error("red"));
    render(<ConectarGoogleAds navegar={assign} />);
    expect(await screen.findByText(/No pudimos comprobar/)).toBeTruthy();
    expect(screen.queryByText("Reconectar")).toBeNull();
  });
});

describe("clic en conectar", () => {
  it("pide authorization_url con Authorization y la abre", async () => {
    fetchMock
      .mockResolvedValueOnce(resp(200, { connection_status: "not_connected" }))
      .mockResolvedValueOnce(resp(200, { authorization_url: "https://accounts.google.com/o/oauth2/x" }));
    render(<ConectarGoogleAds navegar={assign} />);
    fireEvent.click(await screen.findByRole("button", { name: "Conectar Google Ads" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://accounts.google.com/o/oauth2/x"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/auth/google/connect/tenant-sesion");
    expect(init.headers.get("Authorization")).toBe("Bearer TOKEN-DE-PRUEBA");
  });

  it("error 500 -> mensaje llano y no abre nada", async () => {
    fetchMock
      .mockResolvedValueOnce(resp(200, { connection_status: "expired" }))
      .mockResolvedValueOnce(resp(500, { detail: "boom" }));
    render(<ConectarGoogleAds navegar={assign} />);
    fireEvent.click(await screen.findByRole("button", { name: "Reconectar" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });

  it("no imprime ni guarda el token", async () => {
    const logs = [jest.spyOn(console, "log"), jest.spyOn(console, "error"), jest.spyOn(console, "warn")];
    fetchMock
      .mockResolvedValueOnce(resp(200, { connection_status: "not_connected" }))
      .mockResolvedValueOnce(resp(500, {}));
    const { container } = render(<ConectarGoogleAds navegar={assign} />);
    fireEvent.click(await screen.findByRole("button", { name: "Conectar Google Ads" }));
    await screen.findByRole("alert");
    const todo = JSON.stringify(logs.map((l) => l.mock.calls)) + container.innerHTML;
    expect(todo).not.toContain("TOKEN-DE-PRUEBA");
    expect(JSON.stringify({ ...localStorage })).not.toContain("TOKEN-DE-PRUEBA");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("TOKEN-DE-PRUEBA");
    logs.forEach((l) => l.mockRestore());
  });
});
