import { wizardApplicationIdFromParams } from "@/lib/credit-hub/dealer/wizard-application-id";

// Ronda 3 de Cowork (20-oct): el asistente debe aceptar ?id= además de ?application_id=.
describe("wizardApplicationIdFromParams", () => {
  it("lee application_id", () => {
    expect(wizardApplicationIdFromParams(new URLSearchParams("application_id=abc"))).toBe("abc");
  });
  it("lee id cuando no hay application_id", () => {
    expect(wizardApplicationIdFromParams(new URLSearchParams("id=%20b9227e1a%20"))).toBe("b9227e1a");
  });
  it("application_id gana sobre id", () => {
    expect(wizardApplicationIdFromParams(new URLSearchParams("id=x&application_id=y"))).toBe("y");
  });
  it("new=1 empieza una solicitud nueva aunque venga id", () => {
    expect(wizardApplicationIdFromParams(new URLSearchParams("new=1&id=x"))).toBe("");
  });
});
