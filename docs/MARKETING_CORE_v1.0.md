# Marketing Core v1.0 — Master Documentation

> **Status:** Production-Ready | **Date:** 2026-05-13 | **Sprint:** Marketing Core v1.0
> **Repos:** `nadakki-dashboard` (frontend) + `nadakki-ai-suite` (backend)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Page Structure (33 Pages)](#page-structure-33-pages)
4. [AI Agent Catalog (46 Production Agents)](#ai-agent-catalog-46-production-agents)
5. [Pre-configured Workflows (11)](#pre-configured-workflows-11)
6. [Onboarding Wizard (8 Steps)](#onboarding-wizard-8-steps)
7. [Security — CVE-001 Resolution](#security--cve-001-resolution)
8. [Mock Data Cleanup](#mock-data-cleanup)
9. [Agent Catalog Cleanup](#agent-catalog-cleanup)
10. [Pricing Tiers](#pricing-tiers)
11. [Roadmap (P2/P3/P4)](#roadmap-p2p3p4)
12. [Demo Script](#demo-script)
13. [Competitive Analysis](#competitive-analysis)
14. [PR History](#pr-history)
15. [Verification Checklist](#verification-checklist)

---

## Executive Summary

Marketing Core v1.0 is the flagship marketing automation module of the Nadakki AI Suite, a multi-tenant SaaS platform targeting mid-market LatAm businesses. This release delivers:

- **33 production pages** across 6 marketing sub-modules
- **~214 real AI agents** (down from ~370 inflated count after catalog cleanup)
- **11 pre-configured workflows** for common marketing operations
- **8-step interactive onboarding wizard** for new tenants
- **Defense-in-depth tenant isolation** (CVE-001 fully resolved)
- **Zero mock data** in production-facing pages
- **Multi-tenant architecture** with JWT-based RLS

Target customer: **CrediCefi** (pilot), mid-market financial services in Dominican Republic.

---

## Architecture & Tech Stack

### Frontend (`nadakki-dashboard`)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Query (TanStack Query) |
| Auth | JWT v2 (`AuthProvider` + `useAuth`) |
| Charts | Recharts |
| Icons | Lucide React |
| Build | Webpack (Turbopack blocked on Windows) |
| Deploy | Vercel (auto-deploy on push to main) |

### Backend (`nadakki-ai-suite`)

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI (ASGI) |
| Language | Python 3.11+ |
| Database | PostgreSQL with RLS |
| Auth | JWT v2 with RBAC |
| Agent Runtime | File-based discovery via AST parsing |
| LLM | OpenAI / Anthropic (via `LegalLLMService`) |
| Deploy | Render |

### BFF Pattern

```
Browser → Vercel (Next.js) → Edge Middleware (tenant isolation)
       → API Route Handlers → Render Backend (FastAPI)
```

The Next.js middleware intercepts all `/api/*` routes, decodes the JWT, validates tenant isolation, and forwards requests to the Render backend via `next.config.js` rewrites.

---

## Page Structure (33 Pages)

### Marketing Hub (`/marketing/*`)

| # | Page | Path | Data Source |
|---|------|------|-------------|
| 1 | Dashboard | `/marketing` | Real API (`/marketing/campaigns`) |
| 2 | Campaigns | `/marketing/campaigns` | Real API |
| 3 | Campaign Builder | `/marketing/campaigns/new` | Real API |
| 4 | Campaign Detail | `/marketing/campaigns/[id]` | Real API |
| 5 | AI Agents | `/marketing/agents` | Real API (`/marketing/agents`) |
| 6 | Content Studio | `/marketing/content` | Real API |
| 7 | A/B Testing | `/marketing/ab-testing` | localStorage (client-side) |
| 8 | Segments | `/marketing/segments` | Real API (`/marketing/segments`) |
| 9 | Audiences | `/marketing/audiences` | Real API |
| 10 | Analytics | `/marketing/analytics` | Real API |
| 11 | Real-time | `/marketing/real-time` | Real API |
| 12 | Automation | `/marketing/automation` | Real API |
| 13 | Email Builder | `/marketing/email-builder` | Real API |
| 14 | Templates | `/marketing/templates` | Real API |
| 15 | Predictive | `/marketing/predictive` | Real API (empty state when no data) |
| 16 | Customer Journey | `/marketing/customer-journey` | Real API |
| 17 | Insights | `/marketing/insights` | Real API |
| 18 | Onboarding | `/marketing/onboarding` | Client-side wizard |

### Advertising Hub (`/advertising/*`)

| # | Page | Path | Data Source |
|---|------|------|-------------|
| 19 | Unified Dashboard | `/advertising/unified` | Real API |
| 20 | Google Ads | `/advertising/google-ads` | Real API (`/api/v1/google-ads`) |
| 21 | Meta Ads | `/advertising/meta-ads` | Real API |
| 22 | LinkedIn Ads | `/advertising/linkedin-ads` | Real API |
| 23 | TikTok Ads | `/advertising/tiktok-ads` | Real API |

### Social Hub (`/social/*`)

| # | Page | Path |
|---|------|------|
| 24 | Social Dashboard | `/social` |
| 25 | Scheduler | `/social/scheduler` |
| 26 | Inbox | `/social/inbox` |
| 27 | Analytics | `/social/analytics` |
| 28 | Editor | `/social/editor` |
| 29 | Feeds | `/social/feeds` |
| 30 | Monitoring | `/social/monitoring` |
| 31 | Connections | `/social/connections` |

### Workflows (`/workflows/*`)

| # | Page | Path |
|---|------|------|
| 32 | Workflows Hub | `/workflows` |
| 33 | 11 Individual Workflow Pages | `/workflows/[slug]` |

---

## AI Agent Catalog (46 Production Agents)

After the catalog cleanup (PR #77), the agent discovery system filters out:
- **Elite wrapper duplicates** (`_elite` filename pattern)
- **Shim delegators** (`import_module` + "Shim"/"Elite Wrapper")
- **Template stubs** (`from agents.AGENT_TEMPLATE import`)
- **Enterprise v3.2.0 stubs** (`ENTERPRISE SUPER AGENT` + `v3.2.0`)
- **Auto-generated stubs** (`Generado automáticamente: 2025-08-07` without real API integration)
- **Archived/backup files** (`_archived/`, `backup_*`, `.bak.py`)

### Discovery System

Agents are Python files in `/agents/` discovered at runtime via AST parsing in `main.py`'s `intelligent_discovery()` function. Each agent must:
1. Have a class inheriting from a base agent
2. Define `agent_id` as a class attribute
3. Implement an `ejecutar()` method
4. Pass the `_is_shim_or_stub()` content filter

### Key Agent Categories

| Category | Examples |
|----------|----------|
| Marketing | `LeadScoringIA`, `SocialPostGeneratorIA`, `ContentViralityIA` |
| Advertising | `GoogleAdsStrategist`, `MetaAdsOptimizer` |
| Legal | `ChatAsesorLegal`, `AnalizadorContratos`, `GeneradorDocumentos` |
| SIC | `CreditRiskAnalyzer`, `BureauIntegration` |
| Orchestration | `CampaignStrategyOrchestratorIA` |

---

## Pre-configured Workflows (11)

| # | Workflow | Path |
|---|----------|------|
| 1 | A/B Testing & Experimentation | `/workflows/ab-testing-experimentation` |
| 2 | Campaign Optimization | `/workflows/campaign-optimization` |
| 3 | Competitive Intelligence Hub | `/workflows/competitive-intelligence-hub` |
| 4 | Content Performance Engine | `/workflows/content-performance-engine` |
| 5 | Customer Acquisition Intelligence | `/workflows/customer-acquisition-intelligence` |
| 6 | Customer Lifecycle & Revenue | `/workflows/customer-lifecycle-revenue` |
| 7 | Email Automation Master | `/workflows/email-automation-master` |
| 8 | Influencer Partnership Engine | `/workflows/influencer-partnership-engine` |
| 9 | Multi-Channel Attribution | `/workflows/multi-channel-attribution` |
| 10 | Social Media Intelligence | `/workflows/social-media-intelligence` |
| 11 | (Hub page) | `/workflows` |

Each workflow page displays a multi-step process with connected agents, expected outcomes, and a "Launch" CTA.

---

## Onboarding Wizard (8 Steps)

Located at `/marketing/onboarding` (PR #47).

| Step | Title | Purpose |
|------|-------|---------|
| 1 | Welcome | Industry selection, company name |
| 2 | Goals | Primary marketing objectives |
| 3 | Channels | Active channels (email, social, ads, etc.) |
| 4 | Audience | Target audience characteristics |
| 5 | Budget | Monthly marketing budget range |
| 6 | Tools | Current tools integration |
| 7 | Team | Team size and roles |
| 8 | Summary | Review and launch |

The wizard saves progress to localStorage and generates a recommended agent configuration based on selections.

---

## Security — CVE-001 Resolution

### Timeline

| PR | Description | Status |
|----|-------------|--------|
| #46 | BFF tenant isolation breach fix (R2) | Merged |
| #50 | Close remaining gaps (R3 Final) | Merged |
| #76 | Backend CI security tests (398 routes) | Merged |

### Defense-in-Depth Architecture

**Layer 1 — Edge Middleware (Next.js)**
- ALL non-public `/api/*` routes require JWT
- Extracts `tid` (tenant_id) from JWT payload
- Validates tenant_id in: query params, headers, AND path segments
- Blocks cross-tenant access for non-superadmin users
- Sets `x-resolved-tenant-id`, `x-user-id`, `x-user-role` headers

**Layer 2 — ASGI Middleware (FastAPI)**
- `backend/db/rls.py` performs independent tenant enforcement
- PostgreSQL RLS policies enforce row-level isolation
- JWT signature verification (backend-only)

### Attack Vectors Closed

| Vector | Protection |
|--------|-----------|
| Query param spoofing (`?tenant_id=X`) | All variants checked: `tenant_id`, `tenantId`, `tenantid` |
| Header spoofing (`X-Tenant-ID: X`) | Compared against JWT `tid` |
| Path param spoofing (`/api/social/status/{uuid}`) | UUID extracted after keyword segments |
| Unauthenticated API access | 401 returned for missing/invalid JWT |
| Body param spoofing (`context.tenant_id`) | Overridden by `x-resolved-tenant-id` header |

### Production Verification

11/11 exploit tests passing against production:
1. Missing auth → 401
2. Invalid JWT → 401
3. Query param spoofing (snake_case) → 403
4. Query param spoofing (camelCase) → 403
5. Query param spoofing (lowercase) → 403
6. Header spoofing → 403
7. Path UUID spoofing → 403
8. Valid JWT passes → 200/rewrite
9. Superadmin can override tenant → allowed
10. Public routes skip auth → 200
11. Non-API routes unaffected → 200

---

## Mock Data Cleanup

### PRs

| PR | Description | Status |
|----|-------------|--------|
| #48 | Remove hardcoded mock data from 7 pages | Merged |
| #51 | Remove final 2 mocks (SAMPLE_EXPERIMENTS, 10% conversion) | Merged |

### Pages Cleaned

| Page | What Was Removed |
|------|-----------------|
| `/marketing` (Dashboard) | `SAMPLE_METRICS`, `SAMPLE_CAMPAIGNS`, `SAMPLE_ACTIVITIES` |
| `/marketing/analytics` | `MOCK_ANALYTICS` data |
| `/marketing/real-time` | `MOCK_REALTIME` data |
| `/marketing/campaigns` | `MOCK_CAMPAIGNS` fallback |
| `/marketing/predictive` | Hardcoded `$156,234` revenue prediction |
| `/marketing/customer-journey` | Inline mock journey data |
| `/marketing/insights` | Inline mock insight cards |
| `/marketing/ab-testing` | `SAMPLE_EXPERIMENTS` (4 fake experiments) |
| `/marketing/segments` | `predictedConversion: 0.1` fallback → shows "N/A" |

### What Remains (Acceptable)

- `lib/legal/task-fixtures.ts` — test/dev fallback only
- `data/all-agents-structure.json` — agent catalog reference
- `tests/` directory mocks — test infrastructure
- `/sic/demo` — intentional demo page

---

## Agent Catalog Cleanup

### PR #77 (Backend)

Reduced agent count from ~370 (inflated) to ~214 (real) by:

1. **Updated `should_ignore_path()`** in `main.py` to filter:
   - `_archived/`, `_elite/`, `docs/` directories
   - `backup_*` prefix directories
   - `.bak.py` file extensions
   - `_elite` filename patterns
   - `agent_template.py`

2. **Added `_is_shim_or_stub()` content filter** that detects:
   - Shim wrappers using `import_module`
   - `AGENT_TEMPLATE` imports
   - `ENTERPRISE SUPER AGENT` + `v3.2.0` pattern
   - Auto-generated stubs from 2025-08-07 without real API calls

3. **Physically moved 21 dead files** to `agents/_archived/`:
   - 5 advertising duplicates
   - 5 marketing backup placeholders
   - 6 marketing archived files
   - 2 `.bak.py` files
   - 2 orchestrator version files
   - 1 registry backup

---

## Pricing Tiers

| Tier | Name | Monthly | Target |
|------|------|---------|--------|
| Starter | Marketing Starter | $5,000 | SMBs, 1-2 channels |
| Professional | Marketing Pro | $12,000 | Mid-market, multi-channel |
| Enterprise | Marketing Enterprise | $25,000 | Large orgs, full suite |

### Feature Matrix

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|-----------|
| AI Agents | 10 | 25 | All |
| Campaigns/mo | 5 | 20 | Unlimited |
| A/B Tests | 2 | 10 | Unlimited |
| Workflows | 3 | 8 | 11 |
| Segments | 5 | 20 | Unlimited |
| Users | 2 | 10 | Unlimited |
| Support | Email | Priority | Dedicated |
| Onboarding | Self-serve | Guided | White-glove |

---

## Roadmap (P2/P3/P4)

### P2 — Q3 2026: Marketing Intelligence

- Real-time campaign performance alerts
- Cross-channel attribution modeling
- Automated budget reallocation
- Competitor monitoring integration
- Advanced A/B testing with API backend

### P3 — Q4 2026: Marketing Automation

- Multi-step workflow builder (drag & drop)
- Trigger-based automation rules
- Lead scoring model training
- CRM integration (HubSpot, Salesforce)
- WhatsApp Business API campaigns

### P4 — Q1 2027: Marketing Analytics

- Custom dashboard builder
- Predictive revenue modeling (real ML)
- Cohort analysis
- Customer lifetime value predictions
- Board-ready reporting exports

---

## Demo Script

### Pre-Demo Setup

1. Log in via backend: `https://nadakki-ai-suite.onrender.com/api/v2/auth/login`
2. Use a tenant with real campaign data
3. Ensure backend is warm (first request may be slow on Render free tier)

### Demo Flow (15 minutes)

1. **Login & Dashboard** (2 min)
   - Show branded login page
   - Marketing dashboard with real campaign data
   - Highlight multi-tenant branding

2. **Onboarding Wizard** (2 min)
   - Walk through 8-step wizard
   - Show intelligent agent recommendations
   - Demonstrate industry-specific suggestions

3. **Campaign Management** (3 min)
   - Browse existing campaigns
   - Show campaign builder
   - Demonstrate AI agent integration

4. **AI Agents** (3 min)
   - Show agent catalog
   - Demonstrate agent execution
   - Show workflow orchestration

5. **Analytics & Insights** (2 min)
   - Real-time dashboard
   - Predictive analytics (empty state if no data)
   - Segment analysis

6. **Security & Multi-tenancy** (2 min)
   - Show tenant isolation
   - Demonstrate role-based access
   - Explain defense-in-depth architecture

7. **Workflows** (1 min)
   - Show pre-configured workflows
   - Explain customization options

### Key Talking Points

- "All data is real — no mock data in production"
- "Defense-in-depth security: Edge middleware + ASGI middleware + PostgreSQL RLS"
- "~214 production AI agents, not placeholder stubs"
- "11 pre-configured workflows for immediate value"
- "Multi-tenant from day one — each customer gets isolated data"

---

## Competitive Analysis

| Feature | Nadakki | HubSpot | Salesforce MC | Mailchimp |
|---------|---------|---------|---------------|-----------|
| AI Agents | 214 | Limited | Einstein (add-on) | Basic |
| Multi-tenant | Native | No | No | No |
| LatAm Focus | Yes | Partial | Partial | No |
| Legal AI | Included | No | No | No |
| Credit Hub | Included | No | No | No |
| Onboarding Wizard | 8-step | Basic | Complex | Basic |
| Starting Price | $5K/mo | $800/mo | $4K/mo | $300/mo |
| White-label | Yes | No | Partial | No |

### Differentiation

1. **All-in-one platform**: Marketing + Legal + Credit + SIC in single suite
2. **LatAm-first**: Spanish-language UI, DR/CO jurisdiction support
3. **Native multi-tenancy**: Built for agencies and multi-brand companies
4. **AI-native**: Agents are core architecture, not bolt-on features
5. **Regulatory compliance**: Legal AI with RAG and knowledge packs

---

## PR History

### Frontend (`nadakki-dashboard`)

| PR | Title | Date |
|----|-------|------|
| #41 | `feat(navigation): restore full sidebar with 240+ pages` | 2026-05-12 |
| #42 | `feat(navigation): vibrant color-coded sidebar` | 2026-05-13 |
| #43 | `docs(forge): fix docs:validate after vibrant sidebar merge` | 2026-05-13 |
| #44 | `chore(cleanup): delete 16 orphaned stub pages` | 2026-05-13 |
| #46 | `security(bff): fix BFF tenant isolation breach (CVE-001 R2)` | 2026-05-13 |
| #47 | `feat(marketing): interactive onboarding wizard` | 2026-05-13 |
| #48 | `fix(marketing): remove hardcoded mock data from 7 pages` | 2026-05-13 |
| #49 | `fix(advertising): white-on-white text bug (P0)` | 2026-05-13 |
| #50 | `security(bff): close BFF tenant isolation - CVE-001 final` | 2026-05-13 |
| #51 | `fix(marketing): remove final 2 mocks` | 2026-05-13 |

### Backend (`nadakki-ai-suite`)

| PR | Title | Date |
|----|-------|------|
| #76 | `security(ci): automated tenant isolation contract tests` | 2026-05-13 |
| #77 | `fix(agents): reduce catalog inflation ~370 → ~214 agents` | 2026-05-13 |

---

## Verification Checklist

### Pre-Launch

- [x] All mock data removed from production pages
- [x] CVE-001 tenant isolation fully resolved (11/11 tests passing)
- [x] Agent catalog cleaned (~370 → ~214)
- [x] Onboarding wizard functional
- [x] All PRs merged to main (#46-#51, #76, #77)
- [x] Frontend builds without errors
- [x] Production deployment verified on Vercel
- [x] Backend deployment verified on Render

### Post-Launch Monitoring

- [ ] Monitor Vercel error rates for 24h
- [ ] Monitor Render backend error rates
- [ ] Verify CrediCefi tenant can log in
- [ ] Verify campaign data loads for pilot tenant
- [ ] Run security exploit tests weekly
- [ ] Monitor agent discovery count in `/health` endpoint

---

## Quick Reference

| Item | Value |
|------|-------|
| Frontend URL | Vercel (auto-deploy from main) |
| Backend URL | `https://nadakki-ai-suite.onrender.com` |
| Auth Endpoint | `/api/v2/auth/login` |
| Health Check | `/health` |
| Frontend Repo | `csorianoai/nadakki-dashboard` |
| Backend Repo | `csorianoai/nadakki-ai-suite` |
| Backend Tag | `v5.4.7` |
| Build Command | `npx next build --webpack` (Windows) |
| Node Version | 18+ |
| Python Version | 3.11+ |

---

*Generated: 2026-05-13 | Marketing Core v1.0 Sprint Closure*
*This document is the source of truth for the Marketing Core v1.0 release.*
