# 04 · DESIGN SYSTEM REAL (para que el rediseño calce, no choque)

> El Credit Hub es **MODO CLARO** (light institutional). Dos capas de tokens coexisten:
> `--ch-*` (primaria, portales dealer/banco) y `--forge-*` / alias Tailwind (primitivos legacy).

---

## 1. Tokens REALES

### Capa primaria `--ch-*`
**Archivo:** `app/credit-hub/credit-hub.css` · **Scope:** `.credit-hub-forge` · **Importa:** `app/(forge)/credit-hub/CreditHubLayoutClient.tsx`

```1:7:app/credit-hub/credit-hub.css
/* ============================================================
   NADAKKI · CREDIT HUB — Package 0 · Design Tokens
   Namespace: --ch-*  ·  Scope: .credit-hub-forge
   Light institutional. Module accent = amber (from MEE).
   Persona accent: Bank = slate-blue · Dealer = teal.
   Does NOT collide with --forge-* or --mee-*.
============================================================ */
```

**Superficies / fondos (LIGHT):**
| Token | Valor |
|---|---|
| `--ch-bg` | `#FAFAF9` (papel cálido) |
| `--ch-surface` | `#FFFFFF` |
| `--ch-surface-2` | `#F6F6F5` |
| `--ch-surface-3` | `#F1F0EE` |

**Texto:** `--ch-text #1C1917` · `--ch-text-2 #44403C` · `--ch-text-3 #78716C` · `--ch-text-4 #A8A29E`
**Bordes:** `--ch-line #E7E5E4` · `--ch-line-2 #D6D3D1` · `--ch-line-strong #A8A29E`

**Acento de módulo (ámbar):** `--ch-accent #B45309` · soft `#FEF3C7` · mid `#D97706` · strong `#92400E` · line `#FCD34D`

**Acentos por persona:**
| Persona | Token | Valor |
|---|---|---|
| **Banco** (slate-blue) | `--ch-bank-accent` | `#2F4A6B` (soft `#E8EDF3`, text `#23395B`) |
| **Dealer** (teal) | `--ch-dealer-accent` | `#0D9488` (soft `#CCFBF1`, text `#0F766E`) |

Persona resuelta vía `data-persona` en `.credit-hub-forge` (default = bank):
```106:108:app/credit-hub/credit-hub.css
/* Persona switching */
.credit-hub-forge[data-persona="bank"]   { --ch-persona: var(--ch-bank-accent);   ... }
.credit-hub-forge[data-persona="dealer"] { --ch-persona: var(--ch-dealer-accent); ... }
```

**Semánticos / riesgo:** success `#15803D`/`#DCFCE7` · warning `#B45309`/`#FEF3C7` · danger `#B91C1C`/`#FEE2E2` · info `#1D4ED8`/`#DBEAFE`. Riesgo: low `#15803D`, medium `#B45309`, high `#DC2626`, critical `#7F1D1D`.

**Tipografía:**
| Token | Valor |
|---|---|
| `--ch-font-display` | `"Newsreader", "Source Serif 4", Georgia, serif` (clase `.ch-serif`) |
| `--ch-font-sans` | `"Inter Tight", "Inter", system-ui, sans-serif` |
| `--ch-font-mono` | `"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace` (clase `.ch-mono`) |

Escala: `--ch-text-xs 11px` … `--ch-text-4xl 41px` (ratio 1.25).
**Radii:** sm `4px` · md `6px` · lg `8px` · xl `12px`.
**Sombras:** `--ch-sh-1/2/3` (rgba sobre `#1C1917`).

### Capa Forge `--forge-*` (secundaria)
**Archivo:** `styles/forge-tokens-v2.css` (vía `app/(forge)/credit-hub/forge-globals.css`) · **Tailwind:** `tailwind.config.js`
Default `.forge-app` también claro:
```202:207:styles/forge-tokens-v2.css
  /* ─── SURFACE (light — bank institutional default) ──────────────────── */
  --forge-surface-page: #f7f8fa;
  --forge-surface-card: #ffffff;
  --forge-surface-raised: #ffffff;
  --forge-surface-sunken: #f0f2f5;
  --forge-surface-overlay: rgba(15, 23, 41, 0.48);
```
Escalas: `forgeBrand` (500 `#2e5f97`, 700 `#163660`), `forgeGray` (50 `#f7f8fa`, 800 `#1a2540`), `forgeAccent.gold #c8940a`, `forgeAccent.teal #0a7ea4`, `forgeViz.1-6`. Dark sólo bajo `[data-theme="dark"] .forge-app` — **el Credit Hub NO lo activa**.

