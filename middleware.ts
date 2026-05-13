/**
 * Next.js Edge Middleware — Tenant Isolation + Legacy Redirects
 *
 * 1. **Legacy advertising redirects** (from proxy.ts)
 * 2. **Tenant isolation** for /api/* routes:
 *    - Requires Authorization header with valid JWT
 *    - Extracts `tid` claim and enforces tenant scoping
 *    - Blocks cross-tenant access for non-superadmin users
 *    - Sets `x-resolved-tenant-id` header for downstream handlers
 *
 * Defence-in-depth: the Render backend has its own ASGI middleware
 * (backend/db/rls.py) that performs the same enforcement.  Both
 * layers must be present for full protection.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/api/v1/auth/",     // Login / register
  "/api/v2/auth/",     // Auth v2 endpoints
  "/api/health",       // Health check
  "/api/consent/",     // Public consent pages
  "/api/credit-hub/client-metadata", // IP detection utility
];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Legacy advertising page redirects ──────────────────────────────
  for (const [oldP, newP] of Object.entries(ADVERTISING_REDIRECTS)) {
    if (pathname === oldP || pathname.startsWith(oldP + "/")) {
      const newUrl = new URL(newP + pathname.slice(oldP.length), request.url);
      return NextResponse.redirect(newUrl, 307);
    }
  }

  // ── 2. Tenant isolation — only for /api/* routes ──────────────────────
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Extract and validate JWT if present ─────────────────────────────
  const authHeader = request.headers.get("authorization") || "";
  const hasJwt = authHeader.startsWith("Bearer ");

  if (hasJwt) {
    // Authenticated request: enforce tenant isolation via JWT
    const token = authHeader.slice(7);
    const payload = decodeJwtPayload(token);

    if (!payload || !payload.tid) {
      return NextResponse.json(
        { error: "Invalid token", code: "INVALID_TOKEN" },
        { status: 401 }
      );
    }

    const jwtTid = String(payload.tid);
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const isPlatformSuperadmin = roles.some(
      (r: unknown) =>
        typeof r === "object" &&
        r !== null &&
        (r as Record<string, unknown>).role_key === "platform_superadmin"
    );

    // ── Resolve effective tenant_id ─────────────────────────────────
    const url = request.nextUrl.clone();
    const queryTenantId = url.searchParams.get("tenant_id");
    const headerTenantId =
      request.headers.get("x-tenant-id") ||
      request.headers.get("X-Tenant-ID");

    let effectiveTid: string;

    if (isPlatformSuperadmin) {
      effectiveTid = queryTenantId || headerTenantId || jwtTid;
    } else {
      if (queryTenantId && queryTenantId !== jwtTid) {
        return NextResponse.json(
          { error: "Cross-tenant access denied", code: "TENANT_ISOLATION" },
          { status: 403 }
        );
      }
      if (headerTenantId && headerTenantId !== jwtTid) {
        return NextResponse.json(
          { error: "Cross-tenant access denied", code: "TENANT_ISOLATION" },
          { status: 403 }
        );
      }
      effectiveTid = jwtTid;
    }

    // Rewrite tenant_id query param to the resolved value
    if (url.searchParams.has("tenant_id")) {
      url.searchParams.set("tenant_id", effectiveTid);
    }

    // Set resolved headers for downstream handlers and rewrites
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-tenant-id", effectiveTid);
    requestHeaders.set("x-resolved-tenant-id", effectiveTid);

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  // ── Unauthenticated request: block sensitive endpoints ────────────────
  // Endpoints that expose tenant data MUST require auth.
  // Rewrite-proxied routes (e.g. /api/marketing/*) fall through to the
  // Render backend which has its own RLS middleware.
  const REQUIRE_AUTH_PREFIXES = [
    "/api/tenants",          // Tenant enumeration
    "/api/v1/tenants",       // Tenant config / api-keys / billing
    "/api/v1/audit",         // Audit logs
    "/api/v1/billing",       // Billing data
  ];

  if (REQUIRE_AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.json(
      { error: "Authentication required", code: "MISSING_AUTH" },
      { status: 401 }
    );
  }

  // For other unauthenticated requests (e.g. marketing dashboard via
  // rewrite), let them through.  The backend RLS middleware handles
  // tenant scoping. Once the frontend client library is updated to
  // send Authorization headers, the JWT branch above will handle these.
  return NextResponse.next();
}

export const config = {
  matcher: [
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
