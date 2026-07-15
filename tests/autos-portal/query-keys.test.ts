/**
 * Tests for autos portal React Query key factory.
 *
 * Verifies that query keys are deterministic and properly namespaced
 * to avoid cache collisions with other modules.
 */

import { autosKeys } from "@/lib/autos-portal/hooks";

describe("autosKeys", () => {
  it("all starts with 'autos' namespace", () => {
    expect(autosKeys.all[0]).toBe("autos");
  });

  it("vehicles key extends all", () => {
    const key = autosKeys.vehicles();
    expect(key[0]).toBe("autos");
    expect(key[1]).toBe("vehicles");
  });

  it("vehicleSearch includes filters for cache separation", () => {
    const filters1 = { make: "Toyota", page: 1 };
    const filters2 = { make: "Honda", page: 1 };
    const key1 = autosKeys.vehicleSearch(filters1);
    const key2 = autosKeys.vehicleSearch(filters2);

    expect(key1).not.toEqual(key2);
    expect(key1[2]).toBe("search");
    expect(key1[3]).toEqual(filters1);
  });

  it("vehicleDetail includes vehicleId", () => {
    const key = autosKeys.vehicleDetail("v-123");
    expect(key).toEqual(["autos", "vehicles", "detail", "v-123"]);
  });

  it("facets key includes query parameter", () => {
    const key1 = autosKeys.facets("toyota");
    const key2 = autosKeys.facets(undefined);
    expect(key1).not.toEqual(key2);
    expect(key1[2]).toBe("facets");
    expect(key1[3]).toBe("toyota");
  });

  it("leads key includes tenant and dealer", () => {
    const key = autosKeys.leads("t-001", "d-001");
    expect(key).toEqual(["autos", "leads", "t-001", "d-001"]);
  });

  it("plans key is stable", () => {
    const key1 = autosKeys.plans();
    const key2 = autosKeys.plans();
    expect(key1).toEqual(key2);
    expect(key1).toEqual(["autos", "plans"]);
  });

  it("different filters produce different search keys", () => {
    const keyPage1 = autosKeys.vehicleSearch({ page: 1 });
    const keyPage2 = autosKeys.vehicleSearch({ page: 2 });
    expect(keyPage1).not.toEqual(keyPage2);
  });
});
