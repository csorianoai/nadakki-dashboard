import { render, screen } from "@testing-library/react";
import { CHFeatureFlagBanner } from "@/components/credit-hub/system/CHFeatureFlagBanner";
import { useFeatureFlag } from "@/lib/credit-hub/hooks/useFeatureFlag";

jest.mock("@/lib/credit-hub/hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(),
}));

const mockUseFeatureFlag = useFeatureFlag as jest.Mock;

describe("CHFeatureFlagBanner", () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockReset();
  });

  test("shows when feature disabled", () => {
    mockUseFeatureFlag.mockReturnValue({ enabled: false, loading: false });
    render(<CHFeatureFlagBanner />);

    expect(screen.getByText(/Forge está instalado/)).toBeInTheDocument();
  });

  test("hidden when feature enabled", () => {
    mockUseFeatureFlag.mockReturnValue({ enabled: true, loading: false });
    render(<CHFeatureFlagBanner />);

    expect(screen.queryByText(/Forge está instalado/)).not.toBeInTheDocument();
  });
});
