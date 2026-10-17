/**
 * `next build` aborta con "JavaScript heap out of memory" a ~1,5 GB (heap por defecto de node) en el runner de CI,
 * que ejecuta `npm run build` sin NODE_OPTIONS. El heap debe viajar en el propio script de build.
 */
import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("script de build", () => {
  test.each(["build", "build:webpack"])("%s fija el heap de node en 4 GB", (nombre) => {
    expect(pkg.scripts[nombre]).toMatch(/--max-old-space-size=4096/);
  });
});
