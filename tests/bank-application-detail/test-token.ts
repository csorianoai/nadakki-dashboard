/** Minimal JWT (unsigned) for unit/e2e: header.payload.sig — payload must include `tid`. */
export function makeBankTestJwt(tid: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ tid })).toString("base64url");
  return `${header}.${payload}.testsig`;
}
