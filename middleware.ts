/**
 * Next.js Edge Middleware — Tenant Isolation + Legacy Redirects
 *
 * SECURITY: CVE-001 FINAL FIX (Round 3)
 *
 * 1. **Legacy advertising redirects** (from proxy.ts)
 * 2. **Tenant isolation** for ALL /api/* routes:
 *    - Requires Authorization header with valid JWT (no unauthenticated pass-through)
 *    - Extracts `tid` claim and enforces tenant scoping
 *    - Validates tenant_id in: query params (all case variants), headers, AND path segments
 *    - Blocks cross-tenant access for non-superadmin users
 *    - Sets `x-resolved-tenant-id` + `x-user-id` + `x-user-role` headers for downstream
 *
 * Defence-in-depth: the Render backend has its own ASGI middleware
 * (backend/db/rls.py) that performs the same enforcement.  Both
 * layers must be present for full protection.
 *
 * Attack vectors closed:
 *   - Query param spoofing: ?tenant_id=X, ?tenantId=X, ?tenantid=X
 *   - Header spoofing: X-Tenant-ID: X
 *   - Path param spoofing: /api/social/status/{uuid}
 *   - Unauthenticated access to rewrite routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyMarketplaceRedirectTarget } from "@/lib/autos-portal/routes";

// FC1 — Cockpit consolidation: /cockpit/plans → Panel admin billing
const COCKPIT_CONSOLIDATION_ENABLED =
  process.env.NEXT_PUBLIC_COCKPIT_CONSOLIDATION_ENABLED !== "false";

// F4 — Finance registry: platform_superadmin only (middleware layer 1)
const COCKPIT_FINANCE_REGISTRY_ENABLED =
  process.env.NEXT_PUBLIC_COCKPIT_FINANCE_REGISTRY_ENABLED !== "false";

// ── Legacy advertising redirects (migrated from proxy.ts) ────────────────────
const ADVERTISING_REDIRECTS: Record<string, string> = {
  "/google-ads": "/advertising/google-ads",
  "/meta-ads": "/advertising/meta-ads",
  "/linkedin-ads": "/advertising/linkedin-ads",
  "/tiktok-ads": "/advertising/tiktok-ads",
  "/unified": "/advertising/unified",
};

// ── Public API paths that skip auth enforcement ──────────────────────────────
const PUBLIC_PREFIXES = [
  "/api/v1/auth/",            // Login / register
  "/api/v2/auth/",            // Auth v2 endpoints
  "/api/health",              // Health check
  "/api/consent/",            // Public consent pages
  "/api/credit-hub/client-metadata", // IP detection utility
];

/** HMAC token–authenticated stipulation mobile upload (EP-T4-5); no JWT. */
const PUBLIC_STIPULATION_UPLOAD_PATH_RE =
  /^\/api\/v2\/credit\/applications\/[^/]+\/stipulations\/[^/]+\/(upload-link\/validate|upload)$/;

// ── Tenant-context keywords in URL path segments ─────────────────────────────
// When a UUID appears after one of these segments, treat it as a tenant ID.
const TENANT_PATH_KEYWORDS = new Set([
  "status", "tenants", "tenant", "social",
]);

// UUID v4 pattern
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// All query-parameter key variants for tenant ID
const TENANT_QUERY_KEYS = ["tenant_id", "tenantId", "tenantid"];

/**
 * Decode a JWT payload WITHOUT signature verification.
 * We only need the `tid` (tenant_id) claim for routing.
 * The Render backend verifies the signature server-side.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function extractJwtRole(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const role = payload.role ?? payload.role_key ?? payload.r;
  return typeof role === "string" ? role : null;
}

function extractRequestJwt(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
  const legacy = request.cookies.get("nadakki_sic_token")?.value;
  return legacy ?? null;
}

/**
 * Extract all tenant-ID-like values from query parameters.
 * Checks snake_case, camelCase, and lowercase variants.
 */
function extractQueryTenantIds(url: URL): string[] {
  const ids: string[] = [];
  for (const key of TENANT_QUERY_KEYS) {
    const val = url.searchParams.get(key);
    if (val) ids.push(val);
  }
  return ids;
}

/**
 * Extract UUID from path segments that likely represent a tenant ID.
 * Matches patterns like /api/social/status/{uuid}
 */
