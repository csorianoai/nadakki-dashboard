import { render, screen } from "@testing-library/react";
import DealerLayout from "@/app/(forge)/credit-hub/dealer/layout";

jest.mock("next/navigation", () => ({
  usePathname: () => "/credit-hub/dealer",
}));

jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({
  useTenant: () => ({ tenantId: "tenant-1", tenantSlug: "tenant-1", loading: false }),
}));

jest.mock("@/lib/credit-hub/hooks/useFeatureFlag", () => ({
  useFeatureFlag: () => ({ enabled: true, loading: false }),
}));

describe("skip to content", () => {
  test("renders skip link and main content target", () => {
    render(
      <DealerLayout>
        <div>Dashboard</div>
      </DealerLayout>
    );

    expect(screen.getByRole("link", { name: "Saltar al contenido principal" })).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
