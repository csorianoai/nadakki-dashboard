/** White-label tenant configs — README §5.3 */

export type TenantSlug = "nadakki" | "credicefi" | "piloto";

export interface TenantConfig {
  slug: TenantSlug;
  name: string;
  sub: string;
  /** Protected tenant UUID — never use in destructive ops. */
  tenantId: string;
  brand: string;
  brand2: string;
  brandStrong: string;
  brandSoft: string;
}

export const TENANTS: Record<TenantSlug, TenantConfig> = {
  nadakki: {
    slug: "nadakki",
    name: "Nadakki Auto",
    sub: "Marketplace inteligente",
    tenantId: "d3b00111-0000-0000-0000-000000d3b001",
    brand: "#1E40AF",
    brand2: "#3B82F6",
    brandStrong: "#1E3A8A",
    brandSoft: "#EEF3FF",
  },
  credicefi: {
    slug: "credicefi",
    name: "Credicefi Autos",
    sub: "Powered by Nadakki",
    tenantId: "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242",
    brand: "#0E7C66",
    brand2: "#13B98A",
    brandStrong: "#0B5F4E",
    brandSoft: "#E3F6EF",
  },
  piloto: {
    slug: "piloto",
    name: "Banco Piloto",
    sub: "Powered by Nadakki",
    tenantId: "550e8400-e29b-41d4-a716-446655440099",
    brand: "#6D28D9",
    brand2: "#8B5CF6",
    brandStrong: "#5B21B6",
    brandSoft: "#F0EBFE",
  },
};

export const TENANT_OPTIONS: TenantSlug[] = ["nadakki", "credicefi", "piloto"];

export function isTenantSlug(value: string | null | undefined): value is TenantSlug {
  return value === "nadakki" || value === "credicefi" || value === "piloto";
}
