# P11-01 Implementation — Step-by-Step Commands (PowerShell + Git)

**Estado:** documento **ejecutable por un dev**; este archivo **no ejecuta nada solo**.  
**Repo:** `C:\Users\cesar\Projects\nadakki-dashboard`  
**Decisiones:** DEC1 (gray vs ink), DEC2 (light-first + dark toggle), DEC3 (slugs LONG) — ver `SPRINT_1_READINESS_REPORT.md`.

**Requisitos:** Git, Node 18+, PowerShell 5+; recomendado **`rg` (ripgrep)** en PATH o usar los `Select-String` de abajo.

---

## Pre-conditions

- [ ] Trabajar desde `main` actualizado (baseline acordado puede ser `9333381` o HEAD de `main`; ajustar checkout si hace falta).
- [ ] Cerrar servidor dev durante reemplazos masivos (opcional pero reduce confusión hot-reload).
- [ ] Tener backup local (este plan crea `*.backup-pre-p11`).

---

## STEP 0 — Setup branch + backup (~5 min)

> **Nota paths:** los paréntesis en `app/(forge)/...` requieren **comillas** en PowerShell.

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

git checkout main
git pull origin main

git checkout -b feat/p11-01-visual-system-v2

# Backup tokens actuales (no commitear contenido sensible de .env)
Copy-Item -LiteralPath "app/(forge)/credit-hub/_design/tokens.css" -Destination "app/(forge)/credit-hub/_design/tokens.css.backup-pre-p11" -Force
Copy-Item -LiteralPath "styles/forge-tokens.css" -Destination "styles/forge-tokens.css.backup-pre-p11" -Force

git add "app/(forge)/credit-hub/_design/tokens.css.backup-pre-p11" "styles/forge-tokens.css.backup-pre-p11"
git status
git commit -m "chore(p11-01): backup tokens css files pre-migration"
```

---

## STEP 1 — Refactor escala `--forge-ink-*` → `--forge-gray-*` (DEC1) (~30–45 min)

### 1.A Orden obligatorio

1. Renombrar **solo** los tokens de escala **`50, 100, …, 900`** a `--forge-gray-*` en **CSS** (`_design/tokens.css`, backups comentados dormant, `styles/forge-tokens.css` si aplica).  
2. **Después** insertar los nuevos **`--forge-ink-1` … `--forge-ink-4`** (texto prototipo) en `.forge-app`.  
3. Renombrar **Tailwind** `forgeInk` → `forgeGray`.  
4. Renombrar **clases** en TSX/MDX: `forgeInk` → `forgeGray`.

> No usar un replace global ciego `--forge-ink-` → `--forge-gray-` en un solo paso sobre todo el repo antes de introducir `--forge-ink-1..4`; primero migra la escala numérica explícitamente.

### 1.B Script PowerShell — reemplazo en archivos CSS (escala 50–900)

Ajusta `$files` si necesitas incluir más rutas.

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

$scale = @('50','100','200','300','400','500','600','700','800','900')
$targets = @(
  "app/(forge)/credit-hub/_design/tokens.css",
  "styles/forge-tokens.css"
)

foreach ($rel in $targets) {
  $path = Join-Path (Get-Location) $rel
  if (-not (Test-Path -LiteralPath $path)) { Write-Warning "Skip missing: $rel"; continue }
  $c = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  foreach ($n in $scale) {
    $c = $c -replace "--forge-ink-$($n):", "--forge-gray-$($n):"
    $c = $c -replace "var\(--forge-ink-$($n)\)", "var(--forge-gray-$($n))"
  }
  Set-Content -LiteralPath $path -Value $c -Encoding utf8 -NoNewline
}

# Revisión manual: neutrales que apuntaban a --forge-ink-100 etc. deben quedar en --forge-gray-*
```

### 1.C Tailwind — `tailwind.config.js`

Edición **manual recomendada** (más seguro que regex):

1. Renombrar clave del objeto `forgeInk` → **`forgeGray`**.
2. Todas las referencias `var(--forge-ink-...)` dentro de ese bloque → `var(--forge-gray-...)`.
3. En **PERMANENT LEGACY ALIASES**, líneas como:
   - `'forge-text': 'var(--forge-gray-800, var(--forge-text))'`
   - `'forge-text-muted': 'var(--forge-gray-500, …)'`
   - `'forge-border': 'var(--forge-gray-200, …)'`
   - (mismo patrón para border-hover)
