/**
 * @jest-environment node
 *
 * DASH-LEGAL (L1): en ejecucion, los clientes Legal envian el JWT de la sesion
 * y los cuerpos que el backend valida con extra="forbid" salen con sus campos.
 */
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => "tok-l1" },
}));
jest.mock("@/lib/auth/token-refresh", () => ({
  isTokenExpiringSoon: () => false,
  refreshAccessToken: async () => false,
}));

import { legalApiClient } from "@/lib/api/legal";
import { legalApi } from "@/lib/legal-api";
import { fetchLibrarySearch } from "@/lib/legal/library-api";
import {
  patchDocumentLifecycle,
  postCaseAction,
  postDeadlineOverride,
  postSnapshot,
} from "@/lib/legal/cases/legal-cases-api";

type Call = { url: string; auth: string | null; body: Record<string, unknown> | null };
let calls: Call[] = [];

beforeEach(() => {
  calls = [];
  global.fetch = jest.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(url),
      auth: headers.get("Authorization"),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    });
    return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
});

const last = () => calls[calls.length - 1];

describe("DASH-LEGAL: Bearer y cuerpos compatibles con el backend", () => {
  it("cada cliente Legal envia Authorization: Bearer", async () => {
    await legalApiClient.runAgent("t1", "chat_asesor_legal", { mensaje: "hola" });
    await legalApi.quickCheck({ tipo_solicitud: "x", texto: "y", jurisdiccion: "do" } as never, "t1");
    await fetchLibrarySearch("t1", "cobro de pesos");
    await postCaseAction("t1", "c1", "add_actor", {});
    expect(calls.map((c) => [c.url, c.auth])).toEqual([
      ["/api/legal/agents/chat_asesor_legal/run", "Bearer tok-l1"],
      ["/api/v1/legal/quick-check", "Bearer tok-l1"],
      ["/api/legal/library/search?q=cobro+de+pesos", "Bearer tok-l1"],
      ["/api/legal/cases/c1/actions", "Bearer tok-l1"],
    ]);
  });

  it("executeTask: task_id en el body y sin tenant_id (extra=forbid)", async () => {
    await legalApiClient.executeTask("t1", "review_contract", { inputs: { texto: "x" } });
    expect(last().body).toEqual({ inputs: { texto: "x" }, task_id: "review_contract" });
  });

  it("/actions conserva actor_type 'human' (el unico tolerado por identidad_del_jwt)", async () => {
    await postCaseAction("t1", "c1", "add_actor", {});
    expect(last().body).toEqual({ action: "add_actor", actor_type: "human", payload: {} });
  });

  it("override de plazo usa override_deadline_date", async () => {
    await postDeadlineOverride("t1", "c1", "d1", {
      new_deadline_date: "2026-11-01",
      reason: "motivo valido",
      legal_basis: "base legal",
    });
    expect(last().body).toEqual({
      override_deadline_date: "2026-11-01",
      reason: "motivo valido",
      legal_basis: "base legal",
    });
  });

  it("lifecycle lleva actor_type 'human' y acuse_recibo", async () => {
    await patchDocumentLifecycle("t1", "c1", "doc1", {
      new_status: "submitted_to_court",
      submitted_to_court_acuse: "ACUSE-1",
    });
    expect(last().body).toEqual({
      new_status: "submitted_to_court",
      actor_type: "human",
      acuse_recibo: "ACUSE-1",
    });
  });

  it("snapshot envia reason", async () => {
    await postSnapshot("t1", "c1", { snapshot_reason: "manual", notes: "Version manual" });
    expect(last().body).toEqual({ reason: "manual" });
  });
});
