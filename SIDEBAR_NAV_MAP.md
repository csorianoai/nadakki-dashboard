# Sidebar navigation map

This document mirrors the expandable navigation defined in `components/forge/layout/forge-global-sidebar-nav.ts` and rendered by `ForgeGlobalCoresSidebar.tsx`.

## Summary

| Metric | Value |
|--------|------:|
| **Direct sidebar links** (`href`) | **100** |
| **App route `page.tsx` files** | ~240+ (includes dynamic `[id]` routes not duplicated here) |
| **Nav sections** | 6 (Credit, Legal, Marketing, SIC, Workflows, Admin) |

Dynamic pages (e.g. `/legal/cases/[id]`, `/sic/expedientes/[id]`, `/marketing/campaigns/[id]`) are reached from list screens linked below—not every variant has its own sidebar row.

## Source of truth

- **Data:** `NAV_SECTIONS` in `components/forge/layout/forge-global-sidebar-nav.ts`
- **UI:** `components/forge/layout/ForgeGlobalCoresSidebar.tsx`
- **RBAC:** `filterSectionsForUser`, `hasCoreAccess`, `userCanAccessAdminNav`, `superAdminOnly` flags in the nav config

### RBAC (short)

| Role / condition | Behavior |
|------------------|----------|
| `platform_superadmin` | All hub sections; full admin tree (no `superAdminOnly` hides) |
| Other users | Hub visible if RBAC role matches `coreMatchers` **or** tenant `subscribed_cores` includes a matcher (if the list is empty, **permissive**: all hubs—same as pre-migration sidebar) |
| `tenant_admin` / `support_agent` (platform) | **Admin** section visible (plus `superAdminOnly` items only for `platform_superadmin`) |

### Persistence

- Expand/collapse state: `localStorage` key `forge-global-sidebar-expanded-v1`
- Current route: auto-expands ancestor groups

### Badges

| Badge | Usage in config |
|-------|-----------------|
| `NEW` | Recently surfaced links |
| `BETA` | Experimental surfaces |
| `POPULAR` | High-traffic entry points |

---

## Credit Hub (`coreMatchers: credit`)

| Label | Path |
|-------|------|
| Panel | `/credit-hub` |
| Banca | `/credit-hub/bank` |
| Dealer | `/credit-hub/dealer` |
| Banca — listado | `/credit-hub/bank/applications` |
| Dealer — listado | `/credit-hub/dealer/applications` |
| Nueva solicitud | `/credit-hub/dealer/applications/new` |
| Preaprobación | `/credit-hub/dealer/preapproval` |
| Analítica / reportes | `/credit-hub/bank/analytics` |
| Cumplimiento | `/credit-hub/bank/compliance` |
| Auditoría (hub) | `/credit-hub/bank/audit` |
| Crédito (legacy) | `/credit` |
| Nuevo (legacy) | `/credit/new` |
| Decisioning | `/decision` |
| Componentes UI | `/credit-hub/components` |
| Preview | `/credit-hub/preview` |
| Agentes crédito | `/credit-agents` |

## Legal Hub (`coreMatchers: legal`)

| Label | Path |
|-------|------|
| Inicio | `/legal` |
| Legal Hub | `/legal-hub` |
| Expedientes | `/legal/cases` |
| Nuevo expediente | `/legal/cases/new` |
| Contratos | `/legal/contracts` |
| Investigación | `/legal/research` |
| Auditoría | `/legal/audit` |
| Configuración | `/legal/config` |
| Estrategias históricas | `/legal/strategies/historical` |

## Marketing Hub (`coreMatchers: marketing`)

### Suite

| Label | Path |
|-------|------|
| Overview | `/marketing` |
| Marketing Hub | `/marketing-hub` |
| Panorama | `/marketing/overview` |
| Command Center | `/marketing/command-center` |
| Calendario | `/marketing/calendar` |
| Onboarding | `/marketing/onboarding` |

### Campaigns

| Label | Path |
|-------|------|
| Listado | `/marketing/campaigns` |
| Nueva campaña | `/marketing/campaigns/new` |
| Editor | `/marketing/campaigns/editor` |
| A/B Testing | `/marketing/ab-testing` |

### Advertising (`/advertising/*` + legacy marketing)

| Label | Path |
|-------|------|
| Google Ads | `/advertising/google-ads` |
| Meta Ads | `/advertising/meta-ads` |
| LinkedIn Ads | `/advertising/linkedin-ads` |
| TikTok Ads | `/advertising/tiktok-ads` |
| Unified | `/advertising/unified` |
| Landing readiness | `/advertising/landing-readiness` |
| Google (marketing) | `/marketing/google-ads` |

### Engagement

| Label | Path |
|-------|------|
| Customer Journeys | `/marketing/journeys` |
| Nuevo journey | `/marketing/journeys/new` |
| Email builder | `/marketing/email-builder` |
| WhatsApp | `/marketing/whatsapp` |
| Social connections | `/marketing/social-connections` |
| Plantillas IA | `/marketing/templates` |
| Nueva plantilla | `/marketing/templates/create` |
| Booking | `/marketing/booking` |
| Contenido | `/marketing/content` |
| Social | `/marketing/social` |

