import { adaptBrandingToConfigShape } from "@/lib/credit-hub/utils/adaptBrandingToConfigShape";
import type { TenantBranding } from "@/lib/credit-hub/types/tenantBranding";

const baseBranding: TenantBranding = {
  tenant_id: "credicefi",
  display_name: "Credicefi",
  logo_url: "https://cdn.nadakki.com/logos/credicefi.svg",
  brand_primary: "#1b4a8c",
  brand_dark: "#081e3d",
  locale: "es-DO",
  currency: "DOP",
  regulatory_profile: "DO_LEY_172_13",
  application_status_labels: {
    DRAFT: "Borrador",
    SUBMITTED: "Enviada",
    PENDING_REVIEW: "En revisión",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
  },
  copy_overrides: {},
};

describe("adaptBrandingToConfigShape", () => {
  it("preserves all default banking policy fields", () => {
    const result = adaptBrandingToConfigShape(baseBranding, "credicefi");

    expect(result.dti_max).toBe(0.4);
    expect(result.ltv_max).toBe(0.95);
    expect(result.allowed_terms).toEqual([12, 24, 36, 48, 60, 72, 84]);
    expect(result.features_enabled.garante_required).toBe(false);
    expect(result.document_types.primary_id).toBe("CEDULA");
    expect(result.vehicle_types).toEqual(["Nuevo", "Usado", "Demo"]);
    expect(result.product_types).toContain("Vehículo nuevo");
    expect(result.min_age).toBe(18);
    expect(result.max_age).toBe(75);
  });

  it("overrides chrome fields from branding", () => {
    const result = adaptBrandingToConfigShape(baseBranding, "credicefi");

    expect(result.institution_name).toBe(baseBranding.display_name);
    expect(result.currency_code).toBe(baseBranding.currency);
    expect(result.country_code).toBe("DO");
    expect(result.locale).toBe(baseBranding.locale);
    expect(result.regulatory_profile).toBe(baseBranding.regulatory_profile);
    expect(result.branding.logo_url).toBe(baseBranding.logo_url);
    expect(result.branding.primary_color).toBe(baseBranding.brand_primary);
    expect(result.branding.secondary_color).toBe(baseBranding.brand_dark);
    expect(result.branding.accent_color).toBe(baseBranding.brand_primary);
  });

  it("falls back to default currency_symbol for unknown currency", () => {
    const result = adaptBrandingToConfigShape(
      { ...baseBranding, currency: "XYZ" },
      "x",
    );

    expect(result.currency_symbol).toBe("RD$");
    expect(result.currency_code).toBe("XYZ");
  });

  it("handles malformed locale gracefully", () => {
    const result = adaptBrandingToConfigShape(
      { ...baseBranding, locale: "es" },
      "x",
    );

    expect(result.country_code).toBe("DO");
    expect(result.locale).toBe("es");
  });
});
