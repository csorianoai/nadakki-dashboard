import { readFileSync } from "fs";
import { join } from "path";

// El typecheck del proyecto ya no cabe en el heap por defecto del runner (OOM a 512 MB).
describe("scripts de typecheck", () => {
  const scripts = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8")).scripts;

  it.each(["typecheck", "type-check"])("%s fija el heap de node en 4096 MB", (nombre) => {
    expect(scripts[nombre]).toContain("--max-old-space-size=4096");
  });
});
