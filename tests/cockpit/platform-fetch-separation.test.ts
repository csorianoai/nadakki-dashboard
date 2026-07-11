import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..", "..");

const PLATFORM_PREFIXES = ["/api/v1/cockpit"];

function readFile(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function grepFiles(dir: string, pattern: RegExp): string[] {
  const hits: string[] = [];
  if (!fs.existsSync(dir)) return hits;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") {
      hits.push(...grepFiles(full, pattern));
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      const text = fs.readFileSync(full, "utf8");
      if (pattern.test(text)) hits.push(full);
    }
  }
  return hits;
}

describe("platform vs tenant fetch separation", () => {
  test("platformApi does not import chFetch client", () => {
    const src = readFile("lib/platformApi.ts");
    expect(src).not.toMatch(/from ["']@\/lib\/credit-hub\/api\/client/);
    expect(src).not.toMatch(/["']X-Tenant-ID["']/);
  });

  test("chFetch client does not call platform API prefixes", () => {
    const src = readFile("lib/credit-hub/api/client.ts");
    for (const prefix of PLATFORM_PREFIXES) {
      expect(src).not.toContain(prefix);
    }
  });

  test("cockpit api modules use platformFetch only for platform paths", () => {
    const cockpitApiDir = path.join(ROOT, "lib", "cockpit", "api");
    const files = grepFiles(cockpitApiDir, /platformFetch|chFetch/);
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      const src = fs.readFileSync(file, "utf8");
      expect(src).not.toMatch(/chFetch/);
      if (src.includes("platformFetch")) {
        expect(rel).toMatch(/^lib\/cockpit\/api\//);
      }
    }
  });

  test("platformApi exports prefix guard", () => {
    const { isPlatformApiPath, PLATFORM_API_PREFIXES } = require("@/lib/platformApi");
    expect(PLATFORM_API_PREFIXES.length).toBeGreaterThan(0);
    expect(isPlatformApiPath("/api/v1/cockpit/network/health")).toBe(true);
    expect(isPlatformApiPath("/api/v2/credit/stats")).toBe(false);
  });
});
