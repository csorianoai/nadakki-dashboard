/** El chrome del dealer monta la bienvenida de primeros pasos encima del botón del asistente. */
import { fireEvent, render, screen } from "@testing-library/react";

let ruta = "/autos/dealer/inventario";
jest.mock("next/navigation", () => ({ usePathname: () => ruta }));
jest.mock("@/components/ai/AsistenteContable", () => ({ AsistenteContable: () => <div data-testid="asistente-panel" /> }));
jest.mock("@/components/ai/BienvenidaPrimerosPasos", () => ({
  BienvenidaPrimerosPasos: () => <div data-testid="bienvenida-mock" />,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DealerAsistente } = require("@/components/dealer-management/shell/DealerAsistente");

describe("montaje de la bienvenida en el dealer", () => {
  it("bajo /autos/dealer se monta y se oculta mientras el panel del asistente está abierto", () => {
    ruta = "/autos/dealer/inventario";
    render(<DealerAsistente />);
    expect(screen.getByTestId("bienvenida-mock")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /asistente contable/i }));
    expect(screen.queryByTestId("bienvenida-mock")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /cerrar asistente/i }));
    expect(screen.getByTestId("bienvenida-mock")).toBeInTheDocument();
  });

  it("fuera de /autos/dealer no se monta", () => {
    ruta = "/contable";
    const { container } = render(<DealerAsistente />);
    expect(container.innerHTML).toBe("");
  });
});
