/**
 * Alta de asiento: un tenant AR puede registrar en ARS.
 *
 * El desplegable ofrecia DOP y USD, y nada mas. Lo que se mide aqui es el cuerpo
 * REAL del POST, que es donde se veia el defecto: con el campo vacio NO debe
 * viajar `currency`, para que el backend aplique la moneda funcional del tenant.
 *
 * Tambien se mide el mapper: `toAsiento` rellenaba `?? "DOP"` cuando el backend
 * no informaba moneda.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CrearAsientoClient } from "@/components/contable/CrearAsientoClient";

/**
 * `@/components/forge` reexporta GlobalForgeAppShell, que llama a next/font al
 * importarse. Fuera de Next eso no existe; se neutraliza porque no es lo que
 * mide este packet.
 */
jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--inter", className: "inter" }),
  JetBrains_Mono: () => ({ variable: "--mono", className: "mono" }),
  Source_Serif_4: () => ({ variable: "--serif", className: "serif" }),
  Manrope: () => ({ variable: "--manrope", className: "manrope" }),
}));

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "tenant-ar",
}));

const createAsiento = jest.fn(async () => ({ id: "as-1" }));
jest.mock("@/app/hooks/contable", () => ({
  ContableApiError: class ContableApiError extends Error {},
  createAsiento: (...args: unknown[]) => createAsiento(...(args as [])),
  postAsiento: jest.fn(async () => ({ id: "as-1" })),
  listCuentas: jest.fn(async () => [
    { id: "c1", codigo: "1101", nombre: "Caja", activa: true },
    { id: "c2", codigo: "4101", nombre: "Ventas", activa: true },
  ]),
  listPeriodos: jest.fn(async () => [{ id: "p1", label: "2026-09", status: "open" }]),
}));

import { toast } from "sonner";

function montar() {
  return render(<CrearAsientoClient />);
}

async function rellenaAsiento() {
  await waitFor(() => expect(screen.getByTestId("asiento-moneda")).toBeInTheDocument());
}

beforeEach(() => {
  createAsiento.mockClear();
  (toast.error as jest.Mock).mockClear();
});

describe("el campo de moneda ya no es una lista de dos", () => {
  it("es un campo de texto ISO-4217, no un desplegable DOP/USD", async () => {
    montar();
    await rellenaAsiento();
    const campo = screen.getByTestId("asiento-moneda");
    expect(campo.tagName).toBe("INPUT");
    expect(screen.queryByRole("option", { name: "DOP" })).toBeNull();
    expect(screen.queryByRole("option", { name: "USD" })).toBeNull();
  });

  it("nace vacio y dice que vacio significa la moneda del tenant", async () => {
    montar();
    await rellenaAsiento();
    expect(screen.getByTestId("asiento-moneda")).toHaveValue("");
    expect(screen.getByText(/moneda funcional del tenant/)).toBeInTheDocument();
  });

  it("acepta ARS", async () => {
    montar();
    await rellenaAsiento();
    fireEvent.change(screen.getByTestId("asiento-moneda"), { target: { value: "ars" } });
    expect(screen.getByTestId("asiento-moneda")).toHaveValue("ARS");
    expect(screen.queryByTestId("asiento-moneda-invalida")).toBeNull();
  });

  it("avisa de un codigo que no es de tres letras antes de llamar al backend", async () => {
    montar();
    await rellenaAsiento();
    fireEvent.change(screen.getByTestId("asiento-moneda"), { target: { value: "AR" } });
    expect(screen.getByTestId("asiento-moneda-invalida")).toBeInTheDocument();
  });
});

describe("cuerpo del POST", () => {
  async function guarda() {
    fireEvent.click(screen.getByRole("button", { name: /Guardar borrador/i }));
    await waitFor(() => expect(createAsiento).toHaveBeenCalled());
    return createAsiento.mock.calls[0][1] as Record<string, unknown>;
  }

  it("con el campo vacio NO viaja currency: la resuelve el backend", async () => {
    montar();
    await rellenaAsiento();
    const payload = await guarda();
    expect("currency" in payload).toBe(false);
  });

  it("con ARS viaja ARS, no DOP", async () => {
    montar();
    await rellenaAsiento();
    fireEvent.change(screen.getByTestId("asiento-moneda"), { target: { value: "ARS" } });
    const payload = await guarda();
    expect(payload.currency).toBe("ARS");
  });

  it("una moneda invalida no llega a la red", async () => {
    montar();
    await rellenaAsiento();
    fireEvent.change(screen.getByTestId("asiento-moneda"), { target: { value: "PESOS" } });
    fireEvent.click(screen.getByRole("button", { name: /Guardar borrador/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(createAsiento).not.toHaveBeenCalled();
  });
});
