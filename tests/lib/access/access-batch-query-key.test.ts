import type { AccessClientContext } from "@/lib/access/client";
import { accessBatchQueryKey } from "@/lib/access/hooks";

const context: AccessClientContext = {
  tenantId: "tenant-a",
  dealerId: "dealer-a",
  organizationUnitId: "ou-a",
};

describe("DASH-ACCESS-BATCH-QUERY-KEY-01", () => {
  test("different capability sets do not share one cache entry", () => {
    const inventory = accessBatchQueryKey(["autos.inventory.view"], context);
    const marketing = accessBatchQueryKey(["marketing.dashboard.view"], context);

    expect(inventory).not.toEqual(marketing);
  });

  test("logically equivalent capability sets have one stable key", () => {
    const first = accessBatchQueryKey(["credit.scoring.run", "autos.inventory.view"], context);
    const reorderedWithDuplicate = accessBatchQueryKey(
      ["autos.inventory.view", "credit.scoring.run", "autos.inventory.view"],
      context,
    );

    expect(first).toEqual(reorderedWithDuplicate);
  });

  test("tenant/dealer/organization-unit isolation remains in the key", () => {
    const original = accessBatchQueryKey(["autos.inventory.view"], context);
    const otherDealer = accessBatchQueryKey(
      ["autos.inventory.view"],
      { ...context, dealerId: "dealer-b", organizationUnitId: "ou-b" },
    );

    expect(original).not.toEqual(otherDealer);
  });
});
