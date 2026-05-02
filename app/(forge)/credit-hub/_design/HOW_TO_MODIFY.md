# Recetas de modificación (Forge Credit Hub)

**English summary:** Step-by-step recipes for common engineering changes: tokens, palette extensions, `Button` variants, `DataTable` columns, bank detail tabs, `EvidenceCard` visuals, new personas, wizard length, locales, and per-tenant feature flags. Each recipe lists files, a conceptual diff, verification commands, pitfalls, and time estimate. Spanish (es-DO neutral) is the authoring language; code identifiers stay as in the repo.

---

## Receta 1 — Cambiar un token global (espaciado)

| Campo | Detalle |
|-------|---------|
| **Archivos** | [`tokens.css`](./tokens.css) (variables bajo `.forge-app`). |
| **Líneas (aprox.)** | Bloque *SPACE* — p. ej. `--forge-space-1` (~línea 107). |
| **Antes** | `--forge-space-1: 4px;` |
| **Después** | `--forge-space-1: 5px;` |
| **Verificación** | `npm run docs:tokens` → revisar `TOKENS.md`; `npm run build`. |
| **Errores comunes** | Olvidar revertir en PRs de prueba; duplicar variables fuera de `.forge-app`. |
| **Tiempo** | 10–15 min |

**Verificación interna (2026-05-02):** se aplicó temporalmente `--forge-space-1: 4px → 5px`, `npm run build` **OK**, sin cambios en Lighthouse de preview ya gatillado; **revertido** antes de cerrar Phase 8. La propagación afecta márgenes/paddings que usan `var(--forge-space-1)` o utilidades derivadas.

---

## Receta 2 — Añadir color a la paleta `forgeBrand`

1. Añadir `--forge-brand-XXX` en `tokens.css` (grupo BRAND).
2. Extender `tailwind.config.js` → `theme.extend.colors.forgeBrand` con la misma clave.
3. `npm run docs:tokens` y documentar en [`TOKENS.md`](./TOKENS.md).
4. `npm run build`.

**Tiempo:** 30–45 min.

---

## Receta 3 — Nueva variante de `Button`

1. Editar [`components/forge/ui/Button.tsx`](../../../../components/forge/ui/Button.tsx) — `variant` union + clases.
2. Añadir ejemplo en [`preview/page.tsx`](../preview/page.tsx).
3. `npm run docs:components` para captura.
4. Actualizar [`COMPONENTS.md#button`](./COMPONENTS.md#button).

**Tiempo:** 45–60 min.

---

## Receta 4 — Nueva columna en `DataTable`

1. Definir columna en la página (`columns` useMemo) — ver [`PAGES.md`](./PAGES.md) listados banco/dealer.
2. Si filtrable: sincronizar query param (`useSearchParams`) como en `bank/applications/page.tsx`.
3. `npm run build` + smoke en `/credit-hub/preview` tabla demo.

**Tiempo:** 30–90 min.

---

## Receta 5 — Nueva pestaña en detalle banco

1. `components/forge/credit-hub/BankApplicationDetailView.tsx` (ruta exacta: buscar con ripgrep si se mueve).
2. Añadir entrada a arreglo de `Tabs` + panel asociado.
3. Pruebas manuales + Lighthouse de ruta detalle.

**Tiempo:** 60–120 min.

---

## Receta 6 — Tratamiento visual de `EvidenceCard`

1. [`components/forge/ui/EvidenceCard.tsx`](../../../../components/forge/ui/EvidenceCard.tsx).
2. Ajustar tokens (`forgeAccent-*`, bordes) — no reintroducir glass excesivo ([`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)).
3. Captura `npm run docs:components`.

**Tiempo:** 30–45 min.

---

## Receta 7 — Nueva persona (`auditor`)

1. Extender tipo `ForgePersona` en `lib/credit-hub/design/persona` (buscar definición).
2. `PersonaProvider` + rutas bajo `app/(forge)/credit-hub/auditor/...` (nuevo árbol).
3. `ForgeCreditHubSidebar` / paleta de comandos — duplicar patrón bank/dealer.
4. **Gran esfuerzo** — estimar en épica separada.

**Tiempo:** 2–5 días.

---

## Receta 8 — Cambiar conteo de pasos del wizard

1. Rutas `dealer/applications/new/*` — añadir/quitar `page.tsx` por segmento.
2. `DealerWizardProvider` — validar payload y orden.
3. Ver [`MIGRATION.md`](./MIGRATION.md) (wizard legacy vs segmentado).

**Tiempo:** 1–2 días.

---

## Receta 9 — Nuevo locale (`en-US` completo)

1. Bundles i18n bajo `lib/credit-hub/i18n` + `forge-*-copy.ts` según string.
2. `useTenantConfig().tenantConfig.locale` prueba.
3. `npm run build`.

**Tiempo:** 1–3 días según cobertura.

---

## Receta 10 — Desactivar feature por tenant

1. Feature flag en `TenantContext` / API (patrón existente `isFeatureEnabled` si aplica).
2. Ramas en páginas Forge (`if (!enabled) return <EmptyState …>`).
3. No tocar hooks sagrados sin coordinación — ver comentarios en `useTenant.ts`.

**Tiempo:** 30–120 min.

---

## Enlaces

[`COMPONENTS.md`](./COMPONENTS.md) · [`TOKENS.md`](./TOKENS.md) · [`PAGES.md`](./PAGES.md)
