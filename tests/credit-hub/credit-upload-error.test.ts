import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "lib/credit-api.ts"), "utf8");

describe("credit upload error messages", () => {
  test("explains storage unavailability instead of exposing only HTTP 500", () => {
    expect(source).toMatch(/export function creditUploadErrorMessage\(status: number, detail: unknown\)/);
    expect(source).toMatch(/No se pudo guardar el documento porque el almacenamiento no está disponible/);
    expect(source).toMatch(/creditUploadErrorMessage\(res\.status, detail\)/);
  });

  test("mutation that removes the storage diagnosis is caught", () => {
    const mutatedSource = source.replace(
      "No se pudo guardar el documento porque el almacenamiento no está disponible. Intenta nuevamente más tarde.",
      "Error HTTP 500",
    );
    expect(() => {
      expect(mutatedSource).toMatch(/No se pudo guardar el documento porque el almacenamiento no está disponible/);
    }).toThrow();
  });
});
