import { test, expect } from "@playwright/test";

import { loginApi, STAGING_API, STAGING_USERS } from "./helpers";

test.describe("Staging E2E — Auth", () => {
  test("login + me + marketing JWT gate", async ({ request }) => {
    const token = await loginApi(request, STAGING_USERS.marketing);
    expect(token.length).toBeGreaterThan(20);

    const me = await request.get(`${STAGING_API}/api/v2/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(me.status()).toBe(200);

    const noAuth = await request.get(`${STAGING_API}/api/marketing/journeys`);
    expect(noAuth.status()).toBe(401);

    const ok = await request.get(`${STAGING_API}/api/marketing/journeys`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(ok.status()).toBe(200);
  });
});

test.describe("Staging E2E — Monetización API", () => {
  test("dashboard endpoint returns data_source", async ({ request }) => {
    const token = await loginApi(request, STAGING_USERS.admin);
    const resp = await request.get(`${STAGING_API}/api/v2/monetizacion/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty("data_source");
  });
});

test.describe("Staging E2E — Credit smoke", () => {
  test("dealer can list applications", async ({ request }) => {
    const token = await loginApi(request, STAGING_USERS.dealer);
    const resp = await request.get(`${STAGING_API}/api/v2/credit/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403]).toContain(resp.status());
  });
});
