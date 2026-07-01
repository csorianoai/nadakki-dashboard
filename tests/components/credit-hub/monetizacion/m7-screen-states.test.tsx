import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MonetizacionScreenEmpty,
  MonetizacionScreenError,
  MonetizacionScreenLoading,
} from "@/components/credit-hub/monetizacion/ui/MonetizacionScreenState";

jest.mock("@/components/credit-hub/monetizacion/ui/screen-states.css", () => ({}));

describe("Monetización M7 screen states", () => {
  test("loading skeleton exposes busy state", () => {
    render(
      <div className="forge-monetizacion">
        <MonetizacionScreenLoading cards={2} columns={2} />
      </div>,
    );
    expect(screen.getByLabelText("Cargando datos")).toBeInTheDocument();
  });

  test("error state shows product copy and retry", async () => {
    const onRetry = jest.fn();
    render(
      <div className="forge-monetizacion">
        <MonetizacionScreenError onRetry={onRetry} />
      </div>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron leer los eventos de origen.");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("empty state supports optional CTA", async () => {
    const onCta = jest.fn();
    render(
      <div className="forge-monetizacion">
        <MonetizacionScreenEmpty
          message="Sin eventos facturables en mayo 2026."
          ctaLabel="Ver periodo anterior"
          onCta={onCta}
        />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver periodo anterior" }));
    expect(onCta).toHaveBeenCalledTimes(1);
  });
});
