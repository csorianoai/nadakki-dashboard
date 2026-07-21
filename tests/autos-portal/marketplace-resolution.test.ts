import {
  isAutosConsumerPublicPath,
  legacyMarketplaceRedirectTarget,
} from "@/lib/autos-portal/routes";
import { parseVehicleId, safeDownPayment } from "@/lib/autos-portal/validation";

describe("autos-portal AP-5", () => {
  describe("legacyMarketplaceRedirectTarget", () => {
    it("maps root marketplace to vehiculos", () => {
      expect(legacyMarketplaceRedirectTarget("/autos/marketplace")).toBe("/autos/vehiculos");
    });

    it("maps nested paths with ref query", () => {
      expect(legacyMarketplaceRedirectTarget("/autos/marketplace/foo")).toBe(
        "/autos/vehiculos?ref=legacy_marketplace",
      );
    });
  });

  describe("isAutosConsumerPublicPath", () => {
    it("allows browse, cart, compare, and mis-leads without login", () => {
      expect(isAutosConsumerPublicPath("/autos/vehiculos")).toBe(true);
      expect(isAutosConsumerPublicPath("/autos/cart")).toBe(true);
      expect(isAutosConsumerPublicPath("/autos/compare")).toBe(true);
      expect(isAutosConsumerPublicPath("/autos/dashboard/mis-leads")).toBe(true);
      expect(isAutosConsumerPublicPath("/autos/dashboard/mis-leads/abc")).toBe(true);
    });

    it("blocks dealer and admin paths", () => {
      expect(isAutosConsumerPublicPath("/autos/dealer")).toBe(false);
      expect(isAutosConsumerPublicPath("/admin/autos")).toBe(false);
    });
  });

  describe("validation", () => {
    it("parses safe vehicle ids", () => {
      expect(parseVehicleId("abc-123_9")).toBe("abc-123_9");
    });

    it("rejects invalid vehicle ids", () => {
      expect(() => parseVehicleId("../evil")).toThrow();
    });

    it("caps down payment to vehicle price", () => {
      expect(safeDownPayment(500_000, 400_000)).toBe(400_000);
    });
  });
});
