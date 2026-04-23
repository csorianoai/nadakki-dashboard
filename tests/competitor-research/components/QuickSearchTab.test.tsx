import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickSearchTab } from "@/app/competitor-research/components/QuickSearchTab";

const search = jest.fn();

jest.mock("@/hooks/useCompetitorSearch", () => ({
  useCompetitorSearch: () => ({
    loading: false,
    error: null,
    result: {
      ads: [],
      paidKeywords: [{ keyword: "boat" }],
      organicKeywords: [],
      ppcCompetitors: [],
      seoCompetitors: [],
      domainStatsRaw: null,
      overview: {
        monthlyBudget: 100,
        paidClicks: 50,
        strength: 2,
        rank: 3,
      },
    },
    search,
  }),
}));

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "t1", setTenantId: jest.fn() }),
}));

describe("QuickSearchTab", () => {
  beforeEach(() => {
    search.mockClear();
  });

  it("submits domain and triggers search", async () => {
    const user = userEvent.setup();
    render(<QuickSearchTab lang="en" />);
    await user.type(screen.getByLabelText(/domain/i), "boatsetter.com");
    await user.click(screen.getByRole("button", { name: /search/i }));
    expect(search).toHaveBeenCalledWith("boatsetter.com", "US", "t1");
  });

  it("shows overview when result present", () => {
    render(<QuickSearchTab lang="en" />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText(/boat/i)).toBeInTheDocument();
  });
});