### Dónde se fija el modo claro
`ChAppShell` pinta el fondo con `var(--ch-bg)` y aplica `data-persona`:
```48:56:components/credit-hub/shell/ChAppShell.tsx
      <div
        className={cn("credit-hub-forge", className)}
        data-persona={persona}
        style={{
          height: frame ? "100%" : "100vh",
          ...
          background: "var(--ch-bg)",
```
Layouts: `bank/layout.tsx` → `BankChShell` (`persona="bank"`), `dealer/layout.tsx` → `DealerChShell` (`persona="dealer"`).

---

## 2. Componentes reutilizables (catálogo)

### Barrel `components/credit-hub/primitives/index.ts`
```1:14:components/credit-hub/primitives/index.ts
export { ScoreVisual } from "./ScoreVisual";
export { RiskBand } from "./RiskBand";
export { DecisionPanel } from "./DecisionPanel";
export { EvidenceGrid } from "./EvidenceGrid";
export { BulkActionBar } from "./BulkActionBar";
export { StepperWizard } from "./StepperWizard";
export { EmptyStateRich } from "./EmptyStateRich";
export {
  LoadingSkeleton,
  KpiStripSkeleton,
  TableSkeleton,
  DetailSkeleton,
  ChartSkeleton,
} from "./LoadingSkeleton";
```
Tipos en `lib/credit-hub/ch-types.ts`. Primitivos Forge (por path, fuera del barrel): `ForgeCard`, `ForgeButton`, `ForgeBadge`, `ForgeInput`, `ForgeSelect`, `ForgeProgress`, `ForgeSkeleton`.

> **No existe** un `KpiCard`/`Card`/`Table`/`Badge` genérico en primitives: son **clases CSS**
> (`.ch-card`, `.ch-table`, `.ch-chip`, `.ch-pill`, `.ch-btn`) + wrappers por persona (abajo).

### Dealer — `components/credit-hub/dealer/shared/dealerUi.tsx`
| Componente | Props |
|---|---|
| `DealerKpiCard` | `label`, `value: string\|number`, `unit?`, `trend?`, `trendLabel?`, `accent?` |
| `DealerAppCard` | `app: CreditApplication`, `currency: string`, `href: string` |
| `DealerSectionHeader` | `title`, `sub?`, `action?: ReactNode` |
| `DealerQuickAction` | `title`, `sub`, `href`, `accent?: "persona"\|"amber"` |
| `DealerStatusBadge` | `status: string`, `size?: "md"\|"lg"` |

### Banco — `components/credit-hub/bank/shared/bankUi.tsx`
| Componente | Props |
|---|---|
| `SectionHeader` | `eyebrow?`, `title`, `sub?`, `actions?` |
| `KpiCardTrend` | `label`, `value`, `unit?`, `trend?`, `trendLabel?`, `spark?`, `sparkColor?`, `onClick?`, `accent?` |
| `PriorityBadge` | `priority: "ALTA"\|"MEDIA"\|"BAJA"` |
| `StatePill` | `state: string` |
| `QueueTable` | `items: BankQueueItem[]`, `variant?`, `selectable?`, `selected?`, `onToggle?`, `sortKey?`, `onSort?`, `detailHref?` |
| `AreaMini` / `AreaChart` / `CohortChart` | charts SVG propios (usan tokens `--ch-*`) |
| `BankSegment` | `value`, `options`, `onChange` |

### Charts
| Componente | Archivo | Librería |
|---|---|---|
| `CohortChart`, `AreaChart`, `AreaMini` | `bank/shared/bankUi.tsx` | **SVG propio** (sin dependencia) |
| `PortfolioHealthGrid` | `bank/sections/PortfolioHealthGrid.tsx` | barras CSS (`{ distribution?: ScoreDistribution }`) |
| `BankAnalyticsCharts` | `bank/BankAnalyticsCharts.tsx` | **recharts** (Pie/Bar) — secundario |

