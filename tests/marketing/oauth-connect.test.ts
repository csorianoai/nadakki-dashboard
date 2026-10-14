/**
 * /auth/{google,meta}/connect/{tenant} exige sesión desde 2026-10-12 y devuelve {authorization_url}:
 * el dashboard la pide con el JWT y solo abre URLs de Google o Facebook.
 */
import { tokenStorage } from "@/lib/auth/token-storage";
import { disconnectPlatform, startOAuthConnect } from "@/lib/api/marketing";

const okJson = (body: unknown, status = 200) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe("startOAuthConnect", () => {
  let fetchMock: jest.Mock;
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(tokenStorage, "getAccessToken").mockReturnValue("jwt-de-prueba");
  });
  afterEach(() => jest.restoreAllMocks());

  it("envía el JWT y devuelve la URL de Google", async () => {
    fetchMock.mockReturnValue(okJson({ authorization_url: "https://accounts.google.com/o/oauth2/v2/auth?state=x" }));
    const r = await startOAuthConnect("google", "mapaal");
    expect(r).toEqual({ url: "https://accounts.google.com/o/oauth2/v2/auth?state=x", error: null });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/google\/connect\/mapaal$/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-de-prueba");
  });

  it("acepta la URL de Facebook", async () => {
    fetchMock.mockReturnValue(okJson({ authorization_url: "https://www.facebook.com/v18.0/dialog/oauth?state=y" }));
    expect((await startOAuthConnect("meta", "t1")).url).toMatch(/^https:\/\/www\.facebook\.com\//);
  });

  it("negativo: 401/403 no abre nada", async () => {
    for (const status of [401, 403]) {
      fetchMock.mockReturnValueOnce(okJson({ detail: "tenant_mismatch" }, status));
      expect(await startOAuthConnect("google", "otro")).toEqual({ url: null, error: `HTTP ${status}` });
    }
  });

  it("negativo: descarta una URL que no es de Google ni de Facebook", async () => {
    fetchMock.mockReturnValue(okJson({ authorization_url: "https://evil.example/phish" }));
    expect(await startOAuthConnect("google", "t1")).toEqual({ url: null, error: "invalid_authorization_url" });
  });

  it("disconnect también lleva el JWT", async () => {
    fetchMock.mockReturnValue(okJson({}));
    await disconnectPlatform("meta", "t1");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("DELETE");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-de-prueba");
  });
});
