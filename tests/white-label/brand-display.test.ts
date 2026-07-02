import {
  NEUTRAL_PLATFORM_TITLE,
  resolveBrandDisplayName,
  resolveForgeWordmarkLabel,
  resolveVisiblePlatformTitle,
  consentCheckboxDataPolicy,
  consentDataPolicyLabel,
  consentFooterBrand,
  pwaInstallTitle,
} from "@/lib/white-label/brand-display";

describe("white-label brand-display", () => {
  it("tenant A sees display_name Credicefi", () => {
    expect(resolveVisiblePlatformTitle({ display_name: "Credicefi" }, null)).toBe("Credicefi");
  });

  it("tenant B sees display_name Banco Piloto RD", () => {
    expect(resolveVisiblePlatformTitle({ display_name: "Banco Piloto RD" }, null)).toBe("Banco Piloto RD");
  });

  it("external bank fallback never contains Nadakki literal", () => {
    expect(resolveVisiblePlatformTitle(null, null)).toBe(NEUTRAL_PLATFORM_TITLE);
    expect(resolveVisiblePlatformTitle(null, null)).not.toMatch(/nadakki/i);
    expect(resolveForgeWordmarkLabel(null, null)).not.toMatch(/nadakki/i);
  });

  it("Nadakki tenant keeps branding when API defines it", () => {
    expect(resolveBrandDisplayName({ display_name: "Nadakki" }, null)).toBe("Nadakki");
    expect(resolveForgeWordmarkLabel({ display_name: "Nadakki" }, null)).toBe("Nadakki Forge");
  });

  it("consent copy uses institution name not platform vendor", () => {
    expect(consentDataPolicyLabel("Credicefi")).toBe("Política de tratamiento de datos de Credicefi");
    expect(consentFooterBrand("Banco Piloto RD")).not.toMatch(/nadakki/i);
    expect(consentCheckboxDataPolicy("Credicefi")).not.toMatch(/nadakki/i);
  });

  it("PWA install title uses tenant name or neutral", () => {
    expect(pwaInstallTitle("Credicefi")).toBe("Instalar Credicefi");
    expect(pwaInstallTitle(null)).toBe("Instalar aplicación");
    expect(pwaInstallTitle(null)).not.toMatch(/nadakki/i);
  });
});