> La página de analítica activa (`BankAnalyticsView`) usa **`CohortChart` (SVG)**, no recharts.

---

## 3. Patrón "el banco YA pinta dato real bien" (replicar esto)

### Cola — `QueueTable` (`bankUi.tsx`)
Tipo `BankQueueItem` (`lib/credit-hub/types/bankDecision.ts:34-49`): `applicant_name`, `dealer_name`, `vehicle_label`, `requested_amount`, `score`, `risk_level`, `priority`, `state`, `application_id`.
```345:353:components/credit-hub/bank/shared/bankUi.tsx
              <td>
                <div style={{ fontWeight: 600 }}>{a.applicant_name ?? "—"}</div>
                <div className="ch-mono" style={{ fontSize: 10.5, color: "var(--ch-text-3)" }}>
                  {a.application_id}
                </div>
              </td>
              <td style={{ color: "var(--ch-text-2)" }}>{a.dealer_name ?? "—"}</td>
              <td style={{ color: "var(--ch-text-2)" }}>{a.vehicle_label ?? "—"}</td>
              <td className="ch-num">{chMoney(a.requested_amount)}</td>
```
Patrón clave: **nombre en negrita + `application_id` en mono/gris debajo** (no el UUID como protagonista), vehículo como `vehicle_label`, monto con `chMoney`.

### Detalle — `BankDetailLayout.tsx`
```105:108:components/credit-hub/bank/BankDetailLayout.tsx
  const applicantName = String(applicant.name ?? applicant.full_name ?? "Cliente");
  const rate = Number(financial.requested_rate ?? analysis?.metrics?.annual_rate ?? 17.5);
  const term = Number(financial.term_months ?? analysis?.metrics?.term_months ?? 48);
  const amount = Number(financial.requested_amount ?? analysis?.financed_amount ?? 0);
```
```150:153:components/credit-hub/bank/BankDetailLayout.tsx
              {[
                ["Concesionario", String(vehicle.dealer ?? "—")],
                ["Vehículo", String(vehicle.label ?? (`${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "—"))],
                ["Monto solicitado", chMoneyExact(amount)],
```

### Dealer (mismo patrón) — `DealerAppCard` (`dealerUi.tsx`)
```84:97:components/credit-hub/dealer/shared/dealerUi.tsx
          <div style={{ fontSize: 15, fontWeight: 600, ... }}>
            {app.applicant_name || "—"}
          </div>
          ...
        <span className="truncate">
          {[app.vehicle_make, app.vehicle_model].filter(Boolean).join(" ") || "—"}
        </span>
```

### Helpers de formato
- `lib/credit-hub/ch-base.ts`: `chMoney` (abreviado K/M, default `"MX$"`), `chMoneyExact`, `chFormatCurrency` (Intl `es-DO`/`DOP`), `chFormatPercent`, `chFormatDate`, `chScoreBand`.
- `lib/credit-hub/bank/bankFormat.ts`: `chRelTime`, `sortQueueItems`, `PRIORITY_STYLE`, `STATE_LABEL`, `SCORE_BANDS`.
- `lib/credit-hub/dealer/dealerFormat.ts`: `formatDealerMoney(amount, currencyCode)` (RD$/MX$), `chRelTimeDealer`, `dealerGreeting`.

---

## Resumen para el rediseño

| Concern | Usar |
|---|---|
| Tokens primarios | `--ch-*` en `app/credit-hub/credit-hub.css` (`.credit-hub-forge`) |
| Tema | **Light** (`#FAFAF9`/`#FFFFFF`); NO activar dark |
| Acento dealer | teal `#0D9488` · Acento banco | slate-blue `#2F4A6B` · Módulo | ámbar `#B45309` |
| Display | `.ch-serif` (Newsreader) · Mono | `.ch-mono` (IBM Plex Mono) |
| Tarjetas/tablas | clases `.ch-card`, `.ch-table`, `.ch-btn` + `DealerKpiCard`/`KpiCardTrend`/`SectionHeader` |
| Charts | SVG propios (`CohortChart`/`AreaChart`) — sin recharts en producción |
| Patrón "dato real" | nombre en negrita + id mono debajo, vehículo concatenado, monto con `chMoney(Exact)` |
