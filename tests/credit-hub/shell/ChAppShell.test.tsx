import { render, screen } from "@testing-library/react";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";

describe("ChAppShell", () => {
  test("smoke render with skip link and main landmark", () => {
    render(
      <ChAppShell persona="bank" tenantName="TestBank Mexico" frame>
        <p>Preview content</p>
      </ChAppShell>
    );
    expect(screen.getByRole("link", { name: /Saltar al contenido/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "ch-main");
    expect(screen.getByText("Preview content")).toBeInTheDocument();
  });
});
