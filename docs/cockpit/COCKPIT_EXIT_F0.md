# F0 — Cockpit Exit UX Recon

**Date:** 2026-07-13  
**Issue:** Usuario atrapado en `/cockpit` sin salida visual al dashboard tenant.

---

## 1. CockpitTopbar — right side

**Archivo:** `components/cockpit/CockpitTopbar.tsx`

| Zona | Contenido actual |
|------|------------------|
| Left | Menú móvil, `TenantSelector` (`<select>`) |
| Right | Reloj live, botón campana (sin handler), **avatar estático** |

**Right-side detalle (líneas 85–93):**
```tsx
<div className="flex items-center gap-2">
  <div className="flex h-8 w-8 ...">{initials}</div>  // ← NO es <button>
  <div className="hidden text-right sm:block">
    <p>{displayName}</p>
    <p>{roleLabel}</p>
  </div>
</div>
```

**Diagnóstico avatar no responde:** El bloque de usuario es un `<div>` decorativo. **No hay `<button>`, no hay `onClick`, no hay dropdown.** El bug en producción es ausencia de implementación, no z-index ni overlay.

**No existe** `UserMenu` ni `CockpitUserMenu` en el topbar del cockpit.

---

## 2. CockpitSidebar — header / footer

**Archivo:** `components/cockpit/CockpitSidebar.tsx`

| Zona | Contenido |
|------|-----------|
| **Header** (L53–65) | Logo "N" + texto "Nadakki / Network Cockpit" en `<div>` — **sin `<Link>`** |
| Nav | Secciones COCKPIT y Gestión de plataforma vía `CockpitNavLink` |
| **Footer** | Dot health + `Producción · {API_HOST}` |

**Diagnóstico logo no navega:** Mismo patrón — markup estático sin enlace.

**No hay** item de salida al dashboard tenant.

---

## 3. UserMenu global (referencia, NO usado en cockpit)

**Archivo:** `components/forge/auth/UserMenu.tsx`

- Vive dentro de `GlobalForgeAppShell` → `ForgeGlobalTopbar`.
- `AppGate` **excluye** `/cockpit` del shell global (`components/auth/AppGate.tsx` L19–21).
- Items: "Consola de Plataforma" → `/cockpit`, "Cerrar sesion".
- **No reusable directo:** estilos Forge (`forgeSurface-*`), entrada hacia cockpit (dirección opuesta), no incluye "Volver al dashboard".

---

## 4. Ruta canónica — dashboard tenant home

| Fuente | Path |
|--------|------|
| `POST_LOGIN_REDIRECT_BY_ROLE` en `lib/auth/auth-context.tsx` | `platform_superadmin` → **`/`** |
| | `tenant_admin` → **`/`** |
| | `sic_admin` → `/sic` |
| | `legal_admin` → `/legal-hub` |
| | `marketing_admin` → `/marketing` |
| `app/page.tsx` | Home principal Nadakki (cores, quick links, Credit Hub) |
| `app/dashboard/page.tsx` | Existe pero **no** es el post-login default |

**Decisión F1:** Usar `getPostLoginRedirectPath(allRoles)` desde `useAuth().allRoles` — misma lógica que login. Para `platform_superadmin` / `tenant_admin` en producción → **`/`**.

**Tenant activo:** `useAuth().tenant` (`TenantInfo | null`) y `useTenant().tenantId` vía `CockpitContext`. JWT siempre incluye tenant para usuarios que acceden al cockpit.

---

## 5. Restricciones arquitectónicas

| Regla | Cumple |
|-------|--------|
| Cambios solo en `(cockpit)` / `components/cockpit` | Sí — no tocar `AppGate` ni `UserMenu` global |
| Reusar lógica logout de `useAuth().logout` | Sí |
| `TenantContext` / `CockpitContext` para visibilidad | Sí |

---

## 6. Plan F1 (un PR)

1. `CockpitUserMenu.tsx` — dropdown cockpit-themed con "← Volver al dashboard" + logout.
2. `CockpitTopbar.tsx` — reemplazar avatar estático por `CockpitUserMenu`.
3. `CockpitSidebar.tsx` — logo → `Link`; item "← Dashboard tenant" arriba del nav.
