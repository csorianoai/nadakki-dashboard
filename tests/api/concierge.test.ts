import { autosFetch } from "@/lib/autos-consumer-api";
import { CONCIERGE_MESSAGE_PATH, ConciergeUnavailableError, conversationalSearch, sendConciergeMessage } from "@/lib/api/concierge";
jest.mock("@/lib/autos-consumer-api", () => ({ autosFetch: jest.fn() }));
const fetchMock = autosFetch as jest.Mock;
const RAV4 = { id: "11111111-1111-4111-8111-111111111111", make: "Toyota", model: "RAV4", year: 2020, price_amount: 14500000,
  price_currency: "ARS", mileage_km: 50000, transmission: "automatica", primary_photo_url: "https://x/1.jpg", url: "/x" };
beforeEach(() => fetchMock.mockReset());

it("llama al concierge publico del backend con el mensaje y la sesion", async () => {
  fetchMock.mockResolvedValueOnce({ reply: "Encontré 1 auto", session_id: "s1", vehicles: [RAV4] });
  const r = await sendConciergeMessage("s0", "SUV hasta 15 millones", { locale: "es-AR" });
  expect(fetchMock).toHaveBeenCalledWith(CONCIERGE_MESSAGE_PATH, expect.objectContaining({ method: "POST" }));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ session_id: "s0", message: "SUV hasta 15 millones", context: { locale: "es-AR" } });
  expect(r).toEqual({ message: "Encontré 1 auto", sessionId: "s1", vehicles: [{ ...RAV4, url: "/autos/vehiculo/" + RAV4.id }] });
});
it.each(["search", "message"])("%s devuelve error tipado sin recomendacion cuando falla backend", async (kind) => {
  fetchMock.mockRejectedValue(new Error("red"));
  try {
    await (kind === "search" ? conversationalSearch("familiar") : sendConciergeMessage(null, "familiar", {}));
    throw new Error("Se esperaba error");
  } catch (error) {
    expect(error).toBeInstanceOf(ConciergeUnavailableError);
    expect((error as Error).message).not.toMatch(/Corolla|GLC|Sportage|Tucson/);
  }
});
it("respuesta vacia o invalida falla cerrada", async () => {
  for (const value of [null, {}, { reply: "" }]) {
    fetchMock.mockResolvedValueOnce(value);
    await expect(conversationalSearch("hola")).rejects.toBeInstanceOf(ConciergeUnavailableError);
  }
});
it("descarta autos sin id real (nunca un id numerico de ejemplo)", async () => {
  fetchMock.mockResolvedValueOnce({ reply: "Resultado", vehicles: [{ id: 42, make: "Kia" }, { id: "no-uuid" }, RAV4] });
  expect((await sendConciergeMessage(null, "hola", {})).vehicles.map((v) => v.id)).toEqual([RAV4.id]);
});
