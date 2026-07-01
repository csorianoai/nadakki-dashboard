import { isForgeMonetizacionEnabled } from "@/lib/env/feature-forge-monetizacion";

describe("isForgeMonetizacionEnabled", () => {
  const key = "NEXT_PUBLIC_FF_FORGE_MONETIZACION";

  afterEach(() => {
    delete process.env[key];
  });

  it("defaults OFF when unset", () => {
    delete process.env[key];
    expect(isForgeMonetizacionEnabled()).toBe(false);
  });

  it("enables with 1|true|on", () => {
    process.env[key] = "1";
    expect(isForgeMonetizacionEnabled()).toBe(true);
    process.env[key] = "true";
    expect(isForgeMonetizacionEnabled()).toBe(true);
    process.env[key] = "on";
    expect(isForgeMonetizacionEnabled()).toBe(true);
  });

  it("stays OFF for 0|false|off", () => {
    process.env[key] = "0";
    expect(isForgeMonetizacionEnabled()).toBe(false);
    process.env[key] = "false";
    expect(isForgeMonetizacionEnabled()).toBe(false);
  });
});
