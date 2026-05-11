# Sprint 1 — Readiness Report (PRE-WORK P11-01)

**Preparación:** Visual System V2 token migration (`forge-design-preview` → producción Forge)  
**Fecha:** 2026-05-10 · **Sin cambios en código ejecutado durante este pre-work**  
**Commits referencia codebase:** línea base discutida post–Sprint 0 (`9333381` citado usuario; contenido reproducible desde `main` actual del clone)

**Plan ejecutable post-decisiones:** ver `05_P11-01_EXECUTION_COMMANDS.md`.

---

## DECISIONS APPLIED (Cesar, locked)

### DEC1 — Ink-\* conflict: **OPCIÓN B**

**Estrategia:** Renombrar la escala tonal actual **`--forge-ink-50` … `--forge-ink-950`** (grises / neutros de UI) a **`--forge-gray-*`** con la misma numeración **50→900**.

- **Después del refactor**, el prefijo **`--forge-ink-*` queda libre** para los **4 niveles semánticos de texto del prototipo** (`--forge-ink-1` … `--forge-ink-4`).

**Archivos / áreas a tocar en implementación:**

| Área | Acción |
|------|--------|
| `tailwind.config.js` | Renombrar objeto de color **`forgeInk` → `forgeGray`**; cada entrada debe apuntar a `var(--forge-gray-50)` … `var(--forge-gray-900)` |
| **`PERMANENT LEGACY ALIASES`** (misma config) | Actualizar líneas tipo `'forge-text': 'var(--forge-gray-800, …)'`, `'forge-border': 'var(--forge-gray-200, …)'` según nuevo nombre de variable CSS |
| `app/(forge)/credit-hub/_design/tokens.css` | Sustituir declaraciones `--forge-ink-*` de la escala por `--forge-gray-*`; reajustar `var(--forge-ink-*)` → `var(--forge-gray-*)` en neutrales/bordes; **añadir después** `--forge-ink-1..4` (texto prototipo) |
| `styles/forge-tokens.css` | Solo si algo referencia `--forge-ink-*` como escala; alinear con `forge-gray-*` o mantener aislamiento según alcance ticket |
| **TSX/CSS** (`components/**`, `app/**`) | Todas las clases utilitarias **`text-forgeInk-*`, `border-forgeInk-*`, `bg-forgeInk-*`, `ring-forgeInk-*`** → **`forgeGray-*`** (equivalente Tailwind renombrado) |
| **Tests / snapshots Jest** | Actualizar strings de clase si están hardcodeados |

**Verificación esperada tras DEC1:**

- En CSS de Forge: ninguna variable **`--forge-ink-[0-9]{2,3}`** de la vieja escala (solo **`--forge-ink-1` … `4`** del nuevo sistema).
- Grep proyecto: **`forgeInk`** solo como nombre muerto residual (debe ser **0**) y **`forgeGray`** presente donde correspondía **`forgeInk`**.

---

### DEC2 — Tema default: **LIGHT-FIRST**

- **Default:** paleta clara tipo **Navy Inverso / prototype light** (fondo azul muy suave); **no** hace falta setear `data-theme="light"` en ningún sitio si los valores base se definen como default en el contenedor temático.
- **Toggle oscuro:** al activar **`[data-theme="dark"]`** en el nodo acordado (recomendado: **`.forge-app`** o `document.documentElement` — decidir en PR según si Legal/otros route groups comparten shell), aplicar **V1 Slate Navy** con **`--forge-bg-base: #0F1A2E`** (y el resto de superficies/line/ink oscuros coherentes con esa base).
- **Contrato explícito:** `:root` global de `app/globals.css` puede seguir siendo quantum/NDK; **los tokens VS2 viven bajo `.forge-app`** (como hoy) para no romper el dashboard principal oscuro.

**Implementación de referencia (valores ancla default claro en `.forge-app`, sin `data-theme`):**

```css
.forge-app {
  --forge-bg-base: #dbeafe;
  /* … resto de tokens light-first derivados del prototipo (líneas, ink-1..4, raised, etc.) */
}
.forge-app[data-theme="dark"] {
  --forge-bg-base: #0f1a2e;
  /* … overrides Slate Navy / dark inventory */
}
```

