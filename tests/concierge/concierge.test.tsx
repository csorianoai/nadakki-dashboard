import { fireEvent, render, screen } from "@testing-library/react";
import { ConciergeHost } from "@/components/concierge/ConciergeSheet";
import { sendConciergeMessage } from "@/lib/api/concierge";
import { conciergeRegion, regionalReply, SEED_MESSAGES, INVENTORY_UNAVAILABLE } from "@/lib/concierge/messages";

jest.mock("@/lib/api/concierge", () => ({ sendConciergeMessage: jest.fn() }));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({ useDealerManagementBranding: () => ({ data: { locale: "es-AR", currency: "ARS" } }) }));
jest.mock("@/components/ui/sheet", () => ({ Sheet: ({ children }: any) => <div>{children}</div>, SheetContent: ({ children }: any) => <div>{children}</div> }));
jest.mock("@/components/concierge/ChatInput", () => ({ ChatInput: ({ value, onChange, onSend }: any) => <><input aria-label="Consulta" value={value} onChange={(e) => onChange(e.target.value)} /><button onClick={onSend}>Enviar</button></> }));
jest.mock("@/components/concierge/ConciergeFab", () => ({ ConciergeFab: () => null }));
const send = sendConciergeMessage as jest.Mock;

it("saludo neutro sin recomendaciones", () => {
  expect(JSON.stringify(SEED_MESSAGES)).not.toMatch(/Corolla|GLC|Sportage|Tucson|yipeta|jeepeta|RD\$|recId/i);
});
it("usa ARS en AR, DOP en DO y sin moneda para desconocido", () => {
  const ar = conciergeRegion({ locale: "es-AR" });
  expect(ar.currency).toBe("ARS");
  expect(regionalReply("Una yipeta", ar)).toBe("Una SUV");
  expect(() => regionalReply("RD$ 100", ar)).toThrow();
  expect(regionalReply("RD$ 100", conciergeRegion({ locale: "es-DO" }))).toBe("DOP  100");
  const neutral = conciergeRegion(null);
  expect(neutral.currency).toBeNull();
  expect(regionalReply("Consulta una jeepeta", neutral)).toBe("Consulta una SUV");
  expect(() => regionalReply("ARS 100", neutral)).toThrow();
});
it("error honesto sin modelos ni recomendacion y reintento de la misma consulta", async () => {
  send.mockRejectedValueOnce(new Error("red"));
  render(<ConciergeHost />);
  fireEvent.change(screen.getByRole("textbox", { name: "Consulta" }), { target: { value: "familiar" } });
  fireEvent.click(screen.getByText("Enviar"));
  await screen.findByText(INVENTORY_UNAVAILABLE);
  expect(screen.queryByRole("link")).toBeNull();
  expect(document.body.textContent).not.toMatch(/Corolla|GLC|Sportage|Tucson|yipeta|RD\$/i);
  send.mockResolvedValueOnce({ message: "Sin resultados", vehicles: [] });
  fireEvent.click(screen.getByText("Reintentar"));
  await screen.findByText("Sin resultados");
  expect(send).toHaveBeenLastCalledWith(null, "familiar", { locale: "es-AR", country_code: "AR", currency: "ARS" });
});

it("muestra los autos REALES que devuelve el backend, con enlace a su ficha, y conserva la sesion", async () => {
  const rav4 = { id: "11111111-1111-4111-8111-111111111111", make: "Toyota", model: "RAV4", year: 2020, price_amount: 14500000,
    price_currency: "USD", mileage_km: 50000, transmission: "automatica", primary_photo_url: null, url: "/autos/vehiculo/11111111-1111-4111-8111-111111111111" };
  send.mockResolvedValueOnce({ message: "Encontré 1 auto: Toyota RAV4 2020 · USD 14.500.000", sessionId: "s1", vehicles: [rav4] });
  render(<ConciergeHost />);
  fireEvent.change(screen.getByRole("textbox", { name: "Consulta" }), { target: { value: "SUV" } });
  fireEvent.click(screen.getByText("Enviar"));
  // La moneda es la del inventario real del concesionario: se muestra tal cual, sin convertir.
  await screen.findByText(/Toyota RAV4 2020 · USD 14\.500\.000/);
  expect(screen.getByRole("link", { name: /Toyota RAV4 2020/ })).toHaveAttribute("href", rav4.url);
  send.mockResolvedValueOnce({ message: "Sin resultados", sessionId: "s1", vehicles: [] });
  fireEvent.change(screen.getByRole("textbox", { name: "Consulta" }), { target: { value: "otra" } });
  fireEvent.click(screen.getByText("Enviar"));
  await screen.findByText("Sin resultados");
  expect(send).toHaveBeenLastCalledWith("s1", "otra", { locale: "es-AR", country_code: "AR", currency: "ARS" });
  expect(screen.getAllByRole("link")).toHaveLength(1);
});
