import { CLIENT_MAX_FILE_BYTES, TARGET_COMPRESSED_BYTES } from "@/lib/customer/upload/constants";
import { decodeUploadTokenPayload } from "@/lib/customer/upload/decodeTokenPayload";
import { messages } from "@/lib/customer/upload/messages";
import { validateEndpointUrl } from "@/lib/customer/upload/validateUploadToken";

function makePreviewToken(overrides: Record<string, unknown> = {}): string {
  const payload = {
    v: 1,
    t: "11111111-1111-1111-1111-111111111111",
    a: "22222222-2222-2222-2222-222222222222",
    s: "33333333-3333-3333-3333-333333333333",
    d: "44444444-4444-4444-4444-444444444444",
    exp: Math.floor(Date.now() / 1000) + 3600,
    nonce: "abcd",
    ...overrides,
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  return `${b64}.ignored-signature`;
}

describe("EP-T4-5 mobile upload lib", () => {
  test("decodeUploadTokenPayload parses signed token payload segment", () => {
    const t = makePreviewToken();
    const p = decodeUploadTokenPayload(t);
    expect(p).not.toBeNull();
    expect(p?.a).toBe("22222222-2222-2222-2222-222222222222");
    expect(p?.s).toBe("33333333-3333-3333-3333-333333333333");
  });

  test("decodeUploadTokenPayload returns null on malformed token", () => {
    expect(decodeUploadTokenPayload("nope")).toBeNull();
    expect(decodeUploadTokenPayload("e30")).toBeNull();
  });

  test("decodeUploadTokenPayload rejects missing required string fields", () => {
    const t = makePreviewToken({ nonce: "" });
    expect(decodeUploadTokenPayload(t)).toBeNull();
  });

  test("validateEndpointUrl includes application, stipulation, and token query", () => {
    const u = validateEndpointUrl("app-1", "stip-2", "tok&=");
    expect(u).toContain("/api/v2/credit/applications/app-1/stipulations/stip-2/upload-link/validate");
    expect(u).toContain("token=");
    expect(u).toContain(encodeURIComponent("tok&="));
  });

  test("constants match spec limits", () => {
    expect(CLIENT_MAX_FILE_BYTES).toBe(5 * 1024 * 1024);
    expect(TARGET_COMPRESSED_BYTES).toBe(500 * 1024);
  });

  test("messages are Spanish locale strings", () => {
    expect(messages.successTitle).toContain("Listo");
    expect(messages.offline.toLowerCase()).toContain("conexión");
  });
});
