# FASE 4 — Plan de migración ejecutable P11-01 (Visual System V2)

**Estado:** planificación **solo documentación** · **no ejecutar** hasta approval ticket.  
**Prereqs leídas:** `01_*`, `02_*`, `03_*`.

---

## Resumen ejecutivo

Un “PASO 2: pegar prototipo íntegro” **fallará** porque:

1. **Colisión semántica** `--forge-ink-{1–4}` (proto) vs `--forge-ink-{50–900}` (prod).  
2. **Anchoring** `:root` + estilos `body` globales prototipo contra **`.forge-app` + layout Next** actual.  
3. **Naming viz** `--viz-*` vs `--forge-viz-*` + configuración Tailwind.  
4. **`data-theme` + `data-tenant`** slugs no alineados con producción (`banco-piloto-rd` ≠ `banco-piloto`).

Este plan ordena trabajo en **incrementos reversibles**.

---

### PASO 0 — Decisiones cerradas antes de código (gates)

**D0-a · Modelo tema por defecto**

- ¿Mantener **institucional claro** dentro de Forge (`--forge-surface-*` actuales) y adoptar V2 sólo como capa paralela hasta cut-over?  
- ¿O ejecutar estrategia **dark-first igual al prototipo** y tratar modo claro vía `[data-theme="light"]`?  
👉 Sin esto NO proceder PASO 2 grande.

**D0-b · Estrategia anti-colisión ink**

Opciones catalogadas:

1. Prefijo nueva taxonomía: `--forge-tx-1…4` o `--fs-text-1…4`.  
2. Renombrar escala atual a `--forge-zinc-50…900` (breaking masivo Tailwind).

**Recomendación técnica documentada:** **(1)** con periodo donde variables viejas exponen aliases calculados sólo dentro `.forge-app`.

**D0-c · Canonical tenant slug map**

Fusionar tabla única `{ proto slug : prod slug | backend slug }` incluyendo `banco-piloto*` y `testbank-mx*` / UUID test.

---

### PASO 1 · Backup formal + branch (≈ 5 min)

```bash
git checkout main && git pull
git checkout -b feat/p11-01-visual-system-v2
```

Acción:

```powershell
Copy-Item "app/(forge)/credit-hub/_design/tokens.css" "app/(forge)/credit-hub/_design/tokens.css.backup-pre-p11"
git add "app/(forge)/credit-hub/_design/tokens.css.backup-pre-p11"
git commit -m "chore: backup tokens.css before P11-01 migration"
```

> Ajustar ruta efectiva (`app/(forge)/...`) según shell; usar comillas porque paréntesis.

---

### PASO 2 · Fusión estratégica (NO literal) (≈ 25–35 min trabajo real — estimación proyecto)

Objetivos:

1. **Extraer sólo tabla token** desde `forge-design-preview/forge/tokens.css`.  
2. **Re-scope** selectores globales `:root { … }` del prototipo a **`.forge-app[data-theme]?`**, preservando aislamiento de `app/globals.css` body styling. Eliminar/regatear bloque que setea `html, body { background … }` del prototipo dentro del bundle Forge (mover selectores específicos a wrapper interno opcional clase `.forge-vs2-root` si necesario aislar previews).  

Sub-pasos sugeridos (commits atómicos):

| ID | Commit sugerido | Contenido |
|----|-----------------|-----------|
| 2a | `feat(forge): P11-01 scaffold VS2 aliases (no behavioral change)` | Añadir sección nueva comentada + duplicados alias que referencien vars actuales (no-op visual) |
| 2b | `feat(forge): P11-01 introduce tenant trio semantic tokens mapped to brand ramps` | `--forge-tenant-primary*` derivados `--forge-brand-500` temporalmente (`color-mix` / direct mapping) sin romper tw |
| 2c | `feat(forge): P11-01 map surface synonyms (bridge)` | Alias `--forge-bg-base: var(--forge-surface-page)` opt-in clase utilitaria `data-vs2="1"` en layout dev-only flag |
| 2d | `feat(forge): P11-01 adopt prototype semantic status backgrounds` | Añadir *-bg / *-line si no existen |

**Commits evitados inicialmente**: reemplazo total archivo.

Adaptaciones paths/imports:

