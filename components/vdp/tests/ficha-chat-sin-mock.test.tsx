import React from "react";
import { render } from "@testing-library/react";

const flag = { on: false };
jest.mock("@/lib/autos-agent/feature-flags", () => ({
  get FEATURE_VEHICLE_CHAT_BACKEND() { return flag.on; },
}));
const autosFetch = jest.fn();
jest.mock("@/lib/autos-consumer-api", () => ({ autosFetch: (...a: unknown[]) => autosFetch(...a) }));
jest.mock("@/lib/api/concierge", () => ({
  sendConciergeMessage: async () => ({ message: "respuesta del concierge de prueba", sessionId: "s" }),
}));
jest.mock("next/dynamic", () => () => () => <div data-testid="chat-btn">Chatea con AI</div>);

import { sendVehicleChatMessage } from "@/lib/api/vehicle-chat";
import { VehicleChatWidget } from "@/components/vdp/VehicleChatWidget";

const v: any = { id: 1, make: "Toyota", model: "Corolla", year: 2020, price: 1, dealerName: "" };

describe("F-31 chat de la ficha sin respuestas simuladas", () => {
  beforeEach(() => { autosFetch.mockReset(); flag.on = false; });

  it("sin backend real no devuelve texto simulado", async () => {
    autosFetch.mockRejectedValue(new Error("down"));
    const res = await sendVehicleChatMessage(v, "cual es el precio?", null);
    expect(res.fromBackend).toBe(false);
    expect(res.message).toBe("");
  });

  it("con backend real devuelve su respuesta", async () => {
    flag.on = true;
    autosFetch.mockResolvedValue({ reply: "hola real", session_id: "s1" });
    const res = await sendVehicleChatMessage(v, "hola", null);
    expect(res).toMatchObject({ message: "hola real", fromBackend: true });
  });

  it("el widget se oculta si el chat real no esta habilitado", () => {
    const { container } = render(<VehicleChatWidget vehicle={v} />);
    expect(container.firstChild).toBeNull();
  });

  it("el widget aparece con el chat real habilitado", () => {
    flag.on = true;
    const { getAllByTestId } = render(<VehicleChatWidget vehicle={v} />);
    expect(getAllByTestId("chat-btn").length).toBeGreaterThan(0);
  });
});
