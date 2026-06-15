import { render, screen } from "@testing-library/react";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { ChTopbar } from "@/components/credit-hub/shell/ChTopbar";

describe("ChAppShell", () => {
  test("smoke render with skip link and main landmark", () => {
    render(
      <ChAppShell
        persona="bank"
        tenantName="CrediCefi"
        topbar={<ChTopbar persona="bank" tenantName="CrediCefi" />}
      >
        <p>Preview content</p>
      </ChAppShell>
    );
    expect(screen.getByRole("link", { name: /Saltar al contenido principal/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "ch-main-content");
    expect(screen.getByText("Preview content")).toBeInTheDocument();
  });
});
