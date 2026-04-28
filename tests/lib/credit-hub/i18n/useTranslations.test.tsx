import { renderHook } from "@testing-library/react";
import * as UseTenantConfig from "@/lib/credit-hub/hooks/useTenantConfig";
import { getDefaultTenantBankingConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

describe("useTranslations", () => {
  it("returns es-DO translations by default", () => {
    const { result } = renderHook(() => useTranslations());
    expect(result.current.common.submit).toBe("Enviar solicitud");
  });

  it("falls back to es-DO if locale unknown", () => {
    const spy = jest.spyOn(UseTenantConfig, "useTenantConfig").mockReturnValue({
      tenantConfig: { ...getDefaultTenantBankingConfig("tenant-i18n-test"), locale: "fr-FR" },
      loading: false,
    });
    const { result } = renderHook(() => useTranslations());
    expect(result.current.common.submit).toBe("Enviar solicitud");
    spy.mockRestore();
  });
});
