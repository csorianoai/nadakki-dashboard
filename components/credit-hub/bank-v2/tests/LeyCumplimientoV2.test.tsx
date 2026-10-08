import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CumplimientoV2 } from "@/components/credit-hub/bank-v2/control/CumplimientoV2";
import { marcoRegulatorio } from "@/components/credit-hub/bank-v2/comun/regulacion";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

/** AUDIT-COWORK 7/9: referencia a la Ley 172-13 en Cumplimiento, segun el perfil del tenant. */
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("next/link", () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async (path: string) => (path.includes("applications/queue") ? { applications: [], total_count: 0 } : { issues: [] })),
}));

const pintar = (perfil: string | null) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CumplimientoV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} hrefSolicitud={(id) => id} perfilRegulatorio={perfil} />
    </QueryClientProvider>,
  );

describe("Ley 172-13 en Cumplimiento (bank-v2)", () => {
  it.each(["DO_LEY_172_13", "INDOTEL", "DO", "ley-172-13"])("perfil %s: Ley 172-13", (p) => {
    expect(marcoRegulatorio(p)?.titulo).toBe("Ley 172-13 (República Dominicana)");
  });

  it("MX y CO con su regulador; desconocido o vacio: nada (sin suponer RD)", () => {
    expect(marcoRegulatorio("MX_CNBV")?.codigo).toBe("MX");
    expect(marcoRegulatorio("CO_SFC")?.codigo).toBe("CO");
    expect(marcoRegulatorio("XX_OTRO")).toBeNull();
    expect(marcoRegulatorio(null)).toBeNull();
    expect(marcoRegulatorio("  ")).toBeNull();
  });

  it("tenant DO: marco Ley 172-13 arriba y en Derecho al olvido", async () => {
    pintar("DO_LEY_172_13");
    expect(await screen.findByTestId("cumplimiento-marco")).toHaveTextContent("Ley 172-13 (República Dominicana)");
    expect(screen.getByText(/conforme a la Ley 172-13/)).toBeInTheDocument();
  });

  it("sin perfil: no inventa marco", async () => {
    const { container } = pintar(null);
    await screen.findByText("Solicitudes revisadas");
    expect(screen.queryByTestId("cumplimiento-marco")).toBeNull();
    expect(container.textContent).not.toContain("172-13");
  });
});
