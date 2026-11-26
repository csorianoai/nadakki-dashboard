import { autosFetch } from "@/lib/autos-consumer-api";
import { ConciergeUnavailableError, conversationalSearch, sendConciergeMessage } from "@/lib/api/concierge";
jest.mock("@/lib/autos-consumer-api", () => ({ autosFetch: jest.fn() }));
const fetchMock = autosFetch as jest.Mock;
beforeEach(() => fetchMock.mockReset());
it.each(["search", "message"])("%s devuelve error tipado sin recomendacion cuando falla backend", async (kind) => {
  fetchMock.mockRejectedValue(new Error("red"));
  try {
    await (kind === "search" ? conversationalSearch("familiar") : sendConciergeMessage(null, "familiar", {}));
    throw new Error("Se esperaba error");
  } catch (error) {
    expect(error).toBeInstanceOf(ConciergeUnavailableError);
    expect((error as { recId?: number }).recId).toBeUndefined();
    expect((error as Error).message).not.toMatch(/Corolla|GLC|Sportage|Tucson/);
  }
});
it("respuesta vacia o invalida falla cerrada", async () => {
  for (const value of [null, {}, { reply: "" }]) {
    fetchMock.mockResolvedValueOnce(value);
    await expect(conversationalSearch("hola")).rejects.toBeInstanceOf(ConciergeUnavailableError);
  }
});
it("conserva solo recomendaciones reales validas", async () => {
  fetchMock.mockResolvedValueOnce({ reply: "Resultado", vehicle_id: "42", session_id: "s" });
  expect(await sendConciergeMessage(null, "hola", {})).toEqual({ message: "Resultado", recId: 42, sessionId: "s" });
});
