/**
 * /admin/config guarda con apiFetch: el backend (#2667) exige sesion y tenant propio en PATCH /api/v1/tenants/{id}/config.
 * Antes la pantalla usaba fetch plano con solo X-Tenant-ID (la ruta estaba abierta); con el cierre daria 401 al guardar.
 */
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: jest.fn() }));
jest.mock("@/components/ui/NavigationBar", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <nav>{children}</nav>,
}));
jest.mock("@/components/ui/GlassCard", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminConfigPage from "@/app/admin/config/page";
import { useTenant } from "@/contexts/TenantContext";

const apiFetchMock = () => jest.requireMock("@/lib/api/fetch-client").apiFetch as jest.Mock;
const resp = (cuerpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(cuerpo) } as Response);

beforeEach(() => {
  apiFetchMock().mockReset();
  apiFetchMock().mockImplementation(() => resp({}));
  (useTenant as jest.Mock).mockReturnValue({ tenantId: "t-1" });
  // Las lecturas globales (/api/v1/config y /api/v1/social/status) no se tocaron en este cambio y siguen con fetch plano.
  global.fetch = jest.fn((url: string) => {
    if (String(url).includes("/api/v1/tenants/")) throw new Error("la ruta de tenant no debe ir con fetch plano");
    return resp({});
  }) as unknown as typeof fetch;
});

describe("pagina /admin/config", () => {
  it("Guardar manda el PATCH de la config del tenant con apiFetch (Bearer), no con fetch plano", async () => {
    render(<AdminConfigPage />);
    fireEvent.click(await screen.findByText("Guardar"));
    await waitFor(() => expect(apiFetchMock()).toHaveBeenCalled());
    const [url, init] = apiFetchMock().mock.calls[0];
    expect(url).toBe("/api/v1/tenants/t-1/config");
    expect(init.method).toBe("PATCH");
    expect(typeof init.body).toBe("string");
    const planas = (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
    expect(planas.some((u) => u.includes("/api/v1/tenants/"))).toBe(false);
  });
});