- Fonts ya inyectadas vía `next/font` vars (`--forge-font-sans` etc.) · conservar orden `var(--forge-font-display-opt)` patrón existente antes de texto literal proto.

---

### PASO 3 · Typecheck CI local (≈ 2–4 min)

```bash
npx tsc --noEmit
npm run lint  # opcional si ticket lo exige (no solicitado Sprint1 prep)
```

Cero errores **gate** antes de continuar merges mayores.

---

### PASO 4 · Regression visual dirigida (≈ 35–55 min equipo QA)

Lista mínima snapshot (prioridad):

| Ruta / superficie |
|-------------------|
| `/credit-hub` hub |
| `/credit-hub/bank` + aplicaciones tabla |
| `/credit-hub/bank/applications/[id]` detalle pesado |
| `/credit-hub/dealer` + lista |
| `/credit-hub/dealer/preapproval` simulador |
| Wizard nueva solicitud (multi-step chrome) |

Almacén comparación: `_design_p11_audit/screenshots/baseline/` (**crear política nomenclatura** `baseline/{route}__viewport.png`). Si falta baseline, capturar estado **PRE** migración igualmente.

Marca FAIL si cualquier página pierde WCAG AA contraste institucional (documentar HEX vs ratio).

---

### PASO 5 · Smoke multi-tenant (≈ 12–18 min manual)

Ejecutar con **slugs FINAL acordados** (post PASO D0-c):

| Caso |
|------|
| **Credicefi** — navy perceptible sidebar/topbar coherence |
| **Banco Piloto RD** — verde alineación tokens |
| **Test MX / sandbox** — púrpura / contraste alto |

Si flag dev-only `NEXT_PUBLIC_FORGE_*` existe, repetir combinaciones.

---

### PASO 6 · Toggle modo tema (≈ 10–15 min)

Requisitos después de fusión efectiva tema proto:

| Check |
|-------|
| `data-theme="light"` toggled en `<html>` o `.forge-app` root controlado desde layout |
| Persistencia opcional (`localStorage` policy producto) fuera alcance inicial |
| Estado dark (default prototipo): verificar páginas clave igual que PASO 4 |

Mitigación: si body global dark en proto compite con Forge claro actual, aislar mediante **solo descendent `.forge-app`**.

---

### PASO 7 · Commit consolidación + push (≈ 5–8 min)

```bash
git commit -m "feat(forge): P11-01 - Visual System V2 token migration (incremental)"
git push origin feat/p11-01-visual-system-v2
```

(Si trabajo quedó sólo tras varios PASO 2 sub-commits squash policy seguir convención repo.)

---

### PASO 8 · NO merge (`main`)

PR review Cesar · checklist:

- Contraste AA spot-check tabla  
- Slug tenant tabla  
- Lista componentes modificados externos tokens (tailwind extend?)  
- ADR corto opcional `_design/MIGRATION_P11_VS2.md`

---

## Estimación global (solo implementación después de approvals)

| Fase | Tiempo |
|------|--------|
| Pasos 0–1 | 15–25 min (+ decision latency) |
| Paso 2 incremental | **45–90 min** (según nivel de paralelización) |
| Paso 3 | 5 min |
| Pasos 4–6 QA manual | **50–85 min** first pass |
| Pasos 7–8 housekeeping | 10 min |

**TOTAL net engineering (solo front tokens path): ~2–3.5 h** por dev senior si decisiones cerradas antes; el documento inicial de 60 min se queda corto si se intenta BIG-BANG único archivo.

---

## Riesgos + mitigación (lista operativa)

| Riesgo | Mitigación |
|--------|-----------|
| Regresiones visibles masivas | Backup `tokens.css.backup-pre-p11` + flags `data-vs2` opt-in antes de borrar viejo |
| `--forge-ink-*` collision | Ejecutar D0-b obligatorio antes de merge |
| Tailwind clase fantasma (--forge-viz) | Script validación temporal `grep` falla build si vars undefined |
| Tema inconsistente Legal / Credit Hub | Import compartido `forge-globals.css` ⇒ pruebas cruzadas `/legal` |

---

_Definición: este documento **es** la base del ticket P11-01 después de approvals de producto._

_Fin FASE 4._
