# FASE 1 — Estado actual del sistema de tokens (Forge + global)

**Alcance:** inventario tras lectura/grep en `main` post–Sprint 0 **sin modificar código**.  
**Archivos tocados durante el audit:** ver §1.1  
**Última actualización:** 2026-05-10 (pre-work P11-01)

---

## 1.1 Archivos identificados

| Rol | Ruta | Notas |
|-----|------|-------|
| **Forge v3.2 (institutional, activo)** | `app/(forge)/credit-hub/_design/tokens.css` | Alcance `.forge-app`. Brand ramp 50–950, ink 50–900, superficies claras por defecto, semánticos, viz, typo, spacing, radios, shadows, motion, breakpoints, selects por tenant `[data-tenant]`, dealer dark **dormant**. |
| **Entry CSS Forge Credit Hub** | `app/(forge)/credit-hub/forge-globals.css` | `@import "./_design/tokens.css";` único. |
| **Layout cliente** | `app/(forge)/credit-hub/CreditHubLayoutClient.tsx` | Importa `./forge-globals.css` → carga `_design/tokens.css` en rutas `/credit-hub/*`. |
| **Forge root `.forge-app`** | `app/(forge)/layout.tsx` | Contenedor `<div className="… forge-app …" data-tenant={…}>`. Todas las variables de `_design/tokens.css` aplican dentro de esta raíz para el route group `(forge)`. |
| **Legacy portal tokens** | `styles/forge-tokens.css` | `:root` + `:root[data-portal="dealer\|bank\|customer\|admin"]`: `--forge-primary`, `--forge-bg`, `--forge-surface-*`, texto, bordes, semánticos. **Consume** Tailwind mediante fallbacks declarados en `tailwind.config.js`. |
| **Global app** | `app/globals.css` | Mezcla: quantum (`--quantum-*`, `--core-*`), glass, **NADAKKI DS v2.0** (`:root` segunda ola `--color-*`, `--bg-*`, `--text-*`, `--space-*`, legal core, `.ndk-*`), scrollbars animaciones. **`darkMode: 'class'`** sólo en Tailwind; Forge actual no tiene `data-theme` unificado aquí. |
| **Tailwind bridge** | `tailwind.config.js` | `colors.forge*` mapeados a `--forge-brand-*`, `--forge-ink-*`, `--forge-surface-*`, semánticos, viz, accents; aliases legacy `--forge-primary`/`--forge-bg` con `var(--forge-brand-500, var(--forge-primary))` etc. Fonts y `forge-sm/md/lg` radius/shadow/size enlazan a tokens `.forge-app`. |
| **CSS Modules en `components/forge`** | *(ninguno)* | Búsqueda `**/*.module.css` bajo `components/forge/`: **0 archivos**. |

**Total archivos fuente revisados como “capa tokens / bridge”:** **7** (`tokens.css`, `forge-globals.css`, `forge-tokens.css`, `globals.css`, `tailwind.config.js`, más `CreditHubLayoutClient.tsx` + `app/(forge)/layout.tsx` para cableado).

---

## 1.2 Variables CSS actuales (resumen por familia)

### A) `app/(forge)/credit-hub/_design/tokens.css` — `.forge-app`

- **Brand:** `--forge-brand-50` … `--forge-brand-950`.
- **Ink (escala tipo Tailwind zinc-style):** `--forge-ink-50` … `--forge-ink-900`.
- **Superficie (defaults claros institucional):** `--forge-surface-page`, `card`, `raised`, `sunken`, `overlay`.
- **Semánticos:** `--forge-success-50/500/700`, `warning`, `danger`, `info`, `neutral-*`.
- **Acentos no-marca:** `--forge-accent-gold`, `--forge-accent-teal`.
- **Data viz:** `--forge-viz-1` … `--forge-viz-6`.
- **Tipografía:** `--forge-font-display/body/mono`, escala `--forge-text-*` (xs→4xl), leadings, tracking, pesos.
- **Espaciado:** `--forge-space-0` … `--forge-space-24` (rejilla 4pt).
- **Radios:** `--forge-radius-none/sm/md/lg/pill`.
- **Sombras:** `--forge-shadow-none/xs/sm/md/lg`.
- **Bordes declarativos:** `--forge-border-subtle/default/strong`.
- **Motion:** `--forge-ease-out`, `--forge-ease-in-out`, `--forge-duration-fast/base/slow`.
- **Breakpoints (referencia):** `--forge-bp-mobile/tablet/desktop/wide`.

