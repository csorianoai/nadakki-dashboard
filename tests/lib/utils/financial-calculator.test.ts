import {
  calculatePMT,
  calculateLTV,
  calculateDTI,
  calculatePaymentCapacity,
  calculateAmountToFinance,
} from "@/lib/credit/utils/financial-calculator";

describe("financial-calculator", () => {
  describe("calculatePMT", () => {
    it("returns 0 for zero months", () => {
      expect(calculatePMT(100000, 12, 0)).toBe(0);
    });
    it("returns 0 for zero principal", () => {
      expect(calculatePMT(0, 12, 36)).toBe(0);
    });
    it("returns principal/months for 0% rate", () => {
      expect(calculatePMT(120000, 0, 12)).toBe(10000);
    });
    it("calculates ~3321 for 100k @ 12% / 36 months", () => {
      expect(calculatePMT(100000, 12, 36)).toBeCloseTo(3321.43, 1);
    });
    it("calculates higher payment for shorter term", () => {
      const long = calculatePMT(100000, 12, 60);
      const short = calculatePMT(100000, 12, 24);
      expect(short).toBeGreaterThan(long);
    });
  });

  describe("calculateLTV", () => {
    it("returns 0 if vehicle value is 0", () => {
      expect(calculateLTV(50000, 0)).toBe(0);
    });
    it("returns 0 if vehicle value is negative", () => {
      expect(calculateLTV(50000, -100)).toBe(0);
    });
    it("calculates 80% LTV correctly", () => {
      expect(calculateLTV(80000, 100000)).toBe(80);
    });
    it("calculates 100% LTV at full financing", () => {
      expect(calculateLTV(100000, 100000)).toBe(100);
    });
  });

  describe("calculateDTI", () => {
    it("returns 0 if income is 0", () => {
      expect(calculateDTI(5000, 0)).toBe(0);
    });
    it("calculates 33.33% DTI correctly", () => {
      expect(calculateDTI(5000, 15000)).toBeCloseTo(33.33, 2);
    });
    it("returns 100 when debts equal income", () => {
      expect(calculateDTI(10000, 10000)).toBe(100);
    });
  });

  describe("calculatePaymentCapacity", () => {
    it("returns income * ratio - debts (default 0.4)", () => {
      expect(calculatePaymentCapacity(30000, 5000, 0.4)).toBe(7000);
    });
    it("never returns negative", () => {
      expect(calculatePaymentCapacity(10000, 50000, 0.4)).toBe(0);
    });
    it("uses custom ratio when provided", () => {
      expect(calculatePaymentCapacity(30000, 5000, 0.5)).toBe(10000);
    });
  });

  describe("calculateAmountToFinance", () => {
    it("returns price minus down payment", () => {
      expect(calculateAmountToFinance(1000000, 200000)).toBe(800000);
    });
    it("never returns negative", () => {
      expect(calculateAmountToFinance(500000, 600000)).toBe(0);
    });
    it("returns full price for zero down", () => {
      expect(calculateAmountToFinance(750000, 0)).toBe(750000);
    });
  });
});
