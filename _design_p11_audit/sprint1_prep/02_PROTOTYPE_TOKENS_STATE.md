# FASE 2 — Estado del prototipo (Navy Inverso / tokens + shell)

**Fuente revisada:**

- `forge-design-preview/forge/tokens.css` (principal)
- `forge-design-preview/forge/shell.css` (layout BD / consumo de los mismos tokens)

**Última actualización:** 2026-05-10 (pre-work P11-01)

---

## 2.1 Filosofía del prototipo vs app

El prototipo asume **`document.body`/`html` con `[data-theme]` y `[data-tenant]`**, variables en **`:root`**, modelo **dark-first** con bloque **`[data-theme="light"]`** de igual fidelidad. Incluye **primitivas globales** (`.card`, `.btn`, `.input`, `.badge`, tablas `.dt`) que **no** existen igual en la app Forge actual (esta usa Tailwind + `components/forge/ui`).

---

## 2.2 Variables declaradas — `tokens.css` (`:root`)

### Tenant semantic trio (credicefi default en dark)

| Variable | Valor (proto) |
|----------|----------------|
| `--forge-tenant-primary` | `#4F8FD9` |
| `--forge-tenant-primary-strong` | `#2E5F97` |
| `--forge-tenant-primary-soft` | `rgba(79,143,217,0.14)` |
| `--forge-tenant-dark` | `#1A2540` |

### Superficies & líneas

| Variable | Rol |
|---------|-----|
| `--forge-bg-base` | Fondo página (dark `#0A0E1A`) |
| `--forge-bg-raised` | Cards |
| `--forge-bg-elev` | Hover / drawers |
| `--forge-bg-overlay` | Velos suaves |
| `--forge-bg-overlay-strong` | Velos algo más marcados |
| `--forge-line-1` … `--forge-line-3` | Bordes en opacidades (white-based en dark) |

### Ink (⚠_taxonomía 1–4, no escalas 50–900 del actual)

| Variable | Rol típico |
|----------|-----------|
| `--forge-ink-1` | Texto principal |
| `--forge-ink-2` | Secundario |
| `--forge-ink-3` | Terciario / labels |
| `--forge-ink-4` | Disabled |

### Semánticos

Incluye además de hex 500: **bg** y **line** por estado:

- `--forge-success-500`, `--forge-success-bg`, `--forge-success-line`
- `--forge-warning-*`, `--forge-danger-*`, `--forge-info-*`
- `--forge-accent-gold` + `--forge-accent-gold-bg`, `--forge-accent-gold-line`

### Data viz

**Prefijo diferente:** `--viz-1` … `--viz-6` (**sin** `--forge-viz-*`).

### Tipografía

- Fonts: `--forge-font-display`, `--forge-font-body`, `--forge-font-mono`.
- Escala incluye **`--forge-text-2xs`**, **`--forge-text-hero`** (adicional al actual).

### Espaciado

Aliases cortos **`--s1` … `--s20`** — no coincide con nomenclatura `--forge-space-*` del actual.

### Radios + sombras motion

| Familia | Variables |
|---------|-----------|
| Radius | `--r-sm`, `--r-md`, `--r-lg`, `--r-xl` |
| Shadow | `--sh-1`, `--sh-2`, `--sh-3`, `--sh-modal` |
| Easing | `--ease-spring`, `--ease-fast` |

---

## 2.3 Overrides tema — `[data-theme="light"]`

Sobreescribe **bases, líneas, tintas, sombras y tenant primary**:

- Fondo claro `#F6F7FB`; cards `#FFFFFF`; inks oscuros `#0F172A` downward.
- Sombras sutiles `rgba(15,23,42,…)` vs sombras densas globales oscuras.
- `--forge-tenant-primary: #2E5F97`.

**Observación:** **`[data-theme="dark"]` no aparece como bloque explícito**; el comportamiento oscuro viene del ** `:root`** por defecto (dark-first).

---

## 2.4 Overrides tenant (prototipo)

| Selector | Qué redefine |
|---------|----------------|
| `[data-tenant="credicefi"]` | Trio tenant + `--forge-tenant-dark` |
| `[data-tenant="banco-piloto-rd"]` | Primario/accent verde institucional |
| `[data-tenant="testbank-mx"]` | Purple / dark morado |
| Compuestos light | `[data-theme="light"][data-tenant="credicefi"` etc. cambian sólo **`--forge-tenant-primary`** a tonos sobrios en modo claro |

**⚠ Inconsistencia con producción actual:** slug **`banco-piloto-rd`** (proto) vs **`banco-piloto`** (`_design/tokens.css`). **`testbank-mx`** vs **`test-mx-tenant-uuid`** en producción. Debe **alinearse antes** de QA multi-tenant (ver `SPRINT_1_READINESS_REPORT.md`).

---

## 2.5 Globales extras en mismo archivo

Reglas **`body`** con `background: var(--forge-bg-base)`, `color: var(--forge-ink-1)`, scrollbar, `:focus-visible`, primitives (`.card`, `.btn`, …). Esto significa que **fusionar sólo `:root`** al repo sin plan **rompe** porque la app Forge ya establece otros fondos dentro `globals.css` para `body`.

---

## 2.6 `shell.css` — uso de tokens

Consumers directos típicos:

- `background: var(--forge-bg-base)` en `.bd-shell`
- Sidebar / topbar: `var(--forge-bg-raised)`, `var(--forge-line-1/2)`, `var(--forge-ink-*)`, `var(--forge-tenant-primary-soft)`, transitions con `var(--ease-fast)`, `border-radius: var(--r-md)`.

Este archivo sirve como **contrato UX** shell (dimensiones sidebar 244→56 collapsed, grids responsivos `.bd-grid-*`). **No existe copia literal** del shell en Forge layout actual (Forge usa componentes TSX + Tailwind).

---

_Fin FASE 2._
