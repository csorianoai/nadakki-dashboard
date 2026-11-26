import { enviarMensaje } from "@/lib/agents/contable/asistente-client";
jest.mock("@/lib/auth/token-storage", () => ({ tokenStorage: { getAccessToken: () => "jwt-prueba" } }));
jest.mock("@/lib/auth/token-refresh", () => ({ isTokenExpiringSoon: () => false, refreshAccessToken: jest.fn() }));
it("envia el JWT al endpoint IA usando apiFetch real", async () => {
  const originalFetch = global.fetch;
  const request = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ response: "Hola", links: [], modo: "ia", read_only: true }) });
  global.fetch = request;
  try {
    await enviarMensaje("hola");
    expect(request.mock.calls[0][0]).toBe("/api/assistant/contable/ia/chat");
    expect(request.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer jwt-prueba");
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ message: "hola" });
  } finally { global.fetch = originalFetch; }
});
