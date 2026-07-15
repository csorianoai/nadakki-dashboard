/**
 * Autos Portal API E2E Tests — Playwright
 * Task Packet C-03: Real endpoint verification via HTTP.
 *
 * Tests finance calculator, amortization, inverse, and health endpoints
 * against a running FastAPI server.
 *
 * NOTE: DB-backed endpoints (vehicles, leads, dealers) are excluded
 * due to asyncpg :param::uuid cast incompatibility with local PG.
 * Production uses Supabase pooler (psycopg2) and is unaffected.
 *
 * Run: npx playwright test tests/e2e/test_autos_portal_api_e2e.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8899";

test.describe("Autos Portal Health", () => {
  test("GET /health returns healthy", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
  });
});

test.describe("Finance Calculator", () => {
  test("calculates monthly payment correctly", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/autos/finance/calculate`, {
      data: {
        vehicle_price: 1000000,
        down_payment: 200000,
        term_months: 60,
        annual_rate_pct: 12.0,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.monthly_payment).toBeGreaterThan(0);
    expect(body.principal).toBe(800000);
    expect(body.total_cost).toBeGreaterThan(1000000);
    expect(body.term_months).toBe(60);
    expect(body.annual_rate_pct).toBe(12.0);
    expect(body.down_payment).toBe(200000);
  });

  test("rejects negative vehicle price", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/autos/finance/calculate`, {
      data: {
        vehicle_price: -100000,
        down_payment: 20000,
        term_months: 60,
        annual_rate_pct: 12.0,
      },
    });
    expect(res.status()).toBe(422);
  });

  test("handles zero down payment", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/autos/finance/calculate`, {
      data: {
        vehicle_price: 500000,
        down_payment: 0,
        term_months: 36,
        annual_rate_pct: 10.0,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.principal).toBe(500000);
  });
});

test.describe("Amortization Schedule", () => {
  test("returns correct number of periods", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/autos/finance/amortization`, {
      data: {
        vehicle_price: 800000,
        down_payment: 160000,
        term_months: 48,
        annual_rate_pct: 11.0,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.periods).toBeDefined();
    expect(body.periods.length).toBe(48);
    // First payment should have higher interest than last
    const first = body.periods[0];
    const last = body.periods[47];
    expect(first.interest_portion).toBeGreaterThan(last.interest_portion);
    expect(first.principal_portion).toBeLessThan(last.principal_portion);
  });
});

test.describe("Inverse Calculator", () => {
  test("calculates max vehicle price from budget", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/v1/autos/finance/inverse`, {
      data: {
        monthly_budget: 15000,
        term_months: 60,
        annual_rate_pct: 12.0,
        down_payment: 100000,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.max_vehicle_price).toBeGreaterThan(0);
    expect(body.monthly_budget).toBe(15000);
    expect(body.down_payment).toBe(100000);
  });

  test("roundtrip: calculate then inverse", async ({ request }) => {
    // Calculate payment for a known vehicle
    const calcRes = await request.post(`${BASE_URL}/api/v1/autos/finance/calculate`, {
      data: {
        vehicle_price: 900000,
        down_payment: 180000,
        term_months: 60,
        annual_rate_pct: 12.0,
      },
    });
    const calc = await calcRes.json();

    // Use that payment to find max price via inverse
    const invRes = await request.post(`${BASE_URL}/api/v1/autos/finance/inverse`, {
      data: {
        monthly_budget: calc.monthly_payment,
        term_months: 60,
        annual_rate_pct: 12.0,
        down_payment: 180000,
      },
    });
    const inv = await invRes.json();

    // Should be close to original price (within 1 RD$)
    expect(Math.abs(inv.max_vehicle_price - 900000)).toBeLessThan(1);
  });
});

test.describe("OpenAPI Spec", () => {
  test("serves OpenAPI JSON", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/openapi.json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.openapi).toMatch(/^3\./);
    expect(body.paths).toBeDefined();
    expect(Object.keys(body.paths).length).toBeGreaterThan(10);
  });
});
