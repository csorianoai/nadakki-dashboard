# NEW UI ARCHITECTURE — Elite Cockpit (additive)

> Extiende Forge `--ch-*` y reutiliza `DataTruthBadge`, `DisplayStatusPill`, `humanizeApplicant`.  
> No reemplaza el design system global.

## Capa compartida — `components/credit-hub/elite/`

| Componente | Rol | Badge típico |
|------------|-----|--------------|
| `MetricCard` | KPI + delta + sparkline pie | por prop `truth` |
| `MiniTrend` | SVG sparkline | DEMO si `demo=true` |
| `OfferComparisonCard` | Tarjeta banco en comparador | REAL |
| `BankRankingTable` | Tabla ranking # + iniciales | REAL |
| `RiskPortfolioPanel` | PTI/LTV/rechazos | REAL |
| `DisplayStatusFunnel` | Barras display_status | REAL |
| `AlertCard` | Stack alertas | DERIVADO |
| `ComplianceFooter` | Aislamiento dealer/banco | copy |
| `SLAChip` / `RiskScoreChip` | Micro-badges cola | REAL |

## Capa dealer — `components/credit-hub/dealer/elite/`

| Componente | Reemplaza / eleva | Datos |
|------------|-------------------|-------|
| `DealerCockpitHeader` | header genérico anterior | tenant REAL |
| `DealerKpiStrip` | grid 4 KPIs | stats + summary + ranking REAL |
| `OfferComparatorSpotlight` | `OffersAtGlance` parcial | offers REAL |
| `DealerPipelineRail` | `PipelineFunnel` + alerts | summary REAL |
| `RecentApplicationsTable` | cards + `ActiveApplicationsTable` | applications REAL |
| `DealerTrendsAlerts` | — (nuevo) | DEMO tendencias |

## Capa banco — `components/credit-hub/bank/elite/`

| Componente | Rol |
|------------|-----|
| `BankCockpitHeader` | Header mesa + periodo + aislamiento |

## API layer — `lib/credit-hub/api/analyticsClient.ts`

| Función | Endpoint |
|---------|----------|
| `getDashboardSummary` | `/credit/dashboard/summary` |
| `getBanksRanking` | `/analytics/banks-ranking` |
| `getRiskDistributions` | `/analytics/risk-distributions` |
| `getAuctionIntel` | `/analytics/auction-intel` |

Hooks: `useDashboardSummary`, `useBanksRanking`, `useRiskDistributions`, `useAuctionIntel`.

## Pantalla → entrada

```
app/(forge)/credit-hub/dealer/page.tsx
  └── DealerDashboardView (REAL)
        ├── DealerCockpitHeader
        ├── DealerKpiStrip
        ├── DealerGoals (DEMO targets)
        ├── OfferComparatorSpotlight
        ├── DealerPipelineRail
        ├── BankRanking
        ├── RecentApplicationsTable
        ├── DealerTrendsAlerts
        └── ComplianceFooter

app/(forge)/credit-hub/bank/page.tsx
  └── BankDashboardView (REAL)
        ├── BankCockpitHeader
        ├── MetricCard strip
        ├── QueueTable
        ├── AuctionIntel
        ├── RiskCreditPanel
        └── ComplianceFooter
```
