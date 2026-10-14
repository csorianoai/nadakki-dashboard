import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehiculosV2, errorVin } from "@/components/credit-hub/bank-v2/control/VehiculosV2";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: string[] = [];
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string) => {
    llamadas.push(path);
    return { ok: true, status: 200, text: async () => JSON.stringify({ anomaly_count: 0, anomalies: [] }) };
  }),
}));

function pintar() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <VehiculosV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} />
    </QueryClientProvider>,
  );
}

describe("Historial de vehículos: VIN validado antes de consultar (AUDIT-COWORK 5/9)", () => {
  beforeEach(() => (llamadas.length = 0));

  it.each([
    ["ABC", /17 caracteres; este tiene 3/],
    ["1HGBH41JXMN10918O", /I, O ni Q/],
    ["1HGBH41JXMN1091-6", /solo lleva letras y números/],
    ["", /Escribe el VIN/],
  ])("'%s' no es VIN", (vin, msg) => {
    expect(errorVin(vin)).toMatch(msg);
  });

  it("acepta un VIN valido en minusculas y con espacios alrededor", () => {
    expect(errorVin(" 1hgbh41jxmn109186 ")).toBeNull();
  });

  it("'ABC': error claro, campo marcado y SIN consulta", () => {
    pintar();
    fireEvent.change(screen.getByLabelText("VIN"), { target: { value: "ABC" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(screen.getByTestId("vin-error")).toHaveTextContent("El VIN tiene 17 caracteres; este tiene 3.");
    expect(screen.getByLabelText("VIN")).toHaveAttribute("aria-invalid", "true");
    expect(llamadas).toEqual([]);
  });

  it("VIN valido: consulta como antes y el error desaparece al escribir", async () => {
    pintar();
    const campo = screen.getByLabelText("VIN");
    fireEvent.change(campo, { target: { value: "ABC" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    fireEvent.change(campo, { target: { value: "1hgbh41jxmn109186" } });
    expect(screen.queryByTestId("vin-error")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByText("Sin anomalías registradas para este VIN.")).toBeInTheDocument();
    expect(llamadas).toEqual(["/api/v2/credit/vehicles/vin/1HGBH41JXMN109186/anomalies"]);
  });
});
