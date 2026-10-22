/** @jest-environment node */
import fs from "fs";
import path from "path";

const SCRIPT = path.join(__dirname, "RESULT_DB_CODEX_8C.sh");
const ROOT = path.resolve(__dirname, "../../../../..");

describe("RESULT_DB_CODEX_8C.sh", () => {
  const text = fs.readFileSync(SCRIPT, "utf8");

  it("emite RESULT_DB_CODEX_8C=PASS/FAIL", () => {
    expect(text).toContain('echo "RESULT_DB_CODEX_8C=PASS"');
    expect(text).toContain('echo "RESULT_DB_CODEX_8C=FAIL"');
  });

  it("solo ejecuta ficheros de test que existen", () => {
    const refs = text.match(/[\w./-]+\.test\.tsx?/g) ?? [];
    expect(refs.length).toBeGreaterThan(0);
    for (const rel of refs) {
      expect(fs.existsSync(path.join(ROOT, rel))).toBe(true);
    }
  });
});
