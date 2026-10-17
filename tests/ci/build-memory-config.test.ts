/**
 * DB-CODEX-2: `next build` moría por OOM con el heap de 1536 MB que exporta
 * superloop/dashboard_ci.sh. El script `build` fija su propio heap y la config
 * de Next baja el pico de memoria. Este test evita que se pierda sin avisar.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..", "..");

describe("build memory guard", () => {
  it("el script build fija un heap de al menos 2048 MB", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const match = /--max-old-space-size=(\d+)/.exec(pkg.scripts.build);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(2048);
  });

  it("next.config.js reduce el pico de memoria del build", () => {
    const cfg = fs.readFileSync(path.join(root, "next.config.js"), "utf8");
    expect(cfg).toMatch(/productionBrowserSourceMaps:\s*false/);
    expect(cfg).toMatch(/webpackMemoryOptimizations:\s*true/);
    expect(cfg).toMatch(/cpus:\s*1/);
  });
});