---

### DEC3 — Tenant slugs: **LONG** (con código país)

| Slug | Estado |
|------|--------|
| `credicefi` | Sin cambio (OK) |
| `banco-piloto-rd` | **Canónico**; en `tokens.css` producción aún existe selector **`.forge-app[data-tenant="banco-piloto"]`** — **migrar** a `banco-piloto-rd` para alinear con backend + `TENANT_UUID_TO_SLUG` |
| `testbank-mx` | **Nuevo** en CSS prototipo; en front: añadir UUID real a `TENANT_UUID_TO_SLUG` cuando exista; reemplazar o alias **`test-mx-tenant-uuid`** en fixtures |

**Actualizar:**

1. **`lib/credit-hub/types/creditCore.ts`** — `TENANT_UUID_TO_SLUG` (ya apunta `banco-piloto-rd` para el UUID piloto; **confirmar** y añadir `testbank-mx` + UUID).
2. **Base de datos** — `tenant_branding.tenant_slug` coherente con slugs LONG (script SQL de ejemplo en `05_P11-01_EXECUTION_COMMANDS.md`).
3. **`app/(forge)/credit-hub/_design/tokens.css`** — selectores `[data-tenant="…"]` alineados a slugs LONG.
4. **Fixtures / override dev** — `lib/credit-hub/forge-test-tenant-override.ts`, `_design/_inventory/test-tenant-fixtures.ts` si usan slugs cortos.
5. **Sidebar/Topbar** — no suelen hardcodear slug; verificar copy condicional por tenant si existe.

---

## 1 · Resumen ejecutivo

Auditamos tres capas reales (**v3 `.forge-app` institucional**, **legacy `:root` portal**, **Quantum/NDS globals**) frente al **prototipo dark-first Navy Inverso** que introduce taxonomías nuevas (superficie `forge-bg-*`, líneas dedicadas `forge-line-*`, trio tenant semántico, viz sin prefijo, spacing `--s*`, sombras `--sh*`).

**Conclusión (actualizada tras DEC1–DEC3):** los bloqueadores de naming (`ink-*`), tema y slugs están **cerrados**. La migración sigue siendo **incremental recomendada** (gray rename → tokens VS2 → theme toggle → QA). El plan táctico y comandos viven en **`05_P11-01_EXECUTION_COMMANDS.md`** (~2.75 h conservador).

---

## 2 · Conteos *(aprox únicos sintácticamente relevantes)*

| Métrica | Valor orientativo |
|---------|-------------------|
| **Total vars/familias analizadas combinando ambos sistemas** | ~**165–190** declaraciones / alias visibles tras lectura ficheros |
| **NEW (familias o nombres en prototipo ausentes como tal en `_design/tokens.css` activo)** | **38** ±4 |
| **MIGRATE (mismo símbolo o familia sobrecargada con semánticas/ valores distintos)** | **24** ±5 |
| **LEGACY prod (persistirán si se fuerza fusión rápida — o requirieren bridge)** | **52** ±6 |
| **KEEP (reuse estable aparentemente sin ruptura perceptual alta)** | **14** ±3 |

> Incertidumbre ± refleja solapamiento (p.ej., semánticos 500 mismo nombre valores distintos cuentan MIGRATE, no KEEP).

Distribución método: inspección line-by-line `_design/tokens.css` (~118 props activos multi-línea) + bloque `:root`/overrides prototipo (~130 líneas combinadas multi-asignaciones).

---

## 3 · Top 3 Riesgos (priorización)

| # | Riesgo |
|---|--------|
| **R1** | *(Mitigado por DEC1)* Colisión resuelta renombrando escala a **`--forge-gray-*`** y reservando **`--forge-ink-1..4`** para texto. Riesgo residual: **sustituir todas** las clases `forgeInk` en el repo (volumen alto). |
| **R2** | *(Parcialmente mitigado por DEC2)* Light-first en `.forge-app`; dark vía **`data-theme="dark"`**. Riesgo residual: conflicto visual con **`body`** oscuro global (`globals.css`) si no hay contraste claro entre shells. |
| **R3** | *(Mitigado por DEC3 + trabajo)* Alinear **`tokens.css`** (`banco-piloto` → `banco-piloto-rd`) y BD; **`testbank-mx`** hasta tener UUID backend. |

