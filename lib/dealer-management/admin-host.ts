export type DealerAdminHostResolution =
  | { mode: "dealer_subdomain"; tenantSlug: string }
  | { mode: "universal" }
  | { mode: "unknown" };

export const DEALER_ADMIN_SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

const NADAKKI_ADMIN_SUFFIX = ".nadakki.com";

export const RESERVED_DEALER_ADMIN_HOSTS = new Set([
  "dashboard",
  "www",
  "autos",
  "api",
  "status",
  "staging-dashboard",
]);

export function resolveDealerAdminHost(hostname: string): DealerAdminHostResolution {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");

  if (host === "dashboard.nadakki.com") {
    return { mode: "universal" };
  }

  if (!host.endsWith(NADAKKI_ADMIN_SUFFIX)) {
    return { mode: "unknown" };
  }

  const tenantSlug = host.slice(0, -NADAKKI_ADMIN_SUFFIX.length);

  if (
    !tenantSlug ||
    tenantSlug.includes(".") ||
    tenantSlug.startsWith("xn--") ||
    RESERVED_DEALER_ADMIN_HOSTS.has(tenantSlug) ||
    !DEALER_ADMIN_SLUG_REGEX.test(tenantSlug)
  ) {
    return { mode: "unknown" };
  }

  return { mode: "dealer_subdomain", tenantSlug };
}
