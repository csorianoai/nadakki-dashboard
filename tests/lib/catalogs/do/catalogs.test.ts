import { DO_VEHICLE_BRANDS } from "@/lib/credit/catalogs/do/vehicle-brands";
import { DO_BANKS } from "@/lib/credit/catalogs/do/banks";
import {
  DO_CONTRACT_TYPES,
  DO_INCOME_CONCEPTS,
  DO_PAYMENT_FREQUENCIES,
  DO_RELATIONSHIP_TYPES,
} from "@/lib/credit/catalogs/do/employment-types";

describe("DO catalogs", () => {
  it("vehicle brands include Toyota and Otros", () => {
    expect(DO_VEHICLE_BRANDS).toContain("Toyota");
    expect(DO_VEHICLE_BRANDS).toContain("Otros");
  });
  it("banks include major DR institutions", () => {
    expect(DO_BANKS).toContain("Banco Popular Dominicano");
    expect(DO_BANKS).toContain("BanReservas");
    expect(DO_BANKS).toContain("Cooperativa Credicefi");
  });
  it("contract types include core options", () => {
    expect(DO_CONTRACT_TYPES).toContain("Indefinido");
    expect(DO_CONTRACT_TYPES).toContain("Independiente");
  });
  it("income concepts non-empty", () => {
    expect(DO_INCOME_CONCEPTS.length).toBeGreaterThan(5);
  });
  it("payment frequencies match enum", () => {
    expect(DO_PAYMENT_FREQUENCIES).toContain("MENSUAL");
    expect(DO_PAYMENT_FREQUENCIES).toContain("VARIABLE");
  });
  it("relationship types include core family", () => {
    expect(DO_RELATIONSHIP_TYPES).toContain("Cónyuge");
    expect(DO_RELATIONSHIP_TYPES).toContain("Otro");
  });
});
