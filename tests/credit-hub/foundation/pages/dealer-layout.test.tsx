import { render, screen } from "@testing-library/react";
import DealerLayout from "@/app/(forge)/credit-hub/dealer/layout";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-1", tenantSlug: "tenant-1", loading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => ({ enabled: true, loading: false }),
}));

describe("DealerLayout", () => {
  test("renders dealer shell with navigation and children", () => {
    render(
      <DealerLayout>
        <div>Dealer child</div>
      </DealerLayout>
    );

    expect(screen.getByText("Dealer child")).toBeInTheDocument();
    expect(screen.getAllByText("Solicitudes")[0]).toBeInTheDocument();
    expect(screen.getByText("Nueva")).toBeInTheDocument();
  });
});
