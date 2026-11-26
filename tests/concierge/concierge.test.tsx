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
  send.mockResolvedValueOnce({ message: "Sin resultados" });
  fireEvent.click(screen.getByText("Reintentar"));
  await screen.findByText("Sin resultados");
  expect(send).toHaveBeenLastCalledWith(null, "familiar", { locale: "es-AR", country_code: "AR", currency: "ARS" });
});

it("respuesta con moneda extranjera falla sin mostrar recomendacion", async () => {
  send.mockResolvedValueOnce({ message: "RD$ 100", recId: 4 });
  render(<ConciergeHost />);
  fireEvent.change(screen.getByRole("textbox", { name: "Consulta" }), { target: { value: "precio" } });
  fireEvent.click(screen.getByText("Enviar"));
  await screen.findByText(INVENTORY_UNAVAILABLE);
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByText(/RD\$/)).toBeNull();
});
