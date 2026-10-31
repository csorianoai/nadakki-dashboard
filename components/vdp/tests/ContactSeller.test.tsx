import { render, screen } from "@testing-library/react";
import { ContactSeller } from "@/components/vdp/ContactSeller";
import type { Vehicle } from "@/lib/vehicles";

const base = {
  id: 1, make: "Toyota", model: "Corolla", year: 2022, price: 1,
  loc: "", type: "Sedán", km: 0, trans: "", fuel: "", badge: "", match: 0,
  grad: "", verified: true, rating: 4.8, reviews: 3, featuresLine: "",
  dealerName: "Dealer Real", avgResp: "15 min",
} as Vehicle;

describe("ContactSeller sin datos inventados", () => {
  it("no renderiza nada sin vendedor real", () => {
    const { container } = render(<ContactSeller vehicle={{ ...base, dealerName: "" }} />);
    expect(container.firstChild).toBeNull();
  });

  it("no muestra telefono ni WhatsApp fijos", () => {
    const { container } = render(<ContactSeller vehicle={base} />);
    expect(screen.getByText("Contactar Dealer Real")).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/809-555|wa\.me/);
  });

  it("oculta la valoracion si no hay dato", () => {
    render(<ContactSeller vehicle={{ ...base, avgResp: "" }} />);
    expect(screen.queryByText(/responde en/)).toBeNull();
  });
});
