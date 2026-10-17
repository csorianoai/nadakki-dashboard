/**
 * DB-CODEX-12B (d): el logout real (AuthProvider) llama a DELETE /applications/{id}/draft con el bearer
 * antes de quitar los tokens, y no deja punteros en sessionStorage.
 *
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";

jest.mock("@/lib/config/backend-url", () => ({ resolveBackendUrl: () => "https://backend.test" }));

import { AuthContext, AuthProvider } from "@/lib/auth/auth-context";
import { tokenStorage } from "@/lib/auth/token-storage";
import { buildWizardDraftPointerKey, writeWizardDraftPointer } from "@/lib/credit-hub/dealer/wizard-draft-storage";

const APP_ID = "app-draft-0002";
const TENANT = "tenant-test-2";

function BotonDeSalida() {
  const ctx = useContext(AuthContext);
  return <button onClick={() => void ctx?.logout()}>salir</button>;
}

function mockFetch(draftDeleteStatus: number) {
  const calls: Array<{ url: string; method: string; auth: string | null }> = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ url, method: init?.method ?? "GET", auth: headers.Authorization ?? null });
    if (url.includes("/draft")) {
      return { ok: draftDeleteStatus < 400, status: draftDeleteStatus, statusText: "", clone() { return this; }, json: async () => ({}), text: async () => "" };
    }
    return { ok: false, status: 401, statusText: "Unauthorized", text: async () => "", json: async () => ({}) };
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  tokenStorage.clearTokens();
});

test("logout llama al DELETE del borrador con el bearer y limpia el puntero", async () => {
  const calls = mockFetch(204);
  tokenStorage.setTokens({ accessToken: "token-de-prueba", refreshToken: "refresh-de-prueba" });
  const pointerKey = buildWizardDraftPointerKey(TENANT, "user-test-2");
  writeWizardDraftPointer(pointerKey, { tenantId: TENANT, applicationId: APP_ID });
  render(
    <AuthProvider>
      <BotonDeSalida />
    </AuthProvider>,
  );
  screen.getByText("salir").click();
  await waitFor(() => expect(sessionStorage.getItem(pointerKey)).toBeNull());
  const del = calls.find((c) => c.method === "DELETE" && c.url.endsWith(`/applications/${APP_ID}/draft`));
  expect(del).toBeDefined();
  expect(del?.auth).toBe("Bearer token-de-prueba");
});

test("si el DELETE falla, el logout igual limpia punteros y tokens", async () => {
  const calls = mockFetch(500);
  tokenStorage.setTokens({ accessToken: "token-de-prueba", refreshToken: "refresh-de-prueba" });
  const pointerKey = buildWizardDraftPointerKey(TENANT, "user-test-2");
  writeWizardDraftPointer(pointerKey, { tenantId: TENANT, applicationId: APP_ID });
  render(
    <AuthProvider>
      <BotonDeSalida />
    </AuthProvider>,
  );
  screen.getByText("salir").click();
  await waitFor(() => expect(tokenStorage.getAccessToken()).toBeNull());
  expect(sessionStorage.getItem(pointerKey)).toBeNull();
  expect(calls.some((c) => c.method === "DELETE")).toBe(true);
});
