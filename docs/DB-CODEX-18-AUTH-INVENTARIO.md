# DB-CODEX-18 — Inventario de importadores del AuthContext/TenantContext legado

Resultado: **PARADA según la tarjeta** (paso 2). El contexto legado sigue siendo
necesario para rutas fuera del Credit Hub; no se borra nada ni se dejan dos contextos
a medias. Este fichero solo documenta el inventario.

Comando: `grep -rnE "contexts/(AuthContext|TenantContext)" app components lib hooks`

## Dentro del Credit Hub (migrables)
- app/(forge)/credit-hub: 6 ficheros (dealer/page, bank/vehicles/page, bank/_components/BankApplicationOpsPanel, ...)
- app/(bank): 3 ficheros (applications/[id]/page, StipulationsAdminClient, DecisionFormModal)
- components/credit-hub (DealerProfileView, system/CHTenantGuard), components/forge/layout (ForgeAppTopbar, ForgeCreditHubTopbar, ForgeCreditHubCommandPalette)
- lib/credit-hub (hooks/useTenant.ts, api/client.ts), lib/dealer, lib/cockpit/context.tsx

## Fuera del Credit Hub (bloquean el borrado) — ~140 importadores en total
| Área | Ficheros |
|---|---|
| app/marketing | 23 |
| app/sic | 18 |
| app/admin | 17 |
| app/credit (legado, no credit-hub) | 6 |
| app/campaigns, app/competitor-research | 4 + 4 |
| app/advertising | 3 |
| app/social | 2 |
| app/agents, ai-studio, ame, audit, autopilot, billing, execute, market-intel | 1 c/u |
| components: sic(3), ui(4), marketing(4), credit(3), legal(2), advertising, ai, auth/RequireAuth, google-ads, observability, usage, workflows, Providers.tsx, providers/AppProviders.tsx | ~26 |
| hooks: useAMERuns, useAMEStatus, useExecuteLegalTask, useLegal, useLegalCore, useMarketingAgents, useMarketingCampaigns, useSocialConnections, useTenantModules | 9 |
| lib/hooks/useSocialConnect.ts | 1 |

Además ~12 tests mockean `@/contexts/...` y `__tests__/legal/*` usan `TenantProvider`.

## Por qué no se puede migrar "sin cambiar comportamiento"
- El `useAuth` V2 (`lib/auth/auth-context`) expone `tenant` (objeto con `subscribed_cores`),
  no `tenantId`/`tenantName`/`role`/`plan` planos; `useTenant()` legado expone además
  `settings`, `isFeatureEnabled`, `checkLimit`, `setTenantId`, que no existen en V2.
  Hay que decidir primero dónde viven (p. ej. un hook de ajustes de tenant sobre V2).
- `AppProviders` anida `TenantProvider` bajo el `AuthProvider` V2 ("synced from legacy + auth").

## Propuesta para desbloquear (decisión humana)
1. Añadir a V2 una capa compatible (`tenantId`, `tenantName`, `role`, `plan`, `settings`, `isFeatureEnabled`, `checkLimit`) — PARTE 1 (contexts+hooks).
2. Migrar Credit Hub dealer (PARTE 2) y bank/bank-v2 (PARTE 3).
3. Migrar marketing, sic, admin y resto en partes por área (≥6 PRs adicionales, cada uno ≤500 líneas).
4. Borrar contexts/AuthContext.tsx y TenantContext.tsx y añadir el test de regex anti-import.
