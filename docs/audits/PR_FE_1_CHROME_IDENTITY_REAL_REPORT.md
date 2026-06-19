# PR-FE-1 — Chrome compartido: identidad real (sin datos demo)

**Stream:** Frontend / Credit Hub Dealer-Bank Core
**Branch:** `feat/antispoofing-bank-evidence-real` (work-in-progress; PR-FE-1 changes scoped al chrome)
**Objetivo:** Eliminar datos demo del chrome compartido (`ChTopbar` / `ChAppShell` / `ChSidebar`) y conectarlo a identidad real (`AuthContext`), tenant/institución real (props) y conteos reales — o fallbacks explícitos no engañosos.
**Blocker de auditoría resuelto:** BLOCKER #1 (Mock dependency risk: HIGH) — usuario demo "María Reyes", badge de notificaciones "2", tenant switcher demo, badges hardcoded "47"/"3"/"8"/"2".

---

## 1. Files changed

| File | Tipo | Cambio |
|---|---|---|
| `components/credit-hub/shell/useChromeIdentity.ts` | **NEW** | Hook context-safe que deriva `{ name, initials, email, role }` desde `AuthContext`. Sin provider devuelve fallbacks explícitos (`Usuario` / `—`), nunca demo. No usa `useAuth()` (que lanza excepción) — lee con `useContext` para no romper tests/SSR. |
| `lib/credit-hub/ch-types.ts` | edit | Extiende `ChTopbarProps` (`userEmail`, `notifications`, `tenants`, `onSelectTenant`), `ChSidebarProps` (`user`, `navBadges`) y `ChAppShellProps` (`user`, `userEmail`). Añade tipos `ChNotification` y `ChTenantOption`. |
| `components/credit-hub/shell/ChTopbar.tsx` | edit | Elimina defaults demo (`tenantName="TestBank Mexico"`, `notif=2`, `user="María Reyes"`, email hardcoded, lista de tenants demo, filas de notificación falsas). Tenant switcher solo muestra lista si llega `tenants` real; si no, label estático. Notificaciones reales o empty state. |
| `components/credit-hub/shell/ChAppShell.tsx` | edit | Elimina `resolvedTenant`/`resolvedUser` demo (`TestBank Mexico` / `Auto Plaza` / `María Reyes` / `Jorge Salinas`). Acepta y reenvía `user`/`userEmail` al topbar por defecto. |
| `components/credit-hub/shell/ChSidebar.tsx` | edit | Adelgaza `CH_NAV` a solo `{ groups }` (quita badges `47`/`3`/`8`/`2`, usuarios demo y nombres de tenant demo). Footer user desde prop `user` (fallback `Usuario`/`—`). Header institución con fallback `Institución no disponible`. Badges solo si llegan vía `navBadges` real. |
| `components/credit-hub/bank/BankChShell.tsx` | edit | Inyecta `useChromeIdentity()` → pasa `user`/`userEmail` a `ChAppShell` y `user` (con rol) a `ChSidebar`. |
| `components/credit-hub/dealer/DealerChShell.tsx` | edit | Inyecta `useChromeIdentity()` → pasa `user`/`userEmail` a `ChAppShell` y `user` (con rol) a `ChSidebar`. |
| `app/(forge)/credit-hub/_design/shell-preview/ShellPreviewClient.tsx` | edit | Pasa props demo **explícitas y etiquetadas `(demo)`** al `ChAppShell` de preview. La data demo ahora vive **solo** en esta superficie de diseño, nunca en producción. |

---

## 2. Demo data removed

| Demo data | Ubicación previa | Reemplazo |
|---|---|---|
| `"María Reyes" / "MR"` (usuario) | `ChTopbar` default, `ChAppShell.resolvedUser`, `CH_NAV.bank.user` | Identidad real de `AuthContext.user.name`; fallback `Usuario` / `—`. |
| `"Jorge Salinas" / "JS"` (usuario) | `ChAppShell.resolvedUser`, `CH_NAV.dealer.user` | Igual que arriba. |
| `maria.reyes@testbank.mx` (email) | `ChTopbar` avatar dropdown (hardcoded) | `AuthContext.user.email`; línea oculta si no hay email. |
| `notif = 2` (badge notificaciones) | `ChTopbar` default | `notifCount` derivado de `notifications` reales; `0` por defecto → badge oculto. |
| Filas de notificación falsas ("Comité pendiente", "SLA en riesgo") | `ChTopbar` bell dropdown | Render de `notifications` reales o empty state "Sin notificaciones nuevas". |
| `"TestBank Mexico"` / `"Auto Plaza · TestBank"` (tenant) | `ChTopbar` default, `ChAppShell.resolvedTenant`, `CH_NAV.*.tenant` | `tenantConfig.institution_name` (prop real); fallback `Institución no disponible`. |
| Tenant switcher demo ("TestBank Mexico", "Cooperativa del Valle", "Crédito Andino CO") | `ChTopbar` dropdown hardcoded | Lista solo si llega `tenants` real; si no, label estático no-interactivo. |
| Badges nav `"47"` (bandeja), `"3"` (cumplimiento), `"8"` (solicitudes), `"2"` (notificaciones) | `CH_NAV` items | Eliminados; badge solo aparece si llega vía `navBadges` (conteo real). |
| `"TB"` / `"AP"` (iniciales tenant) | `CH_NAV.*.initials` | Derivadas de `institutionName`; fallback neutral `CH`. |

---

## 3. Real identity source used

