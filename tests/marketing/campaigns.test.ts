import * as fs from "fs";
import * as path from "path";
import {
  normalizeMarketingAgents,
  normalizeMarketingCampaigns,
} from "@/lib/api/marketing";
import {
  agentDisplayName,
  agentRowId,
  campaignDisplayName,
  campaignDisplayStatus,
  campaignRowId,
} from "@/lib/marketing-api";

function readSrc(relPath: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relPath), "utf-8");
}

describe("marketing core — agent listing", () => {
  it("unwraps success.data.agents with pagination total", () => {
    const json = {
      success: true,
      data: {
        agents: [{ id: "a1", name: "Agent One" }, { id: "a2", name: "Agent Two" }],
        pagination: { total: 46, limit: 100, offset: 0, has_more: false },
      },
    };
    const { agents, total } = normalizeMarketingAgents(json);
    expect(agents).toHaveLength(2);
    expect(total).toBe(46);
  });

  it("returns agent count from array length when pagination absent", () => {
    const { agents, total } = normalizeMarketingAgents({
      agents: [{ id: "x" }, { id: "y" }, { id: "z" }],
    });
    expect(agents).toHaveLength(3);
    expect(total).toBe(3);
  });

  it("formats agent display helpers", () => {
    expect(agentDisplayName({ name: "Email Agent" })).toBe("Email Agent");
    expect(agentRowId({ id: "routes__foo", name: "Foo" })).toBe("routes__foo");
  });
});

describe("marketing core — campaigns", () => {
  it("normalizes campaigns list from wrapped payload", () => {
    const { campaigns, total } = normalizeMarketingCampaigns({
      success: true,
      data: {
        campaigns: [{ id: "c1", name: "Launch", status: "draft" }],
        total: 1,
      },
    });
    expect(campaigns).toHaveLength(1);
    expect(total).toBe(1);
    expect(campaignDisplayName(campaigns[0])).toBe("Launch");
    expect(campaignDisplayStatus(campaigns[0])).toBe("draft");
    expect(campaignRowId(campaigns[0])).toBe("c1");
  });

  it("handles empty campaigns response safely", () => {
    const { campaigns, total } = normalizeMarketingCampaigns({});
    expect(campaigns).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("marketing core — API client surface", () => {
  const marketingApiSrc = readSrc("lib/marketing-api.ts");
  const marketingLibSrc = readSrc("lib/api/marketing.ts");
  const endpointsSrc = readSrc("lib/api/endpoints.ts");

  it("exports fetchAgents, fetchCampaigns, createCampaign, executeCampaign", () => {
    expect(marketingApiSrc).toContain("export async function fetchAgents");
    expect(marketingApiSrc).toContain("export async function fetchCampaigns");
    expect(marketingApiSrc).toContain("export async function createCampaign");
    expect(marketingApiSrc).toContain("export async function executeCampaign");
  });

  it("defines campaign execute endpoint", () => {
    expect(endpointsSrc).toContain("CAMPAIGN_EXECUTE");
    expect(endpointsSrc).toContain("/execute");
  });

  it("implements executeMarketingCampaign with activate fallback", () => {
    expect(marketingLibSrc).toContain("executeMarketingCampaign");
    expect(marketingLibSrc).toContain("activateMarketingCampaign");
  });
});

describe("marketing core — dashboard pages & components", () => {
  it("includes marketing dashboard page", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../../app/marketing/dashboard/page.tsx"))).toBe(true);
  });

  it("includes CampaignCard, AgentGrid, ScheduleCalendar components", () => {
    const base = path.resolve(__dirname, "../../components/marketing");
    expect(fs.existsSync(path.join(base, "CampaignCard.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(base, "AgentGrid.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(base, "ScheduleCalendar.tsx"))).toBe(true);
  });

  it("campaign detail page exists", () => {
    expect(fs.existsSync(path.resolve(__dirname, "../../app/marketing/campaigns/[id]/page.tsx"))).toBe(true);
  });
});