4. Ejecutar grep de verificación (ver §1.E).

### 1.D Script PowerShell — clases utilitarias TSX/MDX TS

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

$roots = @('components','app','lib','tests')
$patterns = @('*.tsx','*.ts','*.mdx')
foreach ($root in $roots) {
  foreach ($pat in $patterns) {
    Get-ChildItem -Path $root -Recurse -Filter $pat -File -ErrorAction SilentlyContinue |
      ForEach-Object {
        $p = $_.FullName
        $raw = Get-Content -LiteralPath $p -Raw -Encoding UTF8
        if ($raw -notmatch 'forgeInk') { return }
        $new = $raw
        $new = $new -replace 'text-forgeInk-', 'text-forgeGray-'
        $new = $new -replace 'bg-forgeInk-', 'bg-forgeGray-'
        $new = $new -replace 'border-forgeInk-', 'border-forgeGray-'
        $new = $new -replace 'ring-forgeInk-', 'ring-forgeGray-'
        $new = $new -replace 'from-forgeInk-', 'from-forgeGray-'
        $new = $new -replace 'to-forgeInk-', 'to-forgeGray-'
        $new = $new -replace 'via-forgeInk-', 'via-forgeGray-'
        if ($new -ne $raw) { Set-Content -LiteralPath $p -Value $new -Encoding utf8 -NoNewline }
      }
  }
}
```

### 1.E Verificación (debe quedar **vacío** salvo comentarios/docs intencionados)

Con **ripgrep**:

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

rg "forgeInk" --glob "*.tsx" --glob "*.ts"
rg "--forge-ink-(50|100|200|300|400|500|600|700|800|900)" app components lib tests styles
```

Sin `rg`, equivalente mínimo:

```powershell
Select-String -Path (Get-ChildItem -Recurse components,app,lib,tests -Include *.tsx,*.ts | ForEach-Object FullName) -Pattern "forgeInk" -SimpleMatch
```

**Commit sugerido tras STEP 1:**

```powershell
git add -A
git status
git commit -m "refactor(forge): P11-01 DEC1 rename forge-ink scale to forge-gray (prep for VS2 ink levels)"
```

---

## STEP 2 — `tokens.css`: VS2 values + light-first + dark slate (DEC2) + tenants (DEC3) (~45–60 min)

### 2.A Política de merge (no pegar ciego el prototipo entero)

1. Partir de **`app/(forge)/credit-hub/_design/tokens.css`** ya con `--forge-gray-*` (STEP 1).
2. Copiar **ideas y valores** desde `forge-design-preview/forge/tokens.css` **pero:**
   - Selector base de app: **`.forge-app { … }`** (no `:root` ni `body {}` del prototipo tal cual).
   - **Default claro (sin `data-theme`):** ancla `--forge-bg-base: #dbeafe` + superficies/líneas/inks del bloque *light* del prototipo.
   - **`[data-theme="dark"]`** en **`.forge-app`:** `--forge-bg-base: #0f1a2e` + paleta oscura coherente (“V1 Slate Navy”).
3. **DESPUÉS de gray migration**, declarar **`--forge-ink-1..4`** solo para jerarquía de texto (copiar hex del prototipo modo claro/oscuro según corresponda).
4. **Viz:** mapear `--viz-*` del prototipo → **`--forge-viz-1…6`** si `tailwind.config.js` sigue usando `forgeViz.*`.

### 2.B Bloque “kernel” (pegar / fusionar en `.forge-app` tras `--forge-gray-*` y brand ramp)

*(Valores de ejemplo alineados DEC2; amplía con el resto del inventario del prototipo.)*

