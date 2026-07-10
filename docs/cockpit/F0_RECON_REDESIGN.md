# F0 — Cockpit UI Redesign Recon

**Date:** 2026-07-10  
**Goal:** Move platform console from `/credit-hub/admin` → `/cockpit` with isolated dark shell.

---

## 1. Árbol antes / después

### Antes
```
app/(forge)/credit-hub/admin/
  layout.tsx          → CHAdminAccessGuard + CockpitProvider + lib/cockpit/CockpitShell
  page.tsx            → NetworkCockpitNivel1
  credit/page.tsx     → CreditCockpitNivel2
  platform/page.tsx   → PlatformCockpitNivel3
lib/cockpit/          → fetchers, nivel1/2/3, old light ch-card UI
components/credit-hub/admin/AdminNetworkOsView.tsx  (legacy, unused)
```

### Después
```
app/(cockpit)/
  layout.tsx          → Inter + JetBrains Mono variables, bg-cockpit-bg (isolated)
  cockpit/
    layout.tsx        → CHAdminAccessGuard + CockpitProvider + CockpitShellLayout
    page.tsx          → Vista de Red (components/cockpit/network)
    credit/page.tsx
    tenants/page.tsx
    users/page.tsx
    plans/page.tsx
components/cockpit/   → NEW dark UI (sidebar, topbar, network, credit, tenants, users, plans)
app/(forge)/credit-hub/admin/page.tsx → redirect('/cockpit')
```

**URL:** `/cockpit`, `/cockpit/credit`, `/cockpit/tenants`, `/cockpit/users`, `/cockpit/plans`

---

## 2. Conservar vs reemplazar

| Archivo | Acción |
|---------|--------|
| `lib/platformApi.ts` | **CONSERVAR** |
| `lib/cockpit/api/*` | **CONSERVAR** (+ normalize response `code`) |
| `lib/cockpit/demo*.ts` | **CONSERVAR** + ampliar 6 cores |
| `lib/cockpit/context.tsx` | **CONSERVAR** |
| `tests/cockpit/*` | **CONSERVAR** |
| `CHAdminAccessGuard` | **CONSERVAR** (reused in `/cockpit` layout) |
| `lib/cockpit/components/CockpitShell.tsx` | **REEMPLAZAR** → `components/cockpit/*` |
| `lib/cockpit/nivel1/*` | **REEMPLAZAR** → `components/cockpit/network/*` |
| `lib/cockpit/nivel2/*` | **REEMPLAZAR** → `components/cockpit/credit/*` |
| `lib/cockpit/nivel3/*` | **REEMPLAZAR** → `components/cockpit/{tenants,users,plans}/*` |
| `app/(forge)/credit-hub/admin/*` | **REEMPLAZAR** → redirect only |
| `AdminNetworkOsView.tsx` | **ELIMINAR** (F5) |

---

## 3. Topbar global + user menu

| Item | Ubicación |
|------|-----------|
| Global shell | `components/forge/layout/GlobalForgeAppShell.tsx` |
| Topbar | `components/forge/layout/ForgeGlobalTopbar.tsx` |
| User menu | `components/forge/auth/UserMenu.tsx` — dropdown avatar, solo "Cerrar sesion" hoy |
| AppGate | `components/auth/AppGate.tsx` — wraps routes in `GlobalForgeAppShell`; **bypass `/cockpit`** |

**F5:** Agregar ítem "Consola de Plataforma" en `UserMenu.tsx` antes de logout, visible `platform_superadmin` \| `tenant_admin`.

---

## 4. Next.js / route groups

- Next.js 16 App Router (package.json `next build`)
- Route group `(cockpit)` → no segment in URL
- Isolated layout via `app/(cockpit)/layout.tsx` + `AppGate` pathname bypass

---

## 5. Fuentes

- `next/font/google` en `app/(cockpit)/layout.tsx`: Inter (`--font-inter`), JetBrains Mono (`--font-jetbrains-mono`)
- Scoped to `(cockpit)` segment — **no** modificar `app/layout.tsx` root Inter
- Tailwind: `fontFamily.cockpitSans`, `cockpitMono` namespaced in `tailwind.config.js`

---

## 6. useTenantBranding schema (wizard paso 2)

From `lib/credit-hub/types/tenantBranding.ts`:
- API: `display_name`, `logo_url`, `brand_primary`
- Wizard UI labels `primary_color` → maps to `brand_primary` on submit

---

## 7. Admin tile Credit Hub (retirar F5)

`app/(forge)/credit-hub/page.tsx` — portal picker includes `{ href: "/credit-hub/admin", title: admin }` → remove or point to `/cockpit`.

---

## F0 GATE: ✅ PASS
