# FASE 3 — Diff: tokens **actuales** vs prototipo Visual System V2

**Referencias:**  
- Actual: `_design_p11_audit/sprint1_prep/01_CURRENT_TOKENS_STATE.md`  
- Proto: `_design_p11_audit/sprint1_prep/02_PROTOTYPE_TOKENS_STATE.md`

**Metodología:** comparación nominal + semántica; no hay hash automático (`diff` archivo completo produciría ruido por primitivas CSS del proto).

---

## 3.1 Clasificación (resumen ejecutivo por categoría)

| Categoría | Significado breve |
|-----------|-------------------|
| **NEW** | Nombre nuevo en proto útil para V2; no existe igual en `_design/tokens.css` (.forge-app) **o** reemplaza modelo mental distinto |
| **LEGACY** | Existe aplicación pero **sin** equivalente nomina 1:1 en prototipo → mantener hasta migración Tailwind/UI |
| **MIGRATE** | Misma **presencia de nombre** pero **valor o semántica** distinta ⇒ riesgo de shift visual/regresiones |
| **KEEP** | Mismo símbolo (o uso equivalente estable) dentro de umbrales perceptivos aceptables (revisión visual final) |

**Conflicto de nombres crítico 🔴:**

- Producción `--forge-ink-*` usa **escala 50→900 tipo paso tonal**.  
- Prototipo `--forge-ink-1..4` = **jerarquía tipográfica** (no comparables número a número).

Cualquier reemplazo “directo” de archivo **sobrescribe** significados entre sistemas ⇒ **HIGH RISK**.

---

## 3.2 Tabla diferencial representativa

> Notas: valores “actual” desde `app/(forge)/credit-hub/_design/tokens.css` donde aplique; “proto” desde `forge-design-preview/forge/tokens.css`.

| Variable / familia | Status | Valor actual (prod .forge-app) | Valor prototipo (`:root` dark-first) | Notas |
|--------------------|--------|---------------------------------|---------------------------------------|-------|
| **Superficie página / base** | **NEW ↔ MAP** | `--forge-surface-page: #f7f8fa` | `--forge-bg-base: #0A0E1A` (dark default) | **Polar opuesto filosofía.** Proto dark-first institucional; prod **light-first**. Migración ≠ swap de archivo sin decisión producto |
| `--forge-bg-raised / card` | NEW (proto naming) vs **MIGRATE** semántico | `--forge-surface-card: #ffffff` | `--forge-bg-raised: #0F1424` (dark) | Nombres diferentes; papel “card bg” mismo |
| **Líneas** | NEW | `--forge-border-*` usando `--forge-ink-200..500` | `--forge-line-1..3` RGBA overlays | Sintaxis diferente · conviene capa `@layer` aliases |
| **`--forge-ink-50..900`** vs **`--forge-ink-1..4`** | **LEGACY prod + NEW proto taxonomy** | Escala tonal completa | Jerarquía 4 niveles | **🔴 Conflict name collision**. Requiere o renombre proto o sufijo nuevo (`--forge-txt-*`) |
| **`--forge-brand-*` ramp** | LEGACY prod / **PARTIAL(proto)** | 50→950 ramps | Tenant trio + tweaks light `[data-theme="light"][data-tenant]` | Proto **delega marca** más a trio + overrides; ramps no duplicadas |
| `--forge-success-500` | **MIGRATE** | `#0f7a3e` | `#22C55E` | Verde distinto tonalidad/saturation |
| `--forge-warning-500` | **MIGRATE** | `#b7791f` | `#F59E0B` | |
| `--forge-danger-500` | **MIGRATE** | `#b5201e` | `#EF4444` | |
| `--forge-info-500` | **MIGRATE** | `#1f60b5` | `#60A5FA` | |
| `--forge-accent-gold` | **MIGRATE** | `#c8940a` | `#D4A655` | |
| **Viz** | NEW naming | `--forge-viz-1…6` | `--viz-1…6` (sin prefijo `forge-`) | `tailwind forgeViz.*` apunta `--forge-viz-*` → **tailwind update obligatorio** o re-export |
| **`--forge-tenant-*` trio** | **NEW vs prod** | *No existe* (usa brand ramp `data-tenant`) | Trio + dark | Nueva capa para botones/primitivos tipo `.btn-primary` del proto |
| **Spacing `--forge-space-*`** vs **`--s*`** | LEGACY prod / NEW proto paralelo | Incremental 4pt denominado forge | Tokens cortos s1,s2… | Elegir un sistema o crear bridge |
| **Radii `--forge-radius-*`** vs **`--r-*`** | LEGACY prod / NEW proto paralelo | sm 4/md 6/lg 8 (+pill) | sm/md/lg/xl donde xl=12 en proto | Producción omitía `--r-xl`; tailwind sólo hasta `forge-lg`; proto `r-xl 12px` nuevo |
| **Shadows `--forge-shadow-*`** vs **`--sh-*`** | LEGACY+MIGRATE densidad | Bajos contraste institucional claro | Más densos modo oscuro; light re-soft | |
| **`--ease-spring/--ease-fast`** | **NEW** | `--forge-ease-*` otros cubicBezier | Proto spring / fast específicos | Componentes pueden reanimar timelines |
| **`--forge-text-2xs` / `-hero`** | **NEW** | No en prod | Sí proto | Typography scale divergence |
| **Motion durations** `--forge-duration-*` | LEGACY prod | sí | proto usa transiciones locales en clase (ej. `120ms var(--ease-fast)`) sin trio duration | Harmonizar antes de unify |

