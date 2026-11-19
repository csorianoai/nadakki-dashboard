/**
 * Datos SINTETICOS generados del contrato C-SOCIAL-D0 para pruebas y modo DEMO (siempre con badge DEMO).
 * Nombres genericos: marcas, cuentas y nombres son datos por tenant; aqui no hay ningun cliente real.
 */
import { DEFAULT_KIND, PLATFORMS } from "./types";
import type { Brand, CapabilityCell, LifecycleStatus, Platform, SocialAccount, SocialClient } from "./types";

const TENANT = "00000000-0000-0000-0000-000000000000";

export const MOCK_BRANDS: Brand[] = [
  { id: "b0000000-0000-0000-0000-000000000001", tenant_id: TENANT, slug: "marca-personal-demo", display_name: "Marca personal (demo)", kind: "personal", status: "active", version: 1 },
  { id: "b0000000-0000-0000-0000-000000000002", tenant_id: TENANT, slug: "marca-comercial-demo", display_name: "Marca comercial (demo)", kind: "commercial", status: "active", version: 1 },
];

const STATUS: Record<string, LifecycleStatus[]> = {
  [MOCK_BRANDS[0].id]: ["CONNECTED", "PROFILE_COMPLETE", "PLANNED", "EXISTS", "CLAIMED"],
  [MOCK_BRANDS[1].id]: ["PLANNED", "PLANNED", "PLANNED", "PLANNED", "PLANNED"],
};

export const MOCK_ACCOUNTS: SocialAccount[] = MOCK_BRANDS.flatMap((b, bi) =>
  PLATFORMS.map((p, i): SocialAccount => ({
    id: `a${bi}00000-0000-0000-0000-00000000000${i}`,
    tenant_id: TENANT,
    brand_id: b.id,
    platform: p,
    account_kind: DEFAULT_KIND[p],
    proposed_handle: `${b.slug}-${p}`.slice(0, 60),
    handle: null,
    profile_url: null,
    owner_label: null,
    profile_checklist: {},
    profile_public: false,
    status: STATUS[b.id][i],
    version: 1,
  })),
);

const NOTES: Partial<Record<Platform, CapabilityCell["nadakki_status"]>> = {
  instagram: "NO_MEDIDO", facebook: "NO_MEDIDO", youtube: "STUB", tiktok: "STUB", linkedin: "STUB",
};

export const MOCK_CAPABILITIES: CapabilityCell[] = PLATFORMS.flatMap((p) => [
  { platform: p, capability: "create_account", nadakki_status: "REQUIRES_HUMAN", platform_doc_status: "NO_MEDIDO" } as CapabilityCell,
  { platform: p, capability: "connect_oauth", nadakki_status: NOTES[p] ?? "STUB", platform_doc_status: "NO_MEDIDO" } as CapabilityCell,
]);

/** Cliente en memoria con los datos sinteticos. Las escrituras no persisten: devuelven la ficha tal cual. */
export function createMockClient(): SocialClient {
  const byId = (id: string) => MOCK_ACCOUNTS.find((a) => a.id === id);
  const NOT_FOUND = { ok: false, status: 404, code: "NOT_FOUND" } as const;
  return {
    listBrands: async () => ({ ok: true, data: MOCK_BRANDS }),
    listAccounts: async (brandId) => ({ ok: true, data: MOCK_ACCOUNTS.filter((a) => a.brand_id === brandId) }),
    getCapabilities: async () => ({ ok: true, data: MOCK_CAPABILITIES }),
    createAccount: async (b) => ({ ok: true, data: { ...MOCK_ACCOUNTS[0], id: "demo-new", platform: (PLATFORMS.find((p) => DEFAULT_KIND[p] === b.account_kind) ?? MOCK_ACCOUNTS[0].platform), brand_id: b.brand_id, account_kind: b.account_kind, status: "PLANNED" } }),
    updateAccount: async (id, _v, patch) => { const a = byId(id); return a ? { ok: true, data: { ...a, ...patch } as SocialAccount } : NOT_FOUND; },
    transition: async (id, _v, body) => { const a = byId(id); return a ? { ok: true, data: { ...a, status: body.to_status } } : NOT_FOUND; },
    startConnection: async () => ({ ok: false, status: 503, code: "PROVIDER_NOT_CONFIGURED" }),
  };
}
