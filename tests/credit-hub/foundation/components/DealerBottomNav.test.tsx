import { render, screen } from "@testing-library/react";
import { DealerBottomNav } from "@/components/credit-hub/navigation/DealerBottomNav";
import { CREDIT_HUB_ES_DO } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer/applications",
}));

jest.mock("@/lib/credit-hub/i18n/useTranslations", () => ({
  useTranslations: () => CREDIT_HUB_ES_DO,
}));

describe("DealerBottomNav", () => {
  test("highlights active route", () => {
    render(<DealerBottomNav />);
    expect(screen.getByRole("link", { name: /Solicitudes/ })).toHaveAttribute("aria-current", "page");
  });

  test("primary action Plus is visually distinct", () => {
    render(<DealerBottomNav />);
    const primaryAction = screen.getByRole("link", { name: /Nueva solicitud/ });
    expect(primaryAction.querySelector(".from-forge-primary")).toBeInTheDocument();
  });
});
