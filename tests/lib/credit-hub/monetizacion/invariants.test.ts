import { DRILLDOWNS, INVOICE_MAY_2026, RECONCILIATION_MAY_2026 } from "@/lib/credit-hub/monetizacion/fixtures";
import {
  itbis,
  reconcile,
  sumEvents,
  volumeBand,
  whatif,
} from "@/lib/credit-hub/monetizacion/whatif";

describe("Monetización reconciliation invariants", () => {
  test("whatif B2 default matches invoice totals", () => {
    expect(
      whatif({ base: "B2", bps: 30, addAI: true, addSeats: true, addSetup: false }),
    ).toEqual({
      subtotal: 391_900,
      itbis: 70_542,
      total: 462_442,
      delta: 0,
      lines: expect.any(Array),
    });
  });

  test("volumeBand(78.5M) = 246,300 marginal bands", () => {
    expect(volumeBand(78_500_000)).toBe(246_300);
  });

  test("B1 minimum guarantee at 10 bps", () => {
    expect(whatif({ base: "B1", bps: 10, addAI: false, addSeats: false }).subtotal).toBe(150_000);
  });

  test("itbis(391900) = 70542", () => {
    expect(itbis(391_900)).toBe(70_542);
  });

  test("each drilldown agg equals sum of events", () => {
    for (const key of Object.keys(DRILLDOWNS)) {
      const d = DRILLDOWNS[key as keyof typeof DRILLDOWNS];
      expect(sumEvents(d.events)).toBeCloseTo(d.aggValue, 2);
    }
  });

  test("invoice reconcile → discrepancy 0, sum 391,900", () => {
    expect(reconcile(INVOICE_MAY_2026)).toMatchObject({
      discrepancy: 0,
      reconciledSum: 391_900,
    });
  });

  test("invoice subtotal + itbis = total", () => {
    expect(INVOICE_MAY_2026.subtotal + INVOICE_MAY_2026.itbis).toBe(INVOICE_MAY_2026.total);
  });

  test("reconciliation fixture discrepancy 0", () => {
    expect(RECONCILIATION_MAY_2026.discrepancy).toBe(0);
    expect(RECONCILIATION_MAY_2026.reconciled_sum).toBe(391_900);
  });
});