**Tema persona dealer oscuro:** bloque documentado pero **comentado** (no activo).

**Tenants ejemplo en producción (parcial rutas):**

- `[data-tenant="test-mx-tenant-uuid"]` — ramp marca + viz-1 + estilos header `[data-forge-sidebar-header]`.
- `[data-tenant="credicefi"]` — `--forge-brand-500/600/900`.
- `[data-tenant="banco-piloto"]` — `--forge-brand-500/600/900` (slug **piloto**, no `banco-piloto-rd`).

**Modo sistema:** sólo `@media (prefers-reduced-motion: reduce)` bajo `.forge-app`.

---

### B) `styles/forge-tokens.css` — `:root` y `data-portal`

- Escalas cortas `--forge-space-*`, `--forge-radius-*` (**valores ≠** v3.2 en algunos radios/sombras vs `_design`).
- Sombras XL/glow-orange/glow-success, **z-index** (`--forge-z-modal`, etc.).
- Por portal: **`--forge-primary`**, **`--forge-bg`**, **`--forge-surface`**, texto, borde — paletas **dark** para dealer/bank/admin y **light** para customer.

No define `--forge-brand-50`; es capa paralela histórica.

---

### C) `app/globals.css`

- Tokens “quantum/marketing”: `--quantum-void`, `--glass-*`, `--core-*`.
- Bloque NADAKKI v2 `--color-*`, `--bg-*`, `--text-*`, `--space-*`, `--radius-*`, legal practice areas.
- **Body:** `background: var(--quantum-void); color: white` (shell global muy oscuro, independiente del Forge institucional claro dentro de `.forge-app`).

---

### D) `tailwind.config.js` (extensión de tema)

Duplica/elige entre tokens **v3.2 sobre `.forge-app`** y `--forge-*` de **portal legacy** mediante `var(--forge-brand-500, var(--forge-primary))` en colores tipo `forge-primary`, `forge-bg`, etc.

---

## 1.3 Dónde se usan (orientación alta)

| Origen vars | Consumo principal |
|-------------|-------------------|
| `_design/tokens.css` + Tailwind `forge*` | `components/forge/ui/*`, `components/forge/layout/*`, `components/forge/credit-hub/*`; helpers `cn()` + clases `text-forgeInk-*`, `bg-forgeBrand-*`, `border-forgeInk-*`, `rounded-forge-*`, `shadow-forge-*`, etc. |
| `forge-tokens.css` + Tailwind fallbacks | `components/credit-hub/**` (árbol grande; doc en `tailwind.config`: “Permanent legacy aliases”). |
| `globals.css` | Rutas/dashboard principal NDK (`ndk-*`), legal, elementos marketing. |

---

## 1.4 Dark / light actual

| Mecánica | Estado |
|---------|--------|
| **Forge Credit Hub institucional** | Default **surfaces claros** dentro de `.forge-app`; oscuro persona dealer **planificado pero apagado** (comentario en tokens). |
| **Tailwind** | `darkMode: 'class'` — útil rutas fuera Forge; Forge no documenta uso uniforme `class="dark"` en layout Credit Hub junto con tokens v3.2. |
| **Legacy portal `data-portal`** | Dealer/bank **dark** backgrounds en `forge-tokens.css`; customer portal **light**. |
| **`data-theme`** | **No** es el mecanismo canónico hoy para Forge (el prototipo V2 sí lo usa — ver `02_PROTOTYPE_TOKENS_STATE.md`). |

---

## 1.5 Conclusión breve para FASE 3

El sistema actual es **triple capa:** (1) **v3.2 `.forge-app`** institucional claro + rampas Tailwind-ready, (2) **legacy `:root`/portal**, (3) **globals Quantum/NDK**. Cualquier “drop-in” del `tokens.css` del prototipo chocará con **prefijos sobrecargados** (`--forge-ink-*` significa escalas diferentes) y con **consumo Tailwind voluminoso**.

---

_Fin FASE 1._
