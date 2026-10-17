/**
 * DB-CODEX-2: `next build` moría por OOM en CI (heap de ~2 GB agotado). El script `build`
 * fija su propio heap (4096 MB) y este test evita que se pierda sin avisar.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..", "..");

describe("build memory guard", () => {
  it("el script build fija un heap de al menos 4096 MB", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const match = /--max-old-space-size=(\d+)/.exec(pkg.scripts.build);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(4096);
  });
});