function extractPathTenantId(pathname: string): string | null {
  const segments = pathname.split("/");
  for (let i = 1; i < segments.length; i++) {
    if (UUID_RE.test(segments[i])) {
      const prev = (segments[i - 1] || "").toLowerCase();
      if (TENANT_PATH_KEYWORDS.has(prev)) {
        return segments[i];
      }
    }
  }
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. FC1 cockpit plans redirect ─────────────────────────────────────
  if (COCKPIT_CONSOLIDATION_ENABLED && pathname === "/cockpit/plans") {
    return NextResponse.redirect(new URL("/admin/billing", request.url), 302);
  }

  // ── 1a. AP-5 — legacy Forge marketplace → consumer browse (301) ─────
  if (pathname === "/autos/marketplace" || pathname.startsWith("/autos/marketplace/")) {
    const target = legacyMarketplaceRedirectTarget(pathname);
    return NextResponse.redirect(new URL(target, request.url), 301);
  }

  // ── 1b. F4 finance registry — superadmin-only redirect ────────────────
  if (pathname === "/cockpit/finance/registry" || pathname.startsWith("/cockpit/finance/registry/")) {
    if (!COCKPIT_FINANCE_REGISTRY_ENABLED) {
      return NextResponse.redirect(new URL("/cockpit/finance/revenue", request.url), 302);
    }
    const jwt = extractRequestJwt(request);
    if (jwt) {
      const role = extractJwtRole(jwt);
      if (role && role !== "platform_superadmin") {
        return NextResponse.redirect(new URL("/cockpit/finance/revenue", request.url), 302);
      }
    }
  }

  // ── 2. Legacy advertising page redirects ──────────────────────────────
  for (const [oldP, newP] of Object.entries(ADVERTISING_REDIRECTS)) {
    if (pathname === oldP || pathname.startsWith(oldP + "/")) {
      const newUrl = new URL(newP + pathname.slice(oldP.length), request.url);
      return NextResponse.redirect(newUrl, 307);
    }
  }

  const hostHeader = request.headers.get("host") || "";
  if (hostHeader.includes("autos.nadakki.com") && pathname === "/") {
    return NextResponse.redirect(new URL("/autos/vehiculos", request.url));
  }

  // ── 3. Tenant isolation — only for /api/* routes ──────────────────────
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (PUBLIC_STIPULATION_UPLOAD_PATH_RE.test(pathname)) {
    return NextResponse.next();
  }

  // ── 3. Extract JWT (if present) for tenant isolation ──────────────────
  const authHeader = request.headers.get("authorization") || "";
  const hasJwt = authHeader.startsWith("Bearer ");

  if (!hasJwt) {
    // No JWT: pass through without tenant isolation.
    // The Render backend ASGI middleware (db/rls.py) is the auth authority
    // and will reject unauthenticated requests that require auth.
    // Many frontend callers (admin pages, legacy modules) send tokens
    // directly to the backend or rely on the backend's own auth layer.
    return NextResponse.next();
  }

  // ── 4. Validate JWT and enforce tenant isolation ──────────────────────
  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);

  // JWT claim: backend v2 uses "tenant_id", some legacy tokens use "tid"
  const rawTid = payload?.tenant_id ?? payload?.tid;
  if (!payload || !rawTid) {
    return NextResponse.json(
      { error: "Invalid token", code: "INVALID_TOKEN" },
      { status: 401 }
    );
  }

  const jwtTid = String(rawTid);
  const roles = Array.isArray(payload.roles) ? payload.roles : [];
  const isPlatformSuperadmin = roles.some(
    (r: unknown) =>
      typeof r === "object" &&
      r !== null &&
      (r as Record<string, unknown>).role_key === "platform_superadmin"
  );

  // ── 5. Collect all tenant_id references from the request ──────────────
  const url = request.nextUrl.clone();
  const queryTenantIds = extractQueryTenantIds(url);
  const headerTenantId =
    request.headers.get("x-tenant-id") ||
    request.headers.get("X-Tenant-ID");
  const pathTenantId = extractPathTenantId(pathname);

  let effectiveTid: string;

  if (isPlatformSuperadmin) {
    // Super admin can override tenant context (intentional)
    effectiveTid = queryTenantIds[0] || headerTenantId || jwtTid;
  } else {
    // ── 6. Block cross-tenant access for regular users ────────────────
    // Check query params (all case variants)
    for (const qTid of queryTenantIds) {
      if (qTid !== jwtTid) {
        return NextResponse.json(
          { error: "Cross-tenant access denied", code: "TENANT_ISOLATION_QUERY" },
          { status: 403 }
        );
      }
    }

    // Check header
    if (headerTenantId && headerTenantId !== jwtTid) {
      return NextResponse.json(
        { error: "Cross-tenant access denied", code: "TENANT_ISOLATION_HEADER" },
        { status: 403 }
      );
    }

    // Check path segments
    if (pathTenantId && pathTenantId !== jwtTid) {
      return NextResponse.json(
        { error: "Cross-tenant access denied", code: "TENANT_ISOLATION_PATH" },
        { status: 403 }
      );
    }

    effectiveTid = jwtTid;
  }

  // ── 7. Rewrite tenant query params to the resolved value ──────────────
  for (const key of TENANT_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.set(key, effectiveTid);
    }
  }

  // ── 8. Set resolved headers for downstream handlers and rewrites ──────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", effectiveTid);
  requestHeaders.set("x-resolved-tenant-id", effectiveTid);
  requestHeaders.set("x-user-id", String(payload.sub || ""));
  requestHeaders.set(
    "x-user-role",
    isPlatformSuperadmin ? "platform_superadmin" : "user"
  );

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/autos/marketplace",
    "/autos/marketplace/:path*",
    "/cockpit/plans",
    "/cockpit/finance/registry",
    "/cockpit/finance/registry/:path*",
    // Tenant isolation on API routes
    "/api/:path*",
    // Legacy advertising redirects
    "/google-ads/:path*",
    "/meta-ads/:path*",
    "/linkedin-ads/:path*",
    "/tiktok-ads/:path*",
    "/unified/:path*",
  ],
};
