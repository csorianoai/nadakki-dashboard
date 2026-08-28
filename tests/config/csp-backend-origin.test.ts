import fs from "fs";
import path from "path";

describe("CSP backend origin", () => {
  test("connect-src is built from the configured backend, not a fixed host", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "..", "..", "next.config.js"), "utf8");
    const csp = source.match(/`default-src[\s\S]*?form-action 'self'`/)?.[0] ?? "";

    expect(csp).toContain("${configuredBackendUrl}");
    expect(csp).toContain("${configuredBackendWsUrl}");
    expect(csp).not.toContain("https://api.nadakki.com");
    expect(source).toContain("process.env.NEXT_PUBLIC_BACKEND_URL");
    expect(source).toContain("process.env.BACKEND_URL");
  });
});
