/**
 * @jest-environment jsdom
 */

jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

import { parseDealerSocialConnection, SOCIAL_CONNECTIONS_PATH } from "@/lib/dealer/social-connections";

describe("dealer social connections parse", () => {
  test("does not invent platforms missing from the payload", () => {
    expect(parseDealerSocialConnection({ platform: "facebook", connected: true, account: "@patio" })).toEqual({
      platform: "facebook",
      connected: true,
      account: "@patio",
    });
    expect(parseDealerSocialConnection({ connected: true })).toBeNull();
    expect(parseDealerSocialConnection({ platform: "instagram", connected: false })).toEqual({
      platform: "instagram",
      connected: false,
      account: null,
    });
  });

  test("uses the authenticated-tenant OpenAPI path", () => {
    expect(SOCIAL_CONNECTIONS_PATH).toBe("/api/social/connections");
  });
});