```css
/* P11-01 — VS2 light-first default (no data-theme attribute required) */
.forge-app {
  --forge-bg-base: #dbeafe;
  --forge-bg-raised: #ffffff;
  --forge-bg-elev: #ffffff;
  --forge-line-1: rgba(15, 23, 42, 0.06);
  --forge-line-2: rgba(15, 23, 42, 0.1);
  --forge-line-3: rgba(15, 23, 42, 0.16);
  /* Semantic text levels (was blocked by old --forge-ink scale; now available) */
  --forge-ink-1: #0f172a;
  --forge-ink-2: #334155;
  --forge-ink-3: #64748b;
  --forge-ink-4: #94a3b8;
  /* wire body text if desired: */
  /* color: var(--forge-ink-1); background: var(--forge-bg-base); */
}

.forge-app[data-theme="dark"] {
  --forge-bg-base: #0f1a2e;
  --forge-bg-raised: #131c2e;
  --forge-bg-elev: #1a2540;
  --forge-line-1: rgba(255, 255, 255, 0.06);
  --forge-line-2: rgba(255, 255, 255, 0.1);
  --forge-line-3: rgba(255, 255, 255, 0.16);
  --forge-ink-1: #e6eaf2;
  --forge-ink-2: #b6bfd0;
  --forge-ink-3: #7e8aa1;
  --forge-ink-4: #4d5872;
}
```

### 2.C DEC3 — Ajustar selectores tenant en el mismo archivo

- Renombrar **`.forge-app[data-tenant="banco-piloto"]`** → **`.forge-app[data-tenant="banco-piloto-rd"]`** (alinear con BD + `TENANT_UUID_TO_SLUG`; *en `main` actual el TS ya usa `banco-piloto-rd` para el UUID piloto* — el desvío está en **CSS**).
- Añadir / alinear bloque **`.forge-app[data-tenant="testbank-mx"]`** según prototipo (tras resolver UUID).
- Sustituir usos de clase **`.text-forgeInk-*`** en selectores especiales de header por **`.text-forgeGray-*`** (tras STEP 1 ya debería ser gray; revisar `test-mx` / `testbank` bloques).

### 2.D Imports / fuentes

Seguir patrón actual: **next/font** inyecta `--forge-font-sans` etc. en `app/(forge)/layout.tsx`; no reemplazar por strings estáticos que rompan esa cadena.

**Commit sugerido:**

```powershell
git add "app/(forge)/credit-hub/_design/tokens.css"
git commit -m "feat(forge): P11-01 VS2 tokens — light-first default + dark slate toggle (DEC2), tenant slug CSS (DEC3)"
```

---

## STEP 3 — `TENANT_UUID_TO_SLUG` (DEC3) (~10 min)

**Estado repo (revisión):** `lib/credit-hub/types/creditCore.ts` ya mapea `550e8400-…` → **`banco-piloto-rd`**. Verifica que **no** quede `banco-piloto` corto en TS.

Añadir entrada real cuando backend entregue UUID:

```typescript
// lib/credit-hub/types/creditCore.ts (fragmento ejemplo)
export const TENANT_UUID_TO_SLUG: Record<string, string> = {
  "0a91ee98-2dbe-46d0-a43c-3fc2dbd42242": "credicefi",
  "550e8400-e29b-41d4-a716-446655440099": "banco-piloto-rd",
  "366b3c6c-a899-4320-805e-5c1d7c896f74": "sf-rentals-nadaki-excursions",
  // "XXXXXXXX-…-…-…-XXXXXXXXXXXX": "testbank-mx",
};
```

Actualizar fixtures si aplica:

- `app/(forge)/credit-hub/_design/_inventory/test-tenant-fixtures.ts` (`FORGE_TEST_MX_*` → slug `testbank-mx` cuando se defina política).
- `lib/credit-hub/forge-test-tenant-override.ts` comentarios/selectores.

```powershell
git add lib/credit-hub/types/creditCore.ts
# + otros si tocaste
git commit -m "chore(p11-01): TENANT_UUID_TO_SLUG + fixtures align to DEC3 long slugs"
```

---

## STEP 4 — Base de datos (`tenant_branding`) (~15 min)

> Ejecutar contra la **base del suite** donde viva `tenant_branding`. Ajustar nombre de tabla/schema si difiere.

```sql
-- Ejemplo: renombrar slug corto residual a LONG
UPDATE tenant_branding
SET tenant_slug = 'banco-piloto-rd'
WHERE tenant_slug = 'banco-piloto';

-- Inserción o update de testbank-mx cuando exista registro
-- UPDATE tenant_branding SET tenant_slug = 'testbank-mx' WHERE tenant_id = '...';
```

**Redirect opcional frontend** (patrón BUG Sprint 0) si hay URLs públicas viejas guardadas:

