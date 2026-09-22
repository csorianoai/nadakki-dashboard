/**
 * @jest-environment jsdom
 */

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

import {
  parseCommercialSponsorship,
  parseSponsorshipPayload,
  sponsorshipCopy,
  visibleSponsorshipCopy,
} from "@/lib/access/sponsorship";

const COMMERCIAL = {
  subscription_id: "sub-1",
  beneficiary_unit_id: "ou-1",
  payer_tenant_id: "bank-tenant",
  inherits_to_children: true,
  starts_at: "2026-01-01T00:00:00Z",
  ends_at: "2026-12-31T00:00:00Z",
  status: "active",
  payer_name: "Banco X",
};

describe("commercial sponsorship parser", () => {
  test("keeps commercial columns and payer_name", () => {
    expect(parseCommercialSponsorship(COMMERCIAL)).toEqual(COMMERCIAL);
  });

  test("drops payer_account_id and legal fields", () => {
    const parsed = parseCommercialSponsorship({
      ...COMMERCIAL,
      payer_account_id: "acc-secret",
      rnc: "1-23-45678",
      legal_name: "Banco X, S.A.",
      tax_id: "001",
    });
    expect(parsed).toEqual(COMMERCIAL);
    expect(JSON.stringify(parsed)).not.toContain("payer_account_id");
    expect(JSON.stringify(parsed)).not.toContain("rnc");
    expect(JSON.stringify(parsed)).not.toContain("legal_name");
  });

  test("rejects rows without subscription_id", () => {
    expect(parseCommercialSponsorship({ payer_name: "Banco X" })).toBeNull();
  });

  test("copy is patrocinado por payer_name", () => {
    expect(sponsorshipCopy("Banco X")).toBe("patrocinado por Banco X");
    expect(
      visibleSponsorshipCopy(parseSponsorshipPayload({ sponsorships: [COMMERCIAL, COMMERCIAL] })),
    ).toEqual(["patrocinado por Banco X"]);
  });

  test("skips rows without payer_name; does not invent a bank", () => {
    expect(
      visibleSponsorshipCopy(
        parseSponsorshipPayload({
          sponsorships: [{ ...COMMERCIAL, payer_name: "" }, { ...COMMERCIAL, payer_name: null }],
        }),
      ),
    ).toEqual([]);
  });
});
