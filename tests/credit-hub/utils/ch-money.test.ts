import { chMoney, chMoneyExact } from "@/lib/credit-hub/ch-base";
import {
  CH_DEFAULT_CURRENCY_SYMBOL,
  CH_DEFAULT_LOCALE,
  currencySymbolFromCode,
  formatCompactMoneySuffix,
} from "@/lib/credit-hub/utils/currency";

describe("credit-hub currency (DOP / es-DO)", () => {
  test("defaults to RD$ symbol, not MX$", () => {
    expect(chMoney(700_000)).toBe("RD$700K");
    expect(chMoney(2_600_000)).toBe("RD$2.6M");
    expect(chMoney(0)).toBe("RD$0");
    expect(chMoney(700_000)).not.toContain("MX");
  });

  test("Wendy seed amount: compact queue format RD$980K", () => {
    expect(chMoney(980_000)).toBe("RD$980K");
  });

  test("exact formatter uses es-DO grouping", () => {
    expect(chMoneyExact(980_000)).toBe(`RD$${(980_000).toLocaleString(CH_DEFAULT_LOCALE)}`);
    expect(chMoneyExact(980_000)).not.toContain("MX");
  });

  test("currencySymbolFromCode falls back to DOP", () => {
    expect(currencySymbolFromCode()).toBe(CH_DEFAULT_CURRENCY_SYMBOL);
    expect(currencySymbolFromCode("DOP")).toBe("RD$");
  });

  test("formatCompactMoneySuffix for KPI split display", () => {
    expect(formatCompactMoneySuffix(3_600_000)).toBe("3.6M");
    expect(formatCompactMoneySuffix(700_000)).toBe("700K");
  });
});