```javascript
// next.config.js dentro de redirects() — AÑADIR si producto lo pide
// { source: '/api/v2/tenants/banco-piloto/branding', destination: '...', permanent: false } // sólo si aplica routing browser
```

*(Normalmente branding se llama por slug en fetch; sincroniza con backend antes de redirects.)*

---

## STEP 5 — Typecheck + build (~8–12 min)

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

npx tsc --noEmit

npm run build
```

**Esperado:** 0 errores TS; build Next OK.

Opcional CI local:

```powershell
npm run lint
```

---

## STEP 6 — Visual regression (~45 min)

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard
npm run dev
```

Checklist navegador (ajustar host/puerto):

| # | URL | Qué validar |
|---|-----|--------------|
| 1 | `http://localhost:3000/credit-hub` | Fondo dominante **azul muy claro** (`#dbeafe` familia); crédito legible |
| 2 | Misma ruta con **`.forge-app` + `data-theme="dark"`** *(temporal vía DevTools `document.querySelector('.forge-app').setAttribute('data-theme','dark')`)* | Base **#0f1a2e** + contraste |
| 3 | `/credit-hub/bank`, `/credit-hub/dealer`, wizard parcial | Sin “bleed” de grises rotos (gray vs ink) |
| 4 | Tenant **credicefi** / **banco-piloto-rd** (según env/override) | Header / variables tenant |

Comparar (si existen) con `_design_p11_audit/screenshots/baseline/`.

---

## STEP 7 — Commit final + push (~5 min)

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard

git add -A
git status

git commit -m "feat(forge): P11-01 - Visual System V2 migration (DEC1+DEC2+DEC3)

- DEC1: renamed grayscale --forge-ink-* scale to --forge-gray-*; reserved --forge-ink-1..4 for text
- DEC2: light-first default + data-theme=dark slate navy on .forge-app
- DEC3: tenant CSS + slug map alignment (banco-piloto-rd, testbank-mx path)
- Backups: tokens.css.backup-pre-p11
"

git push -u origin feat/p11-01-visual-system-v2
```

---

## STEP 8 — PR o merge (~5 min + CI)

**Opción A — PR**

- Abrir PR `feat/p11-01-visual-system-v2` → `main`
- Descripción: enlace `SPRINT_1_READINESS_REPORT.md` + checklist DEC1–DEC3
- Esperar CI

**Opción B — Fast-forward local** *(sólo si política repo lo permite)*

```powershell
git checkout main
git pull origin main
git merge feat/p11-01-visual-system-v2 --ff-only
git push origin main
git branch -d feat/p11-01-visual-system-v2
```

---

## TOTAL ESTIMATED TIME (conservador)

| Bloque | Min |
|--------|-----|
| STEP 0 | 5 |
| STEP 1 | 30–45 |
| STEP 2 | 45–60 |
| STEP 3 | 10 |
| STEP 4 | 15 |
| STEP 5 | 8–12 |
| STEP 6 | 45 |
| STEP 7–8 | 10 |

**TOTAL:** ~**165–200 min** (~2.75–3.3 h)

---

## RISKS + ROLLBACK

### R1 — Quedan `forgeInk` o `--forge-ink-50` viejos

**Mitigación:** §1.E grep hasta cero; revisar `tests/`, `legal/`, `preview/page.tsx`.

### R2 — Cambio de slug rompe sesiones / fetch branding

**Mitigación:** SQL + coherencia backend; redirect o dual-read temporal si hace falta.

### R3 — `body` global oscuro vs Forge claro

**Mitigación:** asegurar `.forge-app` establece `background-color` / herencia visual explícita en layout Credit Hub.

### Rollback Git

```powershell
cd C:\Users\cesar\Projects\nadakki-dashboard
git checkout main
git branch -D feat/p11-01-visual-system-v2   # si no pusheada o descartable
```

### Rollback archivos desde backup

```powershell
Copy-Item -LiteralPath "app/(forge)/credit-hub/_design/tokens.css.backup-pre-p11" -Destination "app/(forge)/credit-hub/_design/tokens.css" -Force
Copy-Item -LiteralPath "styles/forge-tokens.css.backup-pre-p11" -Destination "styles/forge-tokens.css" -Force
```

---

_Documento generado para ejecución manual; no ha sido ejecutado por el agente._
