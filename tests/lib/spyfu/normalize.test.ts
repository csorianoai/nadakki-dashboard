import { describe, expect, it } from "@jest/globals";
import {
  adsListFromResponse,
  competitorsList,
  domainStatsSummary,
  keywordsSplit,
} from "@/lib/spyfu/normalize";

describe("adsListFromResponse", () => {
  it("reads ads array", () => {
    expect(adsListFromResponse({ ads: [{ title: "a" }] }).length).toBe(1);
  });
  it("reads data fallback", () => {
    expect(adsListFromResponse({ data: [{ title: "b" }] })[0].title).toBe("b");
  });
  it("returns empty for null", () => {
    expect(adsListFromResponse(null)).toEqual([]);
  });
});

describe("keywordsSplit", () => {
  it("splits paid and organic", () => {
    const { paid, organic } = keywordsSplit({
      paid: [{ keyword: "p" }],
      organic: [{ keyword: "o" }],
    });
    expect(paid[0].keyword).toBe("p");
    expect(organic[0].keyword).toBe("o");
  });
  it("reads paid_keywords alias", () => {
    const { paid } = keywordsSplit({ paid_keywords: [{ keyword: "x" }] });
    expect(paid.length).toBe(1);
  });
  it("reads nested data", () => {
    const { paid, organic } = keywordsSplit({
      data: { paid: [{ keyword: "1" }], organic: [{ keyword: "2" }] },
    });
    expect(paid.length).toBe(1);
    expect(organic.length).toBe(1);
  });
});

describe("competitorsList", () => {
  it("reads competitors", () => {
    expect(competitorsList({ competitors: [{ domain: "d.com" }] })[0].domain).toBe("d.com");
  });
  it("reads items fallback", () => {
    expect(competitorsList({ items: [{ domain: "x.com" }] }).length).toBe(1);
  });
});

describe("domainStatsSummary", () => {
  it("extracts from current", () => {
    const s = domainStatsSummary({
      current: { monthly_budget: 1, paid_clicks: 2, strength: 3, rank: 4 },
    });
    expect(s.monthlyBudget).toBe(1);
    expect(s.paidClicks).toBe(2);
    expect(s.strength).toBe(3);
    expect(s.rank).toBe(4);
  });
  it("extracts from stats[0] with budget alias", () => {
    const s = domainStatsSummary({
      stats: [{ budget: 9, clicks: 8, strength: 7, rank: 6 } as Record<string, unknown>],
    });
    expect(s.monthlyBudget).toBe(9);
    expect(s.paidClicks).toBe(8);
  });
  it("returns nulls when missing", () => {
    const s = domainStatsSummary({});
    expect(s.monthlyBudget).toBe(null);
  });
});
