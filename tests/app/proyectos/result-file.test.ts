import { readFileSync } from "fs";
import { join } from "path";

describe("RESULT_PS_5_CARGA_PROYECTOS.sh", () => {
  const script = readFileSync(join(__dirname, "RESULT_PS_5_CARGA_PROYECTOS.sh"), "utf8");

  it("ejecuta el test de la pantalla Proyectos › Panel", () => {
    expect(script).toContain("tests/app/proyectos/panel-carga");
  });

  it("declara PASS y FAIL con el nombre de la tarea", () => {
    expect(script).toContain("RESULT_PS_5_CARGA_PROYECTOS=PASS");
    expect(script).toContain("RESULT_PS_5_CARGA_PROYECTOS=FAIL");
  });
});
