/**
 * @jest-environment jsdom
 */

import { getDealerId } from "@/lib/api/dealer-leads";
import {
  clearDealerAccessContext,
  resetDealerAccessMemoryForTests,
  resolveDealerAccessContext,
  selectedDealerIdentity,
  setDealerAccessContext,
} from "@/lib/dealer/access-context";
import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";

describe("DASH-DEALER-CONTEXT-01", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    global.fetch = jest.fn();
  });

  test("selected dealer keeps its identity", () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-1",
    });

    expect(selectedDealerIdentity()).toEqual({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-1",
    });
    expect(getDealerId()).toBe("dealer-alpha");
    expect(resolveDealerAccessContext().status).toBe("ready");
  });

  test("organization_unit is preserved", () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-north",
    });

    const ready = resolveDealerAccessContext();
    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") throw new Error("expected ready");
    expect(ready.context.organizationUnitId).toBe("ou-north");
    expect(window.localStorage.getItem("nadakki_organization_unit_id")).toBe("ou-north");
  });

  test("changing dealer changes the context", () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-1",
    });
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-beta",
      organizationUnitId: "ou-2",
    });

    expect(getDealerId()).toBe("dealer-beta");
    const ready = resolveDealerAccessContext();
    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") throw new Error("expected ready");
    expect(ready.context.dealerId).toBe("dealer-beta");
    expect(ready.context.organizationUnitId).toBe("ou-2");
    expect(ready.context.dealerId).not.toBe("dealer-alpha");
  });

  test("no selected dealer fails closed and does not call entitlements", async () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    window.localStorage.setItem(
      "nadakki_dealers",
      JSON.stringify([{ id: "first-dealer-should-not-win" }]),
    );

    const resolved = resolveDealerAccessContext();
    expect(resolved.status).toBe("no_dealer");
    expect(getDealerId()).toBeNull();

    const decision = await entitlementsAPI.checkAccess("autos.inventory.view");
    expect(decision.allowed).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("missing organization_unit stays NO_ORGANIZATION_UNIT through checkAccess", async () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: null,
    });

    const resolved = resolveDealerAccessContext();
    expect(resolved.status).toBe("no_organization_unit");
    if (resolved.status !== "no_organization_unit") throw new Error("expected no_organization_unit");
    expect(resolved.reason_code).toBe("NO_ORGANIZATION_UNIT");
    expect(resolved.dealerId).toBe("dealer-alpha");
    expect(resolved.organizationUnitId).toBeNull();

    const decision = await entitlementsAPI.checkAccess("credit.applications.create");
    expect(decision.allowed).toBe(false);
    expect(decision.reason_code).toBe("NO_ORGANIZATION_UNIT");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("does not silently select the first dealer from a stored list", () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    window.localStorage.setItem(
      "nadakki_dealers",
      JSON.stringify([
        { id: "first-dealer", organization_unit_id: "ou-first" },
        { id: "second-dealer", organization_unit_id: "ou-second" },
      ]),
    );

    expect(getDealerId()).toBeNull();
    expect(resolveDealerAccessContext().status).toBe("no_dealer");
    expect(window.localStorage.getItem("nadakki_dealer_id")).toBeNull();
  });

  test("tenant/dealer mismatch is not treated as valid", async () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-1",
    });
    window.localStorage.setItem("nadakki_tenant_id", "tenant-b");

    const resolved = resolveDealerAccessContext();
    expect(resolved.status).toBe("tenant_mismatch");
    if (resolved.status !== "tenant_mismatch") throw new Error("expected mismatch");
    expect(resolved.dealerId).toBe("dealer-alpha");
    expect(resolved.tenantId).toBe("tenant-b");

    const decision = await entitlementsAPI.checkAccess("autos.inventory.view");
    expect(decision.allowed).toBe(false);
    expect(decision.reason_code).not.toBe("ALLOWED");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("clearing dealer does not fall back to demo-dealer-1", () => {
    setDealerAccessContext({
      tenantId: "tenant-a",
      dealerId: "dealer-alpha",
      organizationUnitId: "ou-1",
    });
    clearDealerAccessContext();
    expect(getDealerId()).toBeNull();
    expect(getDealerId()).not.toBe("demo-dealer-1");
  });
});
