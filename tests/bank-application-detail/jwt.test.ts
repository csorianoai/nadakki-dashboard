import { decodeJwtTid } from "@/lib/bank-application-detail/jwt";
import { makeBankTestJwt } from "./test-token";

describe("decodeJwtTid", () => {
  test("returns tid from valid JWT payload", () => {
    expect(decodeJwtTid(makeBankTestJwt("tenant-alpha"))).toBe("tenant-alpha");
  });

  test("returns null when payload has no tid", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "x" })).toString("base64url");
    expect(decodeJwtTid(`${header}.${payload}.x`)).toBeNull();
  });

  test("returns null on malformed token", () => {
    expect(decodeJwtTid("not-a-jwt")).toBeNull();
  });
});
