import fs from "fs";
import path from "path";

// Fuera de alcance de PS-8 (tarjeta): Legal, Realtor, DASH-NAV, DASH-DEALER-CREDIT.
const EXCLUDED = [/legal/i, /realtor/i, /dealer-credit/i, /components\/nav/i, /components\/layout/i];
const IDS = "tenantId|tenant_id|tid|effectiveTenant|userId|user_id";
// {tenantId}, {tenantId ?? "—"}, {tenantId || x} como hijo de texto JSX (no atributos).
const CHILD_RE = new RegExp(`(^|[>\\s])\\{\\s*(${IDS})(\\s*(\\?\\?|\\|\\|)[^}]*)?\\}`);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("ninguna pantalla pinta un id de tenant/usuario como texto", () => {
  const files = [...walk("app"), ...walk("components")].filter((f) => !EXCLUDED.some((r) => r.test(f)));
  it("hay ficheros que escanear", () => expect(files.length).toBeGreaterThan(50));
  it("sin {tenantId}/{tid}/{effectiveTenant} como texto visible", () => {
    const hits: string[] = [];
    for (const f of files) {
      fs.readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("{/*")) return;
        if (CHILD_RE.test(line) && !/=\{/.test(line.split(CHILD_RE)[0] ?? "")) hits.push(`${f}:${i + 1}: ${t}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
