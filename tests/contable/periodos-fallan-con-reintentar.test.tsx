/**
 * Libro mayor y Balance dicen cuando `/periodos` falla, y ofrecen Reintentar.
 *
 * Eran las dos unicas pantallas contables que cargaban `listPeriodos` dentro de
 * un `.then()` SIN `.catch()` (D8, suite#1501): la promesa quedaba rechazada
 * sin manejar, los selectores se quedaban vacios y la pantalla no decia nada.
 * Plan de cuentas no lo sufria --envuelve su unica llamada en `try/catch`-- y
 * ademas nunca pide `/periodos`. Esa es la unica diferencia real entre las tres
 * pantallas: la verificacion de sesion es identica en todas.
 *
 * Un fallo de `/periodos` NO dice nada sobre la sesion, asi que aqui se
 * comprueba tambien que la pantalla no ofrece cerrarla.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContableApiError, listCuentas, listPeriodos } from "@/app/hooks/contable";
import { LibroMayorClient } from "@/components/contable/LibroMayorClient";
import { BalanceComprobacionClient } from "@/components/contable/BalanceComprobacionClient";

jest.mock("@/app/hooks/contable", () => {
  class FakeApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  }
  return {
    ContableApiError: FakeApiError,
    listCuentas: jest.fn(),
    listPeriodos: jest.fn(),
    getLibroMayor: jest.fn(),
    getBalanceComprobacion: jest.fn(),
  };
});

// El barrel de forge arrastra el layout raiz, y con el `next/font`, que no
// resuelve bajo jest. Solo se usa `Select`.
jest.mock("@/components/forge", () => ({
  Select: ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    options: { value: string; label: string }[];
  }) => (
    <label>
      {label}
      <select value={value} onChange={onChange}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

jest.mock("@/components/contable/useContableTenantId", () => ({
  useContableTenantId: () => "t-caja",
}));

jest.mock("@/components/contable/monedaFuncional", () => ({
  useMonedaFuncional: () => "es-DO",
  MonedaFuncionalNota: () => null,
  formateaImporteContable: (v: number) => String(v),
}));

jest.mock("@/components/contable/ContablePageShell", () => ({
  ContablePageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn(), warning: jest.fn() } }));

const cuentasMock = listCuentas as jest.MockedFunction<typeof listCuentas>;
const periodosMock = listPeriodos as jest.MockedFunction<typeof listPeriodos>;

const fallo = () => new ContableApiError("Periodo cerrado (locked)", 409);

describe("Libro mayor: /periodos caido se dice y se reintenta", () => {
  beforeEach(() => jest.clearAllMocks());

  test("pinta el aviso en vez de quedarse mudo", async () => {
    cuentasMock.mockResolvedValue([] as never);
    periodosMock.mockRejectedValue(fallo());

    render(<LibroMayorClient />);

    const aviso = await screen.findByTestId("contable-error-reintentar");
    expect(aviso).toHaveAttribute("role", "alert");
    expect(aviso).toHaveTextContent("No se pudieron cargar las cuentas y los periodos.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  test("Reintentar vuelve a pedirlo, y al cargar el aviso desaparece", async () => {
    cuentasMock.mockResolvedValue([] as never);
    periodosMock.mockRejectedValueOnce(fallo());
    periodosMock.mockResolvedValueOnce([
      { id: "p1", label: "2026-01", status: "open" },
    ] as never);

    render(<LibroMayorClient />);
    await screen.findByTestId("contable-error-reintentar");

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() =>
      expect(screen.queryByTestId("contable-error-reintentar")).not.toBeInTheDocument(),
    );
    expect(periodosMock).toHaveBeenCalledTimes(2);
  });

  test("no ofrece cerrar sesion: /periodos no habla de la sesion", async () => {
    cuentasMock.mockResolvedValue([] as never);
    periodosMock.mockRejectedValue(fallo());

    render(<LibroMayorClient />);
    await screen.findByTestId("contable-error-reintentar");

    expect(screen.queryByRole("button", { name: /cerrar sesion/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/iniciar sesión/i)).not.toBeInTheDocument();
  });
});

describe("Balance de comprobacion: igual", () => {
  beforeEach(() => jest.clearAllMocks());

  test("pinta el aviso con Reintentar", async () => {
    periodosMock.mockRejectedValue(fallo());

    render(<BalanceComprobacionClient />);

    const aviso = await screen.findByTestId("contable-error-reintentar");
    expect(aviso).toHaveTextContent("No se pudieron cargar los periodos.");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  test("Reintentar vuelve a pedir los periodos", async () => {
    periodosMock.mockRejectedValueOnce(fallo());
    periodosMock.mockResolvedValueOnce([
      { id: "p1", label: "2026-01", status: "open" },
    ] as never);

    render(<BalanceComprobacionClient />);
    await screen.findByTestId("contable-error-reintentar");

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() =>
      expect(screen.queryByTestId("contable-error-reintentar")).not.toBeInTheDocument(),
    );
    expect(periodosMock).toHaveBeenCalledTimes(2);
  });

  test("si carga bien, no hay aviso", async () => {
    periodosMock.mockResolvedValue([{ id: "p1", label: "2026-01", status: "open" }] as never);

    render(<BalanceComprobacionClient />);

    await waitFor(() => expect(periodosMock).toHaveBeenCalled());
    expect(screen.queryByTestId("contable-error-reintentar")).not.toBeInTheDocument();
  });
});
