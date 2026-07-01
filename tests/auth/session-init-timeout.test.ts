/**
 * M7 — session init must not hang indefinitely on /auth/refresh + /auth/me.
 */
import fs from "fs";
import path from "path";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf8");
}

describe("session init timeout (M7)", () => {
  const authCtx = readSrc("lib/auth/auth-context.tsx");
  const authV2 = readSrc("lib/api/auth-v2.ts");

  test("auth-context uses bounded SESSION_INIT_TIMEOUT_MS", () => {
    expect(authCtx).toMatch(/SESSION_INIT_TIMEOUT_MS\s*=\s*8_000/);
    expect(authCtx).toContain("setInitError");
    expect(authCtx).toContain("retryInit");
  });

  test("auth-v2 aborts hung auth fetches", () => {
    expect(authV2).toContain("AUTH_FETCH_TIMEOUT_MS");
    expect(authV2).toContain("AbortController");
    expect(authV2).toContain("AbortError");
  });
});