Mitigaciones operativas: `05_P11-01_EXECUTION_COMMANDS.md` (grep de verificación, redirects opcionales, rollback).

---

## 4 · Componentes / áreas tocadas de forma esperada tras migración efectiva

| Área | Archivos ejemplo (representativos) |
|------|------------------------------------|
| **Forge UI primitives** | `components/forge/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `DataTable.tsx`, `Modal.tsx`, `Drawer.tsx` |
| **Forge layout chrome** | `ForgeCreditHubSidebar.tsx`, `ForgeCreditHubTopbar.tsx`, `ForgeCreditHubAppShell.tsx`, `ForgeAppSidebar.tsx` |
| **Forge credit-hub pages composites** | `DealerWizard*Step.tsx`, `BankApplicationDetailView.tsx`, `DealerApplicationStatusView.tsx` |
| **Legacy bridge tree** | `components/credit-hub/**` (consumo clase `*-forge*` + aliases tailwind fallback) |
| **Build config** | `tailwind.config.js` (colores viz + potencial expansión radios/sombras) |
| **Global legal shell** | `app/(forge)/legal/LegalLayoutClient.tsx` *(import mismo `forge-globals.css` ⇒ side-effects)* |

Ningún cambio ejecutado aquí — lista orienta PR impact review.

---

## 5 · Estimación tiempo implementación útil *(post approvals)*

| Escenario | Horas persona dev (sin paralel QA) |
|-----------|------------------------------------|
| **Incremental seguro** (PASO D0 decidido + 2–4 sub-commits) | **3.0–4.5 h** desarrollo inicial + **1.0–1.8 h** QA visual primera pasada |
| **Big bang (discouraged)** archivo único swap | Reduce coding aparentemente a **≤1 h**, pero aumenta rework **>4 h** probabilístico + riesgo bloque sprint |

Documento inicial 60–90 min de implementación sólo válido como **solo backup + scaffolding alias** (no adopción real V2 perceptual).

---

## 6 · READY TO EXECUTE

### Veredicto: **SÍ — READY TO EXECUTE (pendiente “GO” explícito)**

**Motivo:** DEC1–DEC3 cubren los bloqueadores documentados en la prep. El trabajo se ejecuta según **`05_P11-01_EXECUTION_COMMANDS.md`** (branch, backup, refactor gray, tokens, slugs, typecheck, build, QA, push).

**Entregables:**

| Entregable | Estado |
|-----------|--------|
| Inventarios actuales + prototipo (`01_*`, `02_*`) | ✅ |
| Diff + riesgos (`03_*`) | ✅ |
| Plan pasos (`04_*`) | ✅ |
| **Decisiones Cesar (DEC1–DEC3)** | ✅ (sección arriba) |
| **Comandos ejecutables** | ✅ `05_P11-01_EXECUTION_COMMANDS.md` |

---

## 7 · Open Questions for Cesar *(post-DEC; solo si aplica en PR)*

1. **Nodo del theme toggle:** ¿`data-theme="dark"` en **`.forge-app`** (recomendado, aislado) o en **`<html>`** (afecta todo el sitio)?  
2. **UUID canónico** para `testbank-mx` cuando backend lo tenga (placeholder en `TENANT_UUID_TO_SLUG`).  
3. **Baseline screenshots:** poblar `_design_p11_audit/screenshots/baseline/` antes del primer diff visual o aceptar captura ad-hoc en PR.  
4. **Alcance `styles/forge-tokens.css`:** ¿incluido en P11-01 o ticket separado (P11-03+)?

---

## 8 · Próximo paso recomendado (operativo corto)

1. Cesar: mensaje **“GO P11-01”**.  
2. Ejecutar **STEP 0–8** de `05_P11-01_EXECUTION_COMMANDS.md`.  
3. PR con enlace a este reporte + checklist DEC1–DEC3 en descripción.

---

_Reporte ejecutivo generado durante PRE-WORK; no ejecuta migración._
