import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..", "..", "..");

describe("ROP-G6-GENERAR-DOC-UI: ruta de la prueba de hecho", () => {
  it("vive en tests/realtor/documentos y no en la ruta antigua", () => {
    expect(existsSync(join(root, "tests/realtor/documentos/RESULT_ROP_G6_GENERAR_DOC_UI.sh"))).toBe(true);
    expect(existsSync(join(root, "tests/realtor/RESULT_ROP_G6_GENERAR_DOC_UI.sh"))).toBe(false);
  });

  it("resuelve la raiz del repo desde su nueva ubicacion y emite el resultado", () => {
    const src = readFileSync(join(root, "tests/realtor/documentos/RESULT_ROP_G6_GENERAR_DOC_UI.sh"), "utf8");
    expect(src).toContain('cd "$(dirname "$0")/../../.."');
    expect(src).toContain("RESULT_ROP_G6_GENERAR_DOC_UI=PASS");
  });
});
