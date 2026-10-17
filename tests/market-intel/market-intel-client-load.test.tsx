import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MarketIntelClient } from "@/app/market-intel/components/MarketIntelClient";
import * as api from "@/app/market-intel/lib/api";
import { snapshotFull, snapshotFullRun } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

jest.mock("@/app/market-intel/hooks/useMarketIntelTenant", () => ({
  useMarketIntelTenant: () => ({
    effectiveTenantId: "tenant-qa",
    tenantHydrated: true,
    tenantError: null,
  }),
}));
jest.mock("@/app/market-intel/lib/api", () => ({
  listRuns: jest.fn(),
  listPacks: jest.fn(),
  getRun: jest.fn(),
  getSnapshot: jest.fn(),
  createRun: jest.fn(),
  startRun: jest.fn(),
  validateRun: jest.fn(),
}));

const mocked = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.resetAllMocks();
  mocked.listPacks.mockResolvedValue([]);
});

describe("MarketIntelClient carga", () => {
  it("respuesta vacía: muestra «Sin datos» con acción, sin error", async () => {
    mocked.listRuns.mockResolvedValue([]);
    render(<MarketIntelClient />);
    expect(await screen.findByText(/Sin datos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crear investigación/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByText(/Cargando/i)).toBeNull();
  });

  it("respuesta válida: muestra la investigación", async () => {
    mocked.listRuns.mockResolvedValue([snapshotFullRun]);
    mocked.getRun.mockResolvedValue(snapshotFullRun);
    mocked.getSnapshot.mockResolvedValue(snapshotFull);
    render(<MarketIntelClient />);
    expect(await screen.findByText("Mercado de crédito automotriz")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("fallo del backend: mensaje con Reintentar, sin volcar el error crudo, y reintenta", async () => {
    mocked.listRuns.mockRejectedValueOnce(new Error("psycopg2.OperationalError: relation x"));
    render(<MarketIntelClient />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toMatch(/psycopg2|relation/);
    expect(screen.queryByText(/Cargando/i)).toBeNull();
    mocked.listRuns.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: /Reintentar/i }));
    await waitFor(() => expect(screen.getByText(/Sin datos/i)).toBeInTheDocument());
    expect(mocked.listRuns).toHaveBeenCalledTimes(2);
  });
});
