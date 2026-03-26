# INTEGRATIONS MVP PRE-FLIGHT SPECIFICATION
**Date:** 2026-03-25
**Repos:** nadakki-dashboard + nadakki-ai-suite
**Mode:** READ-ONLY
**Branch:** main (both repos)

---

## 1. CURRENT_REALITY

### What actually works today (production-live)

| Capability | Backend Endpoint | Frontend Surface | Status |
|-----------|-----------------|-----------------|--------|
| Meta OAuth connect | GET /auth/meta/connect/{tenant_id} | /marketing/social-connections | LIVE — redirects to Facebook, exchanges tokens, stores encrypted |
| Meta OAuth callback | GET /auth/meta/callback | Redirects to /marketing/social-connections?success=meta | LIVE |
| Meta status | GET /auth/meta/status/{tenant_id} | /marketing/social-connections | LIVE — reads TokenStore |
| Meta disconnect | DELETE /auth/meta/disconnect/{tenant_id} | /marketing/social-connections | LIVE |
| Google OAuth connect | GET /auth/google/connect/{tenant_id} | /marketing/social-connections | LIVE — Ads+Analytics+YouTube scopes |
| Google OAuth callback | GET /auth/google/callback | Redirects to /marketing/social-connections?success=google | LIVE |
| Google status | GET /auth/google/status/{tenant_id} | /marketing/social-connections | LIVE — services breakdown (ads/analytics/youtube) |
| Google disconnect | DELETE /auth/google/disconnect/{tenant_id} | /marketing/social-connections | LIVE |
| Google token refresh | POST /auth/google/refresh/{tenant_id} | Not wired in UI | LIVE (backend only) |
| Multi-platform status | GET /api/social/status/{tenant_id} | /marketing/social-connections (via useSocialConnections) | LIVE — live Meta token health check via Graph API |
| Tenant config CRUD | GET/PATCH /api/v1/tenants/{tenant_id}/config | /admin/config | LIVE — controls meta_live_enabled, sendgrid_live_enabled |
| SendGrid email delivery | Internal service (email_sender.py) | No status UI | LIVE — gated by env + tenant config |

### What exists as code but is NOT mounted/live

| Capability | File | Why Not Live |
|-----------|------|-------------|
| Generic integrations CRUD | api/integrations/routes.py | Router NOT mounted in main.py. In-memory mock data only. |
| Debug config/social status | backend/routers/config.py | Mounted only when DEBUG_ENABLED=true. Disabled in production. |

### What the /marketing/integrations page does today

The page at `app/marketing/integrations/page.tsx` is a **sophisticated UI shell** that:
- Renders 16 integration cards (HubSpot, Salesforce, Segment, GA4, SendGrid, Stripe, Slack, etc.)
- Calls `GET /api/integrations?tenant_id=` — **this endpoint does not exist** (router not mounted)
- Simulates OAuth with `window.open(url)` + `setTimeout(3000)` fake success
- Shows an API Key / Webhook config modal
- Generates webhook URLs: `${origin}/webhooks/${tenantId}/${id}` — **no webhook receiver exists in backend**

**Net result:** The page loads, shows all cards as "disconnected", and every action silently fails or fakes success.

### Duplicate/parallel surfaces (confusion inventory)

