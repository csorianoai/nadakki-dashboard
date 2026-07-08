import { render, screen } from "@testing-library/react";
import { DealerGoals } from "@/components/credit-hub/dealer/sections/DealerGoals";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";

jest.mock("@/lib/credit-hub/hooks/useMonthlyGoals");

const mockGoals = useMonthlyGoals as jest.Mock;

describe("DealerGoals honesty", () => {
  test("empty API response shows unavailable state, not hardcoded targets", () => {
    mockGoals.mockReturnValue({
      data: { goals: [], period: "2026-07", role_scope: "dealer" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<DealerGoals currency="DOP" />);
    expect(screen.getByText("Sin metas configuradas")).toBeInTheDocument();
    expect(screen.queryByText("55")).not.toBeInTheDocument();
  });
});
