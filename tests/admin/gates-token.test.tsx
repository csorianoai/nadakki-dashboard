/**
 * /admin/gates manda el token: el backend exige platform_superadmin en GET /api/v1/gates (401 sin token, 403 con otro rol).
 * Antes la pantalla usaba fetch plano, sin Authorization, y con la guarda mostraria «HTTP 401» siempre (aprobar y rechazar ya
 * daban 401 por la misma causa). Ahora usa apiFetch (Bearer y renovacion) y traduce 401/403 a mensajes claros.
 */
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/components/ui/NavigationBar", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <nav>{children}</nav>,
}));
jest.mock("@/components/ui/GlassCard", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminGatesPage from "@/app/admin/gates/page";

const resp = (cuerpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(cuerpo) } as Response);

const apiFetchMock = () => jest.requireMock("@/lib/api/fetch-client").apiFetch as jest.Mock;
const GATES = { gates: [{ id: "gate-a", name: "Seguridad", description: "d", status: "PENDING" }] };

beforeEach(() => {
  apiFetchMock().mockReset();
  global.fetch = jest.fn(() => {
    throw new Error("la pantalla no debe usar fetch plano (sin Authorization)");
  }) as unknown as typeof fetch;
});

describe("página /admin/gates", () => {
  it("lee la lista con apiFetch (que manda el Bearer), no con fetch plano", async () => {
    apiFetchMock().mockImplementation(() => resp(GATES));
    render(<AdminGatesPage />);
    expect(await screen.findByText("Seguridad")).toBeInTheDocument();
    expect(apiFetchMock()).toHaveBeenCalledWith("/api/v1/gates");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("403 muestra que es solo para superadministradores de plataforma", async () => {
    apiFetchMock().mockImplementation(() => resp({ detail: "forbidden" }, 403));
    render(<AdminGatesPage />);
    expect(await screen.findByText(/solo para superadministradores de plataforma/i)).toBeInTheDocument();
    expect(screen.queryByText(/HTTP 403/)).not.toBeInTheDocument();
  });

  it("401 muestra sesión caducada, sin romper la página", async () => {
    apiFetchMock().mockImplementation(() => resp({ detail: "unauthorized" }, 401));
    render(<AdminGatesPage />);
    expect(await screen.findByText(/sesión ha caducado/i)).toBeInTheDocument();
    expect(screen.getByText("Gates de Configuración")).toBeInTheDocument();
  });

  it("otros errores siguen mostrando el código HTTP", async () => {
    apiFetchMock().mockImplementation(() => resp({}, 503));
    render(<AdminGatesPage />);
    expect(await screen.findByText(/HTTP 503/)).toBeInTheDocument();
  });

  it("aprobar usa apiFetch con POST y vuelve a leer la lista", async () => {
    apiFetchMock().mockImplementation((ruta: string, init?: RequestInit) =>
      init?.method === "POST" ? resp({ ok: true }) : resp(GATES),
    );
    render(<AdminGatesPage />);
    await screen.findByText("Seguridad");
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));
    await waitFor(() =>
      expect(apiFetchMock()).toHaveBeenCalledWith("/api/v1/gates/gate-a/approve", { method: "POST" }),
    );
    await waitFor(() => expect(apiFetchMock().mock.calls.filter((c) => c[0] === "/api/v1/gates").length).toBeGreaterThanOrEqual(2));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("un 403 al rechazar muestra el mensaje de permiso", async () => {
    apiFetchMock().mockImplementation((ruta: string, init?: RequestInit) =>
      init?.method === "POST" ? resp({}, 403) : resp(GATES),
    );
    render(<AdminGatesPage />);
    await screen.findByText("Seguridad");
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));
    expect(await screen.findByText(/solo para superadministradores de plataforma/i)).toBeInTheDocument();
  });
});