| Surface | Path | API Pattern | Active? |
|---------|------|-------------|---------|
| Marketing Social Connections | /marketing/social-connections | /api/social/status/{id} + /auth/* | YES — in sidebar, real OAuth |
| Social Connections (standalone) | /social/connections | /api/social/connections + /api/social/{platform}/auth-url | NO — not in sidebar, different API paths |
| Marketing Integrations | /marketing/integrations | /api/integrations (not mounted) | NO — not in sidebar, fake data |
| Settings Integrations | /settings/integrations | None (hardcoded Mailchimp/HubSpot/GA/Zapier/Slack) | NO — not in sidebar, pure stub |
| Marketing Social | /marketing/social | None (hardcoded posts/inbox/calendar) | NO — not in sidebar, pure mock |

---

## 2. SAFE_MVP_SCOPE

### Principle: Show only what is real. No fake connections. No simulated OAuth.

The MVP should replace /marketing/integrations with a **truthful integration status hub** that:
1. Shows the 2 real OAuth integrations (Meta, Google) with their actual live status
2. Shows SendGrid with its actual config status (gated by tenant config)
3. Shows future platforms (TikTok, LinkedIn, X, Pinterest) honestly as "Coming Soon"
4. Links to /marketing/social-connections for OAuth actions (don't duplicate the OAuth flow)
5. Links to /admin/config for live-mode toggles (don't duplicate the config UI)

### What to show

| Integration | Source of Truth | What to Display | Action |
|------------|----------------|-----------------|--------|
| Meta (Facebook + IG) | GET /api/social/status/{tenantId} → platforms.meta | connected/disconnected, page_name, token_health, needs_refresh, publish_ready | Link to /marketing/social-connections |
| Google (Ads + Analytics + YouTube) | GET /api/social/status/{tenantId} → platforms.google | connected/disconnected, user_email, per-service status (ads/analytics/youtube) | Link to /marketing/social-connections |
| SendGrid | GET /api/v1/tenants/{tenantId}/config → sendgrid_live_enabled | enabled/disabled, sandbox vs live mode | Link to /admin/config |
| TikTok | Static | "Coming Soon" badge | None |
| LinkedIn | Static | "Coming Soon" badge | None |
| X (Twitter) | Static | "Coming Soon" badge | None |
| Pinterest | Static | "Coming Soon" badge | None |

### What NOT to show in MVP
- HubSpot, Salesforce, Pipedrive, Zoho — no backend exists
- Segment, RudderStack, mParticle — no backend exists
- Mixpanel, Amplitude — no backend exists
- Twilio, Intercom — no backend exists
- Stripe — no backend exists
- Zapier — no backend exists, no webhook receiver exists
- Any API Key input modals — no storage backend exists
- Any webhook URL display — no receiver exists

---

## 3. ROUTES_TO_REUSE

### Backend (zero changes needed)

| Endpoint | What It Provides | Already Mounted |
|----------|-----------------|-----------------|
| GET /api/social/status/{tenantId} | Full multi-platform status with live token health | YES |
| GET /api/v1/tenants/{tenantId}/config | Tenant config (sendgrid_live_enabled, meta_live_enabled) | YES |
| GET /auth/meta/status/{tenantId} | Meta-specific status (optional, /api/social/status already includes this) | YES |
| GET /auth/google/status/{tenantId} | Google-specific status (optional) | YES |

### Frontend (reuse existing code)

| Asset | Location | What to Reuse |
|-------|----------|---------------|
| useSocialConnections hook | hooks/useSocialConnections.ts | Platform status fetching, connect/disconnect flow, toast handling |
| fetchSocialStatus | lib/api/marketing.ts | Direct API call with tenant header |
| useTenant | hooks/useTenant (or context) | Tenant ID resolution |
| SocialPlatform type | hooks/useSocialConnections.ts | Platform data shape |
| DataSourceBadge | components/ (from advertising/overview) | Live vs fallback indicator |

### Rewrites already covering these paths

| Frontend Path | Backend Destination | Rewrite Exists |
|--------------|--------------------|----|
| /api/social/* | Not in rewrites — but Route Handler catch-all does NOT cover /api/social/ (it's /api/v1/ only) | **GAP** — works because social_status_router is at /api/social/ and there's no Next.js page at that path, so Next.js rewrites could catch it |
| /auth/* | Not in rewrites | **GAP** — works because browser navigates directly (window.location.href), not fetch |
| /api/v1/tenants/*/config | Catch-all Route Handler (GET only) | YES for GET. **PATCH covered by tenant_router rewrite?** — No, catch-all only has GET+POST. But PATCH is needed for /admin/config. |

---

## 4. WHAT_NOT_TO_TOUCH