---

## 3.3 Inventario numérico aproximado (propiedades `:root`/`.forge-app`)

*(Conteos manuales de líneas con asignaciones de custom properties; pueden variar +/- duplicaciones en comentarios.)*

| Archivo ~ | Tokens propios declarados (~) |
|-----------|-------------------------------|
| `app/(forge)/credit-hub/_design/tokens.css` (.forge-app) | **≈118** asignaciones activas (+ bloque dormant comentado) |
| `styles/forge-tokens.css` | **≈73** combinando base + portals |
| Proto `tokens.css` ` :root ` + tema + tenants | **≈115** combinando bloques overlays |
| `app/globals.css` adicionales (no Forge) | **>80** dispersos quantum/NDS/legal |

Totales declarados “en app” muy superiores a **una** fusión porque hay **layers**.

---

## 3.4 Riesgos de regresión (componentes consumidores críticos)

### Riesgos altos 🔴

1. **Nombre `--forge-ink-*` reusado para semánticas distintas** → todas las utilities `forgeInk-{50..900}` en Tailwind y clases tipo `text-forgeInk-*` sufren comportamiento incomprensible tras swap.
2. **Inversión light/dark filosofía**: pasar de institucional claro `.forge-app` a dark-first `:root` del proto puede destruir contratos accesibilidad revisados QA (sidebar header gradientes contra ink).
3. **Slugs `[data-tenant]` distintos** entre proto y `_design/tokens.css` → branding incorrecto QA multi-tenant aun cuando colores están bien definidos.

### Riesgos medios 🟠

| Área | Alcance revisado grep `components/forge` | Notas |
|------|--------------------------------------------|-------|
| `components/forge/ui/*` | Buttons, Inputs, DataTable, Card, Drawer, Modal, Charts parciales (~30+ ficheros con clases Forge) | Depende de `forgeInk`, `forgeBrand`, shadows |
| `components/forge/layout/*` | Sidebar, Topbar, AppShell, palettes | Sidebar header color-mix con brand |
| `components/forge/credit-hub/*` | Wizard + vistas grandes (Application/Bank detailed) (~archivos grandes) | Mayor densidad de utilidades Forge |
| `components/credit-hub/**` | Decenas de vistas + wizard | Fallback `--forge-*` legacy tailwind |

### Riesgos bajos / controlados 🟢

Legal layout importa mismo `forge-globals.css`; si tokens alteran sólo ramps sin romper nombres, impacto menor. Aun así **necesidad de snapshot visual /legal**.

---

## 3.5 Uso (muestra grep — críticas)

Ejemplos cualitativos (no exhaustive lists para no inflar archivo):

| Patrón / token | ¿Dónde se ve mucho uso? |
|----------------|-------------------------|
| `text-forgeInk-` / `forgeInk` Tailwind colors | Amplio `components/forge/ui/*`, layout, credit-hub TSX Forge |
| `bg-forgeBrand-` | Headers / CTAs institucional |
| `border-forgeInk-200` (+ variantes 100/700) | Tablas tarjetas formularios |
| `shadow-forge-*` | Cards overlays |
| Legendarios `forge-primary`/`forge-bg` (legacy var) | `components/credit-hub/**` mediante tw aliases |

_No se modificó código; para recuentos exhaustivos ejecutar antes de impl:_

```powershell
rg "forgeInk|forgeBrand|forgeSurface|forge-shadow|rounded-forge" components/forge app/`(forge`) -g "*.tsx"
```

---

## 3.6 Bloqueador identificado (#1 técnico)

**No se debe “copiar y pegar” `forge-design-preview/forge/tokens.css` íntegro sobre `app/(forge)/credit-hub/_design/tokens.css` sin:**

1. Re-alcance selectors de `:root` y `body { background }` globales prototipo → **solo `.forge-app`** (o nueva convención), y  
2. Resolver **collision ink naming** mediante **rename** estratégico (p.ej. tokens tipo superficie/proto con prefijo `--fs2-*`) **o** fase intermediaria donde ambos conviven.


---

_Fin FASE 3._
