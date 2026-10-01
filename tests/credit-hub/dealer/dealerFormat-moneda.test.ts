/**
 * Importes del dealer con la moneda del tenant, nunca con una escrita a mano.
 *
 * El defecto medido en produccion (cajamapaal, mapaal.nadakki.com): el cockpit
 * de Dealer-Bank mostraba RD$ en un tenant argentino. La causa estaba en
 * `dealerCurrencyPrefix`, una tabla de simbolos a mano cuyo caso por defecto era
 * "RD$" --y que tambien devolvia RD$ para DOP, que es el valor con el que
 * `getDefaultTenantBankingConfig` rellena `currency_code` mientras el branding
 * no ha llegado. Es decir: sin branding, todo el mundo veia pesos dominicanos.
 *
 * Lo que se fija aqui: sin moneda no se pinta importe, y con moneda el simbolo
 * lo pone Intl a partir del codigo ISO.
 */
import { formatDealerMoney, volumeThisMonth } from "@/lib/credit-hub/dealer/dealerFormat";
import type { CreditApplication } from "@/lib/credit-hub/types/creditCore";

describe("formatDealerMoney", () => {
  it("sin moneda del tenant no escribe un importe con simbolo inventado", () => {
    expect(formatDealerMoney(38_500_000, null)).toBe("—");
    expect(formatDealerMoney(38_500_000, undefined)).toBe("—");
    expect(formatDealerMoney(38_500_000, "   ")).toBe("—");
  });

  it("jamas aparece RD$ por defecto", () => {
    expect(formatDealerMoney(1000, null)).not.toContain("RD$");
    expect(formatDealerMoney(1000, "ARS")).not.toContain("RD$");
    expect(formatDealerMoney(1000, "MXN")).not.toContain("RD$");
  });

  it("con la moneda del tenant el simbolo lo pone Intl", () => {
    expect(formatDealerMoney(38_500_000, "ARS")).toContain("ARS");
    expect(formatDealerMoney(38_500_000, "ARS", "es-AR")).toContain("38.500.000");
    expect(formatDealerMoney(1000, "MXN")).toContain("MXN");
  });

  it("un tenant dominicano sigue viendo su moneda, ahora por el codigo ISO", () => {
    expect(formatDealerMoney(1000, "DOP")).toContain("DOP");
    expect(formatDealerMoney(1000, "DOP", "es-DO")).toContain("RD$");
  });

  it("normaliza el codigo y acepta minusculas", () => {
    expect(formatDealerMoney(1000, "ars")).toContain("ARS");
  });

  it("importe ausente, cero o negativo sigue siendo em dash", () => {
    expect(formatDealerMoney(null, "ARS")).toBe("—");
    expect(formatDealerMoney("", "ARS")).toBe("—");
    expect(formatDealerMoney(0, "ARS")).toBe("—");
    expect(formatDealerMoney(-5, "ARS")).toBe("—");
  });

  it("lee el importe que llega como texto del backend", () => {
    expect(formatDealerMoney("38500000", "ARS", "es-AR")).toContain("38.500.000");
  });
});

describe("volumeThisMonth", () => {
  const thisMonth = new Date();

  function app(amount: string): CreditApplication {
    return {
      id: "app-1",
      created_at: thisMonth.toISOString(),
      updated_at: thisMonth.toISOString(),
      requested_amount: amount,
    } as unknown as CreditApplication;
  }

  it("suma el mes en la moneda del tenant", () => {
    expect(volumeThisMonth([app("1000"), app("500")], "ARS")).toContain("ARS");
  });

  it("sin moneda del tenant no publica un total con moneda inventada", () => {
    expect(volumeThisMonth([app("1000")], null)).toBe("—");
  });
});
