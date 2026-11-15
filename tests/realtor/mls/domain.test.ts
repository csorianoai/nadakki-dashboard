import { isBaylaraHost } from "@/lib/realtor/mls/domain";

describe("isBaylaraHost", () => {
  it("aprueba baylara.com", () => {
    expect(isBaylaraHost("baylara.com")).toBe(true);
  });
  it("aprueba www.baylara.com", () => {
    expect(isBaylaraHost("www.baylara.com")).toBe(true);
  });
  it("rechaza variantes que no son el dominio exacto", () => {
    expect(isBaylaraHost("staging.baylara.com")).toBe(false);
    expect(isBaylaraHost("preview.baylara.com")).toBe(false);
    expect(isBaylaraHost("baylara.com.evil.com")).toBe(false);
    expect(isBaylaraHost("notbaylara.com")).toBe(false);
  });
  it("rechaza hosts de Vercel, local y undefined", () => {
    expect(isBaylaraHost("nadakki-dashboard.vercel.app")).toBe(false);
    expect(isBaylaraHost("localhost")).toBe(false);
    expect(isBaylaraHost("localhost:3000")).toBe(false);
    expect(isBaylaraHost(null)).toBe(false);
    expect(isBaylaraHost(undefined)).toBe(false);
    expect(isBaylaraHost("")).toBe(false);
  });
  it("ignora el puerto en el host (pruebas locales)", () => {
    expect(isBaylaraHost("baylara.com:443")).toBe(true);
    expect(isBaylaraHost("www.baylara.com:443")).toBe(true);
  });
  it("es insensible a mayúsculas", () => {
    expect(isBaylaraHost("BAYLARA.COM")).toBe(true);
    expect(isBaylaraHost("WWW.BAYLARA.COM")).toBe(true);
  });
});
