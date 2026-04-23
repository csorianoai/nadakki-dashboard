import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompetitorResearchClient from "@/app/competitor-research/CompetitorResearchClient";

jest.mock("@/hooks/useSpyFuUsage", () => ({
  useSpyFuUsage: () => ({
    usage: {
      calls_made: 5,
      cache_hits: 2,
      rows_used: 10,
      rows_cap: 100,
      percent_used: 10,
      cost_estimate_usd: 0.5,
      cache_hit_rate_pct: 40,
    },
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock("@/hooks/useCompetitorSearch", () => ({
  useCompetitorSearch: () => ({
    loading: false,
    error: null,
    result: null,
    search: jest.fn(),
  }),
}));

jest.mock("@/hooks/useDeepAnalysis", () => ({
  useDeepAnalysis: () => ({
    loading: false,
    error: null,
    envelope: null,
    analyze: jest.fn(),
  }),
}));

jest.mock("@/hooks/useChatConversation", () => ({
  useChatConversation: () => ({
    messages: [],
    sending: false,
    send: jest.fn(),
    clear: jest.fn(),
    conversationId: undefined,
  }),
}));

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "tenant-x", setTenantId: jest.fn() }),
}));

describe("CompetitorResearchClient integration smoke", () => {
  it("renders title and switches tabs", async () => {
    const user = userEvent.setup();
    render(<CompetitorResearchClient />);
    expect(screen.getByRole("heading", { name: /competitor research/i })).toBeInTheDocument();
    expect(screen.getByText(/SpyFu usage/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /ask anything/i }));
    expect(screen.getByRole("tab", { name: /ask anything/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("shows Spanish title when language toggled", async () => {
    const user = userEvent.setup();
    render(<CompetitorResearchClient />);
    await user.click(screen.getByRole("button", { name: /^es$/i }));
    expect(
      screen.getByRole("heading", { name: /investigación de competencia/i })
    ).toBeInTheDocument();
  });
});
