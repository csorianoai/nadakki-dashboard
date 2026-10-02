/**
 * El aviso de facturacion electronica, medido sobre la PANTALLA.
 *
 * El mapeo lo fija el packet del contrato; aqui se mide que el tenant argentino
 * VE la frase de ARCA y que la ve como informacion, no como incidencia: `role`
 * de nota, sin el codigo del backend ni el 409 a la vista.
 *
 * Se monta `ContablePageShell`, que es lo que usan las doce pantallas de
 * /contable, y no el aviso a pelo: un aviso correcto que ninguna pantalla monta
 * no se le aparece a nadie.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { ARCA_TITULO } from "@/lib/contable/fiscal-dispatch";

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => tenantId,
}));

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api/fetch-client";

const fetchMock = apiFetch as jest.MockedFunction<typeof apiFetch>;

let tenantId: string | undefined = "tenant-ar";

function responde(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response);
}

function cuerpo409(error: string, country: string | null) {
  return { detail: { error, country } };
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ContablePageShell title="Libro mayor" description="Movimientos por cuenta.">
        <p>contenido</p>
      </ContablePageShell>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  tenantId = "tenant-ar";
});

describe("tenant argentino", () => {
  beforeEach(() => responde(409, cuerpo409("AR_NOT_CONFIGURED", "AR")));

  it("ve la frase de ARCA", async () => {
    montar();
    expect(await screen.findByText(ARCA_TITULO)).toBeInTheDocument();
  });

  it("la ve como informacion, no como incidencia", async () => {
    montar();
    const aviso = await screen.findByTestId("facturacion-arca");
    expect(aviso).toHaveAttribute("data-informativo", "true");
    expect(aviso.getAttribute("role")).toBe("note");
    expect(screen.queryByTestId("facturacion-problema")).toBeNull();
  });

  it("no se le filtra el codigo del backend ni el 409", async () => {
    montar();
    const aviso = await screen.findByTestId("facturacion-arca");
    expect(aviso.textContent).not.toContain("AR_NOT_CONFIGURED");
    expect(aviso.textContent).not.toContain("409");
    expect(aviso.textContent).not.toMatch(/\berror\b/i);
  });

  it("el contenido de la pantalla sigue ahi: el aviso no la reemplaza", async () => {
    montar();
    await screen.findByTestId("facturacion-arca");
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.getByText("Libro mayor")).toBeInTheDocument();
  });
});

describe("lo que si es un problema se ve como problema", () => {
  it("un tenant sin pais fiscal se pinta como alerta, con su codigo", async () => {
    responde(409, cuerpo409("FISCAL_COUNTRY_NOT_CONFIGURED", null));
    montar();
    const aviso = await screen.findByTestId("facturacion-problema");
    expect(aviso.getAttribute("role")).toBe("alert");
    expect(aviso).toHaveAttribute("data-codigo", "FISCAL_COUNTRY_NOT_CONFIGURED");
    expect(aviso.textContent).not.toContain("ARCA");
  });

  it("un pais sin paquete fiscal se nombra", async () => {
    responde(409, cuerpo409("FISCAL_COUNTRY_UNSUPPORTED", "CO"));
    montar();
    expect((await screen.findByTestId("facturacion-problema")).textContent).toContain("CO");
  });
});

describe("cuando no hay nada que decir", () => {
  it("con el paquete RD operativo no se pinta aviso", async () => {
    responde(200, []);
    montar();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(screen.queryByTestId("facturacion-arca")).toBeNull();
    expect(screen.queryByTestId("facturacion-problema")).toBeNull();
  });

  it("sin tenant no se pregunta nada al backend", async () => {
    tenantId = undefined;
    montar();
    await waitFor(() => expect(screen.getByText("contenido")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
