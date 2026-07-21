import {
  addToCompare,
  addVehicleToCart,
  cartCount,
  compareCount,
  emptyCartState,
  getCompareVehicles,
  parseCartState,
  removeVehicleFromCart,
  toggleCompareEnabled,
} from "@/lib/autos-portal/cart-storage";
import {
  buildShareTokenFromState,
  cartStateFromShare,
  decodeSharePayload,
  encodeSharePayload,
  isShareExpired,
} from "@/lib/autos-portal/cart-share";
import { TENANTS } from "@/lib/tenants";

const TENANT_A = TENANTS.nadakki.tenantId;
const TENANT_B = TENANTS.credicefi.tenantId;

function vehicleInput(id: string, tenantId: string, price = 1_000_000) {
  return {
    vehicle_id: id,
    vehicle_name: `Vehicle ${id}`,
    vehicle_price: price,
    vehicle_image: "https://example.com/v.jpg",
    tenant_id: tenantId,
    year: 2022,
    km: 10_000,
    fuel: "Gasolina",
    trans: "Automática",
    type: "Sedán",
    features: "BLUETOOTH",
  };
}

describe("cart-compare-badge", () => {
  describe("Test 1: Add Vehicle", () => {
    it("adds vehicle and updates cart count", () => {
      let state = emptyCartState();
      state = addVehicleToCart(state, vehicleInput("v1", TENANT_A));
      expect(cartCount(state)).toBe(1);
      state = addVehicleToCart(state, vehicleInput("v1", TENANT_A), state.last_updated + 100);
      expect(cartCount(state)).toBe(1);
    });
  });

  describe("Test 2: Remove Vehicle", () => {
    it("removes one vehicle from cart of two", () => {
      let state = emptyCartState();
      state = addVehicleToCart(state, vehicleInput("v1", TENANT_A));
      state = addVehicleToCart(state, vehicleInput("v2", TENANT_A));
      expect(cartCount(state)).toBe(2);
      state = removeVehicleFromCart(state, "v1");
      expect(cartCount(state)).toBe(1);
      expect(state.vehicles[0]?.vehicle_id).toBe("v2");
    });
  });

  describe("Test 3: Compare Mode", () => {
    it("selects two vehicles for comparison table data", () => {
      let state = emptyCartState();
      state = addVehicleToCart(state, vehicleInput("v1", TENANT_A, 900_000));
      state = addVehicleToCart(state, vehicleInput("v2", TENANT_A, 1_100_000));
      state = addVehicleToCart(state, vehicleInput("v3", TENANT_A, 1_300_000));
      state = toggleCompareEnabled(state);
      state = addToCompare(state, "v1");
      state = addToCompare(state, "v3");
      expect(compareCount(state)).toBe(2);
      const compared = getCompareVehicles(state);
      expect(compared.map((v) => v.vehicle_id)).toEqual(["v1", "v3"]);
      expect(compared[0]?.vehicle_price).not.toBe(compared[1]?.vehicle_price);
    });
  });

  describe("Test 4: Share and Load", () => {
    it("round-trips cart state through share token", () => {
      let state = emptyCartState();
      state = addVehicleToCart(state, vehicleInput("v9", TENANT_A));
      state = toggleCompareEnabled(state);
      state = addToCompare(state, "v9");
      const token = buildShareTokenFromState(state, TENANT_A, 1_000_000);
      expect(token).toBeTruthy();
      const payload = decodeSharePayload(token!);
      expect(payload?.tenant_id).toBe(TENANT_A);
      const loaded = cartStateFromShare(payload!);
      expect(loaded.vehicles).toHaveLength(1);
      expect(loaded.compare_ids).toEqual(["v9"]);
      expect(loaded.compare_enabled).toBe(true);
    });

    it("rejects expired share payload", () => {
      const token = encodeSharePayload({
        v: 1,
        tenant_id: TENANT_A,
        issued_at: 1,
        vehicles: [],
        compare_ids: [],
        compare_enabled: false,
      });
      expect(isShareExpired(decodeSharePayload(token)!, 1_000_000 + 8 * 24 * 60 * 60 * 1000)).toBe(true);
    });
  });

  describe("Test 5: Tenant Isolation", () => {
    it("keeps tenant carts separate in storage keys", () => {
      const keyA = `autos_cart_${TENANT_A}`;
      const keyB = `autos_cart_${TENANT_B}`;
      expect(keyA).not.toBe(keyB);

      let stateA = emptyCartState();
      stateA = addVehicleToCart(stateA, vehicleInput("va", TENANT_A));
      let stateB = parseCartState(null);
      expect(cartCount(stateA)).toBe(1);
      expect(cartCount(stateB)).toBe(0);

      const token = buildShareTokenFromState(stateA, TENANT_A)!;
      const payload = decodeSharePayload(token)!;
      expect(payload.tenant_id).not.toBe(TENANT_B);
    });
  });

  describe("parseCartState edge cases", () => {
    it("returns empty cart for invalid JSON", () => {
      expect(parseCartState("{bad").vehicles).toHaveLength(0);
    });
  });
});
