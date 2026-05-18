export type UploadTokenPayload = {
  v: number;
  t: string;
  a: string;
  s: string;
  d: string;
  exp: number;
  nonce: string;
};

function b64UrlToUtf8(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = base64 + pad;
  if (typeof atob !== "undefined") {
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      /* fall through to Buffer */
    }
  }
  try {
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch {
    try {
      return Buffer.from(segment, "base64url").toString("utf-8");
    } catch {
      return "";
    }
  }
}

/**
 * Decode upload token payload (first segment only). Does NOT verify HMAC — server must validate.
 */
export function decodeUploadTokenPayload(token: string): UploadTokenPayload | null {
  try {
    const t = token.trim();
    const dot = t.indexOf(".");
    if (dot <= 0) return null;
    const payloadB64 = t.slice(0, dot);
    const json = b64UrlToUtf8(payloadB64);
    const raw = JSON.parse(json) as Record<string, unknown>;
    const v = raw.v;
    const exp = raw.exp;
    if (typeof v !== "number" || typeof exp !== "number") return null;
    for (const key of ["t", "a", "s", "d", "nonce"]) {
      if (typeof raw[key] !== "string" || !String(raw[key]).trim()) return null;
    }
    return raw as unknown as UploadTokenPayload;
  } catch {
    return null;
  }
}
