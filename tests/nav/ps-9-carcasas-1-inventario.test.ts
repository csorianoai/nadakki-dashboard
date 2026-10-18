/**
 * PS-9-CARCASAS-1 (PARTE 1/3, inventario): fija QUIÉN importa cada carcasa de Credit Hub, para que la migración
 * a ModuleShell (que exige tocar lib/modulos/registro.ts, AppGate y BankChShell/DealerChShell, fuera de DASH-NAV)
 * sepa exactamente qué retirar. Criterio (d): la carcasa vieja se borra solo cuando este inventario queda vacío.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");
const IGNORAR = new Set(["node_modules", ".next", ".git", "tests", "e2e"]);

function fuentes(dir: string, salida: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) fuentes(p, salida);
    else if (/\.(ts|tsx)$/.test(e.name)) salida.push(p);
  }
  return salida;
}

function importadores(patron: RegExp, propio: string): string[] {
  return ["app", "components", "lib"]
    .flatMap((d) => fuentes(path.join(ROOT, d)))
    .filter((f) => !f.endsWith(propio) && patron.test(fs.readFileSync(f, "utf8")))
    .map((f) => path.relative(ROOT, f).split(path.sep).join("/"))
    .sort();
}

describe("PS-9-CARCASAS-1: inventario de importadores de las carcasas de Credit Hub", () => {
  test("ChAppShell lo importan solo BankChShell y DealerChShell", () => {
    expect(importadores(/credit-hub\/shell\/ChAppShell["']/, "ChAppShell.tsx")).toEqual([
      "components/credit-hub/bank/BankChShell.tsx",
      "components/credit-hub/dealer/DealerChShell.tsx",
    ]);
  });

  test("ForgeCreditHubAppShell solo se monta desde el layout de Credit Hub (vía el índice de forge)", () => {
    expect(importadores(/ForgeCreditHubAppShell/, "ForgeCreditHubAppShell.tsx").filter((f) => f.startsWith("app/"))).toEqual([
      "app/(forge)/credit-hub/CreditHubLayoutClient.tsx",
    ]);
  });

  test("RealtorShell y MonetizacionShell no se tocan en esta parte", () => {
    expect(fs.existsSync(path.join(ROOT, "components/realtor/shell/RealtorShell.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, "components/credit-hub/monetizacion/shell/MonetizacionShell.tsx"))).toBe(true);
  });
});
