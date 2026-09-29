/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import DealerConexionesPage from "@/app/autos/dealer/conexiones/page";

jest.mock("@/components/dealer/DealerSponsorshipBanner", () => ({
  DealerSponsorshipBanner: () => null,
}));

describe("DealerConexionesPage terminal empty state", () => {
  test("sigue siendo util aunque sponsorship no pinte nada", () => {
    render(<DealerConexionesPage />);

    expect(screen.getByRole("heading", { name: "Conexiones" })).toBeInTheDocument();
    expect(
      screen.getByText("Aquí aparecen las integraciones y patrocinios activos de tu concesionaria."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver estado de módulos" })).toHaveAttribute(
      "href",
      "/autos/dealer/estado",
    );
  });
});