### Intelligence

| Label | Path |
|-------|------|
| Analytics | `/marketing/analytics` |
| Atribución | `/marketing/attribution` |
| Predictive AI | `/marketing/predictive` |
| Competencia | `/marketing/competitive` |
| Audience builder | `/marketing/audience-builder` |
| Segmentos | `/marketing/segments` |
| Leads & scoring | `/marketing/leads` |

### Agents & automation

| Label | Path |
|-------|------|
| Agentes marketing | `/marketing/agents` |
| Autopilot | `/autopilot` |
| AME (autónomo) | `/ame` |
| Ejecutar | `/marketing/run` |
| Integraciones | `/marketing/integrations` |

## SIC Hub (`coreMatchers: sic`, `platform`)

| Label | Path |
|-------|------|
| Dashboard | `/sic` |
| Expedientes | `/sic/expedientes` |
| Bandeja | `/sic/bandeja` |
| Nuevo análisis | `/sic/nuevo-analisis` |
| Reportes | `/sic/reportes` |
| Métricas | `/sic/metricas` |
| Portafolio | `/sic/portafolio` |
| Comité | `/sic/comite` |
| Sesiones comité | `/sic/comite/sesiones` |
| Exportaciones | `/sic/exportaciones` |
| Auditoría | `/sic/auditoria` |
| Auditoría de acceso | `/sic/auditoria-acceso` |
| Configuración | `/sic/configuracion` |
| Multi-tenant config | `/sic/multitenant-config` |
| Modo demo | `/sic/demo` |
| Listado (legacy) | `/sic/list` |
| Carga | `/sic/upload` |

**Related (global):** Decisioning lives under Credit Hub as `/decision`.

## Workflows (`coreMatchers: marketing`, `credit`, `legal`, `sic`, `platform`)

| Label | Path |
|-------|------|
| Todos los workflows | `/workflows` |
| A/B Testing | `/workflows/ab-testing-experimentation` |
| Campaign optimization | `/workflows/campaign-optimization` |
| Competitive intelligence | `/workflows/competitive-intelligence-hub` |
| Content performance | `/workflows/content-performance-engine` |
| Customer acquisition | `/workflows/customer-acquisition-intelligence` |
| Customer lifecycle | `/workflows/customer-lifecycle-revenue` |
| Email automation | `/workflows/email-automation-master` |
| Influencer partnership | `/workflows/influencer-partnership-engine` |
| Multi-channel attribution | `/workflows/multi-channel-attribution` |
| Social media intelligence | `/workflows/social-media-intelligence` |

## Admin (gated by `userCanAccessAdminNav`)

### Platform

| Label | Path | Notes |
|-------|------|--------|
| Panel admin | `/admin` | |
| Tenants | `/tenants` | |
| Activación | `/admin/activation` | |
| Gates / roles | `/admin/gates` | |
| Billing | `/admin/billing` | |
| Feature flags | `/feature-flags` | `superAdminOnly` |
| Audit logs | `/admin/logs` | |
| API keys | `/admin/api-keys` | `superAdminOnly` |
| Uso | `/admin/usage` | |
| WhatsApp admin | `/admin/whatsapp` | |

### Settings (admin + account)

| Label | Path | Notes |
|-------|------|--------|
| Sistema | `/admin/system` | `superAdminOnly` |
| Config | `/admin/config` | |
| Branding (admin) | `/admin/branding` | |
| Base de datos | `/admin/db` | `superAdminOnly` |
| QA | `/admin/qa` | |
| Integraciones (cuenta) | `/settings/integrations` | |
| Notificaciones | `/settings/notifications` | |
| Branding (cuenta) | `/settings/branding` | |
| IA (cuenta) | `/settings/ia` | |
| Ajustes | `/settings` | |

### Agents

| Label | Path |
|-------|------|
| Todos (admin) | `/admin/agents` |
| Google Ads agent | `/admin/google-ads-agent` |
| Credit agents | `/credit-agents` |
| Marketing agents | `/marketing/agents` |
| Readiness | `/admin/readiness` |
| Onboarding | `/admin/onboarding` |
| Sales scripts | `/admin/sales-scripts` |

---

## Pages not individually listed

Examples (non-exhaustive):

- Forge Credit Hub nested wizard steps under `/credit-hub/dealer/applications/new/*`
- Legal case tabs under `/legal/cases/[id]/*`
- Marketing campaign detail `/marketing/campaigns/[id]`, journey detail `/marketing/journeys/[id]`
- SIC expediente detail `/sic/expedientes/[id]` and replay
- Tenant detail `/tenants/[tenantId]`
- Many dashboard root modules (`/dashboard`, `/analytics`, etc.)—add a **Dashboard** hub in the nav config if they must appear in the sidebar

To add a link: extend `NAV_SECTIONS` and update this document in the same PR.