- **Hook:** `components/credit-hub/shell/useChromeIdentity.ts`.
- **Fuente:** `AuthContext` (`lib/auth/auth-context.tsx`) — campos `user.name`, `user.email`, `activeRole.display_name`.
- **Diseño context-safe:** lee con `useContext(AuthContext)` (no `useAuth()`, que lanza fuera de provider). Fuera de un `AuthProvider` (tests, SSR) devuelve fallbacks explícitos, **nunca** identidades demo.
- **Iniciales:** derivadas del nombre real (primeras letras de las dos primeras palabras); `—` si no hay nombre.

## 4. Tenant / institution source used

- **Fuente:** `tenantConfig.institution_name` desde `useTenantConfig()` — ya pasado por `BankChShell` y `DealerChShell` como `tenantName` (topbar) e `institutionName` (sidebar).
- **Fallback:** `Institución no disponible` cuando el valor está vacío.
- **Tenant switcher:** `AuthContext` no expone una lista de tenants disponibles, por lo que el switcher **no** muestra entradas demo. Se renderiza como label estático con el tenant actual. La prop opcional `tenants` + `onSelectTenant` queda lista para cuando exista un endpoint/lista real (ver gaps).

## 5. Notification / badge behavior

- **Topbar bell:** badge visible solo si `notifCount > 0`. Conteo derivado de `notifications` reales (prop). Sin notificaciones → empty state explícito "Sin notificaciones nuevas". Hoy no hay fuente real conectada ⇒ se muestra el empty state honesto (sin filas falsas).
- **Sidebar nav badges:** ocultos por defecto. Aparecen solo si se inyectan vía `navBadges` (p. ej. `{ bandeja: 12 }`) con un conteo real. Ninguna fuente real está conectada aún ⇒ no se muestran badges (sin "47"/"3" falsos).

---

## 6. Remaining gaps

1. **[UNAVAILABLE] Conteos reales de nav** (`bandeja`, `cumplimiento`, `solicitudes`): la prop `navBadges` está lista, pero falta cablear conteos reales (p. ej. `useBankQueue().total_count`, conteo de cumplimiento). Se dejó sin badge para no mostrar datos falsos. Follow-up sugerido: PR-FE pequeño que inyecte `navBadges` desde queries ya cacheadas.
2. **[UNAVAILABLE] Notificaciones reales**: no existe endpoint/feed de notificaciones para el chrome. La prop `notifications` está lista; hoy se muestra empty state.
3. **[UNAVAILABLE] Lista de tenants para switch**: `AuthContext` expone `switchTenant()` pero no una lista enumerada de tenants. El switcher queda como label estático; cuando exista la lista, pasar `tenants` + `onSelectTenant`.
4. **Logout no cableado**: los botones "Cerrar sesión" (topbar avatar y footer sidebar) siguen siendo no-op. Fuera del alcance de PR-FE-1 (es identidad/demo, no acciones); candidato a follow-up con `AuthContext.logout`.

---

## 7. Test results

| Check | Resultado |
|---|---|
| `npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0) |
| `npx eslint` (6 archivos del chrome editados) | **PASS** (exit 0, sin errores) |
| `npm run build` (`next build`) | **PASS** (exit 0) |
| Jest: `tests/credit-hub/shell` + `dealer-layout.test.tsx` + `BankPortalShellIsolation.test.tsx` | **PASS** (4 suites, 6 tests) |

Notas:
- Los tests de shell (`ChSidebar.test`, `ChAppShell.test`) y `dealer-layout.test` renderizan el chrome **sin** `AuthProvider`; pasan gracias al diseño context-safe de `useChromeIdentity` (fallbacks, sin throw). Las aserciones existentes (labels de nav, skip link, main landmark) se preservan.

---

## 8. Risk level

**LOW.**
- Cambios aditivos y backward-compatible en las props (todas las nuevas son opcionales).
- Sin cambios de backend, sin rutas nuevas, sin reescritura del shell.
- Sin tenant hardcodeado; identidad y tenant desde fuentes reales con fallbacks honestos.
- Data demo restante confinada exclusivamente a la superficie de preview de diseño (`_design/shell-preview`), claramente etiquetada `(demo)`.

## 9. Recommendation

**APPROVE / READY FOR PR.** El chrome compartido ya no muestra identidad ni conteos demo en pantallas reales de bank/dealer. Cuando existan fuentes reales de conteos/notificaciones/lista de tenants, conectarlas vía las props ya provistas (`navBadges`, `notifications`, `tenants`) en PRs pequeños de seguimiento.

---

## OUTPUT FINAL

**STATUS:** DONE

**FILES CHANGED:**
- `components/credit-hub/shell/useChromeIdentity.ts` (new)
- `lib/credit-hub/ch-types.ts`
- `components/credit-hub/shell/ChTopbar.tsx`
- `components/credit-hub/shell/ChAppShell.tsx`
- `components/credit-hub/shell/ChSidebar.tsx`
- `components/credit-hub/bank/BankChShell.tsx`
- `components/credit-hub/dealer/DealerChShell.tsx`
- `app/(forge)/credit-hub/_design/shell-preview/ShellPreviewClient.tsx`

**DEMO DATA REMOVED:** usuario "María Reyes"/"Jorge Salinas", email `maria.reyes@testbank.mx`, badge notif "2", filas de notificación falsas, tenants demo del switcher, nombres de tenant demo, badges nav "47"/"3"/"8"/"2", iniciales demo "TB"/"AP".

**TESTS:**
- typecheck: PASS
- lint: PASS (eslint sobre archivos editados)
- build: PASS

**REMAINING GAPS:** conteos reales de nav (`navBadges`), notificaciones reales, lista real de tenants para switch, logout cableado — todos con props/ganchos listos y fallbacks no engañosos.

**PR READY:** YES (no mergeado)
