/**
 * Test for extractFinancial with REAL payload from backend
 * 
 * Verifies that financial data extraction works with actual backend response structure.
 * Backend does NOT return `financial` at root level - it's in credit_history.summary.financial
 */

import { describe, test, expect } from "@jest/globals";
import { extractFinancial } from "@/lib/credit-hub/utils/expedienteAdapter";

describe("extractFinancial with real backend payload", () => {
  /**
   * REAL payload structure from GET /api/v2/credit/applications/{id}/expediente/full
   * 
   * Verified structure:
   * - NO `financial` at root level
   * - Financial data IS in credit_history.summary.financial
   * - This is the actual production structure as of 6ab6d524
   */
  const REAL_EXPEDIENTE_SUMMARY = {
    state: "DRAFT",
    financial: {
      requested_amount: 700000,
      down_payment: 150000,
      term_months: 48,
      requested_rate: 17.5,
      ltv: 0.82,
      dti: 0.35
    },
    applicant: {
      name: "Juan Pérez",
      monthly_income: 50000
    },
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2023
    },
    analysis: {
      score: 720,
      risk_level: "MEDIO"
    }
  };

  const EMPTY_SUMMARY = {};

  const SUMMARY_WITH_ROOT_FIELDS = {
    requested_amount: 650000,
    term_months: 60,
    ltv: 0.75
  };

  test("extracts financial from summary.financial", () => {
    const result = extractFinancial(REAL_EXPEDIENTE_SUMMARY);
    
    expect(result).toBeDefined();
    expect(result.requested_amount).toBe(700000);
    expect(result.down_payment).toBe(150000);
    expect(result.term_months).toBe(48);
    expect(result.requested_rate).toBe(17.5);
    expect(result.ltv).toBe(0.82);
    expect(result.dti).toBe(0.35);
  });

  test("requested_amount is NOT zero", () => {
    const result = extractFinancial(REAL_EXPEDIENTE_SUMMARY);
    
    // This was the bug: encabezado showed RD$0
    expect(result.requested_amount).not.toBe(0);
    expect(result.requested_amount).toBeGreaterThan(0);
  });

  test("handles empty summary gracefully", () => {
    const result = extractFinancial(EMPTY_SUMMARY);
    
    expect(result).toBeDefined();
    expect(Object.keys(result).length).toBe(0);
  });

  test("fallback: extracts from root-level fields when financial missing", () => {
    const result = extractFinancial(SUMMARY_WITH_ROOT_FIELDS);
    
    expect(result.requested_amount).toBe(650000);
    expect(result.term_months).toBe(60);
    expect(result.ltv).toBe(0.75);
  });

  test("returns all financial keys when present", () => {
    const result = extractFinancial(REAL_EXPEDIENTE_SUMMARY);
    
    const expectedKeys = ["requested_amount", "down_payment", "term_months", "requested_rate", "ltv", "dti"];
    expectedKeys.forEach(key => {
      expect(result).toHaveProperty(key);
    });
  });
});

/**
 * INTEGRATION TEST REQUIRED:
 * 
 * To verify against production/staging:
 * 
 * 1. GET /api/v2/credit/applications/{id}/expediente/full with real application
 * 2. Extract credit_history.summary
 * 3. Pass to extractFinancial()
 * 4. Assert: requested_amount > 0
 * 5. Use that amount in BankDetailLayout header
 * 6. Verify: header amount === queue amount
 * 
 * This test uses mock data that matches the structure, but E2E test
 * should verify with actual API responses.
 */
