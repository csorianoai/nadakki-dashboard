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
    it("returns principal/months for 0% rate", () => {
      expect(calculatePMT(120000, 0, 12)).toBe(10000);
    });
    it("calculates correctly for 12% annual, 36 months, 100k", () => {
      const pmt = calculatePMT(100000, 12, 36);
      expect(pmt).toBeCloseTo(3321.43, 2);
    });
  });

  describe("calculateLTV", () => {
    it("returns 0 if vehicle value is 0", () => {
      expect(calculateLTV(50000, 0)).toBe(0);
    });
    it("calculates 80% LTV correctly", () => {
      expect(calculateLTV(80000, 100000)).toBe(80);
    });
  });

  describe("calculateDTI", () => {
    it("returns 0 if income is 0", () => {
      expect(calculateDTI(5000, 0)).toBe(0);
    });
    it("calculates 33.33% DTI correctly", () => {
      expect(calculateDTI(5000, 15000)).toBeCloseTo(33.33, 2);
    });
  });

  describe("calculatePaymentCapacity", () => {
    it("returns income * 0.4 - debts", () => {
      expect(calculatePaymentCapacity(30000, 5000, 0.4)).toBe(7000);
    });
    it("never returns negative", () => {
      expect(calculatePaymentCapacity(10000, 50000, 0.4)).toBe(0);
    });
  });

  describe("calculateAmountToFinance", () => {
    it("returns price minus down payment", () => {
      expect(calculateAmountToFinance(1000000, 200000)).toBe(800000);
    });
    it("never returns negative", () => {
      expect(calculateAmountToFinance(500000, 600000)).toBe(0);
    });
  });
});
