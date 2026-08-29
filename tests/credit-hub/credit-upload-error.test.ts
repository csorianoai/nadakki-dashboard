import { creditUploadErrorMessage } from "@/lib/credit-api";

describe("credit upload error messages", () => {
  test("explains storage unavailability instead of exposing only HTTP 500", () => {
    expect(creditUploadErrorMessage(500, null)).toMatch(/almacenamiento no está disponible/i);
    expect(creditUploadErrorMessage(500, null)).not.toBe("Error HTTP 500");
  });

  test("mutation that removes the storage diagnosis is caught", () => {
    const message = creditUploadErrorMessage(500, null).replace(
      "No se pudo guardar el documento porque el almacenamiento no está disponible. Intenta nuevamente más tarde.",
      "Error HTTP 500",
    );
    expect(message).not.toMatch(/almacenamiento no está disponible/i);
  });
});
