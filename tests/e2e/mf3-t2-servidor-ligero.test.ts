/**
 * MF3-T2 (diagnose, vuelta 2) — el webServer de la evidencia playwright en CI no debe construir la app.
 * Medido: `next build --webpack` llega a 2,87 GB de RSS y el runner de CI tiene MemoryMax 2560M, asi que el build se
 * cuelga y Playwright agota 1.800.000 ms esperando `/login` ("Timed out waiting 1800000ms from config.webServer").
 * `next dev` sirve /login y /autos/vehiculos con ~220 MB. Este test fija esa condicion.
 * @jest-environment node
 */
import { readFileSync } from "fs";
import { join } from "path";

const cfg = readFileSync(join(process.cwd(), "playwright.config.ts"), "utf8");

describe("MF3-T2: servidor local de la evidencia", () => {
  it("no ejecuta `next build` en el webServer (no cabe en la memoria del runner)", () => {
    const web = cfg.slice(cfg.indexOf("webServer:"));
    expect(web).not.toMatch(/npm run build|next build/);
    expect(web).toMatch(/next dev/);
  });

  it("sigue siendo hermetico: backend que no resuelve y timeout acotado", () => {
    expect(cfg).toContain("backend.invalid");
    expect(cfg).toMatch(/webServer:\s*LOCAL_CI/);
    expect(cfg).not.toMatch(/timeout:\s*1_800_000/);
  });
});