| Surface | Why Not Touch |
|---------|---------------|
| /marketing/social-connections | Working real OAuth flow. Do not duplicate or modify. |
| /auth/meta/* and /auth/google/* backend routes | Production OAuth with encrypted token storage. Do not modify. |
| /admin/config page | Controls live-mode flags. Do not modify. |
| services/email_sender.py + gates | SendGrid delivery pipeline. Do not modify. |
| hooks/useSocialConnections.ts | Working hook. Reuse, don't rewrite. |
| integrations/sendgrid_client.py | Production email client. Do not modify. |
| integrations/token_manager.py | Google token refresh. Do not modify. |

---

## 5. IMPLEMENTATION_ORDER

### Phase 1: Replace /marketing/integrations page (frontend only, ~1 file)

**File:** `app/marketing/integrations/page.tsx` — full rewrite

**What it becomes:**
1. Import `useSocialConnections` from `hooks/useSocialConnections`
2. Import `useTenant` for tenant context
3. Fetch `GET /api/v1/tenants/{tenantId}/config` for SendGrid status
4. Render 3 sections:
   - **Active Integrations** (Meta, Google) — show real status from useSocialConnections, link to /marketing/social-connections for management
   - **Email Delivery** (SendGrid) — show enabled/disabled + sandbox/live from tenant config, link to /admin/config
   - **Coming Soon** (TikTok, LinkedIn, X, Pinterest) — static cards with "Proximamente" badges
5. Remove: all 16 hardcoded integrations, fake OAuth setTimeout, API key modal, webhook URL display, /api/integrations calls

**Lines of code:** ~150-200 (down from current ~400)
**Backend changes:** ZERO

### Phase 2: Add sidebar entry (1 line)

**File:** `components/layout/DashboardLayout.tsx`

Add under MARKETING section:
```
{ id: "mkt-integrations", label: "Integrations", href: "/marketing/integrations", icon: Link2 }
```

### Phase 3: Cleanup dead surfaces (optional, low priority)

| File | Action |
|------|--------|
| app/settings/integrations/page.tsx | Delete — hardcoded stub, no API, duplicates /marketing/integrations |
| app/social/connections/page.tsx | Delete or redirect — duplicates /marketing/social-connections with different API paths |
| app/marketing/social/page.tsx | Already on HIDE list (pure mock) — no new action |
| lib/hooks/useSocialConnect.ts | Delete — older duplicate of hooks/useSocialConnections.ts, different API paths |

### Phase 4: Backend cleanup (optional, very low priority)

| File | Action |
|------|--------|
| api/integrations/routes.py | Delete or keep for future — mock data, never mounted |

---

## RISK ASSESSMENT

| Risk | Mitigation |
|------|-----------|
| Breaking social-connections OAuth flow | Phase 1 does NOT touch OAuth. It only reads status and links out. |
| Breaking SendGrid delivery | Phase 1 only reads config. No write operations on email pipeline. |
| Missing proxy for /api/social/status | Already works — Next.js serves it through rewrites or direct routing. Verify in runtime. |
| Missing PATCH proxy for tenant config | Already identified in Same-Origin Audit as a gap (catch-all only has GET+POST). But /admin/config page already has this issue — it's a pre-existing P1, not introduced by this work. |

---

## FINAL VERDICT

The integrations MVP is a **frontend-only change to 1 file** plus a sidebar entry. The backend already has everything needed:
- Real OAuth status for Meta and Google (live, with token health)
- Real tenant config for SendGrid (with env + DB gate)
- Real connect/disconnect flows (already working at /marketing/social-connections)

The current /marketing/integrations page is a **liability** — it shows 16 fake integrations, simulates OAuth with setTimeout, and calls an unmounted backend route. Replacing it with a truthful 3-section hub (Active / Email / Coming Soon) that consumes existing endpoints is the smallest safe path to making this module honest.

**Estimated scope:** 1 page rewrite + 1 sidebar line. Zero backend changes. Zero risk to existing OAuth/email pipelines.

---

*Pre-flight specification based on source code analysis. No runtime testing. No modifications made.*
