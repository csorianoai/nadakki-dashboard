/** Demo admin queues when list endpoints are not mounted (probe-first). */

import { getVehicleImaginUrl } from "@/lib/vehicle-images";
import { VEHICLES_SEED } from "@/lib/vehicles";
import { TENANTS, type TenantSlug } from "@/lib/tenants";
import type { AdminDealerRow, AdminVehicleRow } from "./admin-types";

export function seedPendingVehicles(tenantSlug: TenantSlug): AdminVehicleRow[] {
  const tenantId = TENANTS[tenantSlug].tenantId;
  return VEHICLES_SEED.slice(0, 6).map((v, i) => ({
    id: String(v.id),
    tenant_id: tenantId,
    name: `${v.year} ${v.make} ${v.model}`,
    price: v.price,
    image_url: getVehicleImaginUrl(v),
    dealer_id: `dealer-${(i % 3) + 1}`,
    dealer_name: v.dealerName,
    status: i % 3 === 0 ? "FLAGGED" : "PENDING",
    created_at: new Date(Date.now() - i * 86_400_000).toISOString(),
    year: v.year,
    km: v.km,
    fuel: v.fuel,
    trans: v.trans,
  }));
}

export function seedPendingDealers(tenantSlug: TenantSlug): AdminDealerRow[] {
  const tenantId = TENANTS[tenantSlug].tenantId;
  return [
    {
      id: "dealer-1",
      tenant_id: tenantId,
      name: "AutoMundo RD",
      email: "contacto@automundo.demo",
      kyc_status: "pending",
      created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    },
    {
      id: "dealer-2",
      tenant_id: tenantId,
      name: "Motores del Este",
      email: "kyc@motores.demo",
      kyc_status: "pending",
      created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
    {
      id: "dealer-3",
      tenant_id: tenantId,
      name: "Caribe Motors",
      email: "admin@caribe.demo",
      kyc_status: "rejected",
      created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    },
  ];
}
