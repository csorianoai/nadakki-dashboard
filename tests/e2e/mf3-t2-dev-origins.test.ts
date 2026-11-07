/**
 * MF3-T2 — `next dev` en 127.0.0.1 (servidor local de la evidencia) solo hidrata si 127.0.0.1 esta en
 * allowedDevOrigins (Next 16 bloquea /_next/* de origenes no permitidos y la pagina nunca llama al backend interceptado).
 * @jest-environment node
 */
import { readFileSync } from "fs";
import { join } from "path";

it("next.config permite 127.0.0.1 en dev", () => {
  const cfg = readFileSync(join(process.cwd(), "next.config.js"), "utf8");
  expect(cfg).toMatch(/allowedDevOrigins:\s*\[[^\]]*"127\.0\.0\.1"/);
});
