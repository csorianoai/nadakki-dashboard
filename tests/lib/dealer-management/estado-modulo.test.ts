import fs from "fs";
import path from "path";
import {
  COPY_ESTADO_MODULO,
  estadoDeModulo,
} from "@/lib/dealer-management/estado-modulo";

describe("vocabulario de estado de modulo", () => {
  test("el texto de onboarding es exactamente el acordado", () => {
    expect(COPY_ESTADO_MODULO.segun_onboarding.etiqueta).toBe("Según avance del onboarding");
    expect(COPY_ESTADO_MODULO.segun_onboarding.detalle).toBe(
      "Se habilita según avance de tu onboarding.",
    );
  });

  test("nunca se usa «En preparación» ni «en reparación» ni «Bloqueado»", () => {
    const textos = Object.values(COPY_ESTADO_MODULO)
      .flatMap((c) => [c.etiqueta, c.detalle])
      .join(" ");
    expect(textos).not.toMatch(/en preparaci[oó]n/i);
    expect(textos).not.toMatch(/en reparaci[oó]n/i);
    expect(textos).not.toMatch(/bloquead/i);
  });

  test("permitido = Activo", () => {
    expect(estadoDeModulo({ allowed: true, reason_code: "ALLOWED" })).toBe("activo");
  });

  test("no contratado = fuera del plan", () => {
    expect(estadoDeModulo({ allowed: false, reason_code: "UPGRADE_REQUIRED" })).toBe("fuera_del_plan");
    expect(estadoDeModulo({ allowed: false, reason_code: "NO_ACTIVE_SUBSCRIPTION" })).toBe("fuera_del_plan");
  });

  test("contratado pero no habilitado = según avance del onboarding", () => {
    expect(estadoDeModulo({ allowed: false, reason_code: "TARGET_CORE_NOT_READY" })).toBe("segun_onboarding");
    expect(estadoDeModulo({ allowed: false, reason_code: "DEFAULT_DENY" })).toBe("segun_onboarding");
    expect(estadoDeModulo(undefined)).toBe("segun_onboarding");
  });
});

/**
 * Guarda estatica: ninguna pantalla del dealer vuelve a imprimir jerga del
 * backend. Se buscan los literales dentro de JSX de texto, no en data-* ni en
 * comentarios, que si pueden citarlos.
 */
describe("guarda: sin jerga visible en el panel del dealer", () => {
  const ROOT = path.resolve(__dirname, "../../..");
  const DIRS = ["app/autos/dealer", "components/dealer-management", "components/dealer"];
  const PROHIBIDOS = [
    ">Bloqueado<",
    ">No listo<",
    "Inventario bloqueado",
    "reason_code: <code>",
    // Solo texto renderizado: `target_readiness: "BLOCKED"` es un campo de
    // datos, no algo que el dealer lea en pantalla.
    "readiness: {",
    "En preparación",
    "en reparación",
  ];

  function ficheros(dir: string, acc: string[]): string[] {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return acc;
    for (const e of fs.readdirSync(full, { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) ficheros(rel, acc);
      else if (/\.tsx?$/.test(e.name)) acc.push(rel);
    }
    return acc;
  }

  test("ningún fichero imprime jerga", () => {
    const violaciones: string[] = [];
    for (const rel of DIRS.flatMap((d) => ficheros(d, []))) {
      const texto = fs.readFileSync(path.join(ROOT, rel), "utf8");
      for (const literal of PROHIBIDOS) {
        if (texto.includes(literal)) violaciones.push(`${rel}: ${literal}`);
      }
    }
    expect(violaciones).toEqual([]);
  });
});
