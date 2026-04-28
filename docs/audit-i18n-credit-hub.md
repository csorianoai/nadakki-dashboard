# Auditoría i18n credit-hub — 2026-04-28

## Resumen

Se inventariaron cadenas en inglés visibles en `components/credit-hub/`, `app/(forge)/credit-hub/` y fragmentos relacionados. La corrección se centralizó en `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` y el hook `useTranslations()` (locale desde `tenantConfig.locale`).

## Strings en inglés detectados (representativos)

### Navegación y paneles

| Área | Ejemplos detectados | Reemplazo |
| --- | --- | --- |
| Bank side nav | Dashboard, Analytics, Compliance, Audit | `t.bank.nav.*` |
| Dealer top bar | Dashboard | `t.dealer.top_nav_dashboard` |
| Bank analytics kicker | Analytics ejecutivo | `t.bank.analytics_kicker` |
| Bank audit kicker | Audit trail | `t.bank.audit_kicker` + título visor |
| Bank compliance | Compliance, issues, % compliant, Right to be forgotten | `t.bank.*`, `t.bank_ui.*` |
| Colas | application ID, score Forge AI | `t.bank.queue_*` |

### Análisis y métricas

| Área | Ejemplos | Reemplazo |
| --- | --- | --- |
| CreditAnalysisPanel | Forge Credit Analysis, Forge AI, rule-based, DTI en copy | `t.analysis.*` |
| ScoreVisual | Score Forge AI | `t.metrics.score_ring_caption` |
| PreApprovalBadge | DTI: (etiqueta) | `t.metrics.dti_short` |
| RecommendationCard | Score, Nuevo DTI | `t.metrics.score_short`, `t.metrics.new_dti` |
| CapacitySnapshot | etiqueta DTI | `t.metrics.dti_short` |

### Portal y marca

| Área | Ejemplos | Reemplazo |
| --- | --- | --- |
| Página inicio credit-hub | Dealer Portal, Bank Portal, Customer Portal, Admin, tagline inglés | `t.portals.*` |
| ForgeAIBadge | Powered by Forge AI | `t.forge.ai_badge` |
| CHFeatureFlagBanner | texto mixto | `t.forge.feature_banner_*` |

### Dealer expediente

| Área | Ejemplos | Reemplazo |
| --- | --- | --- |
| Pestañas | Timeline | `t.dealer.detail_tabs.timeline` |
| Botón | Procesar con IA | `t.dealer.process_with_ai` |
| Resumen | Email, Score:, Risk score: | `t.dealer.field_email`, `t.dealer.score_line`, etc. |

### Wizard (fragmentos)

| Área | Ejemplos | Reemplazo |
| --- | --- | --- |
| Métricas revisión | Status preliminar, Forge AI en pie | `t.wizard.preliminary_status`, `t.wizard.preview_footer` |
| LTV | LTV, texto técnico mezclado | `t.wizard.ltv_label`, `t.wizard.ltv_exceeds` |
| CTAs / pasos | (Muchos ya en español; unificación CTAs) | `t.common.*` |

## Totales aproximados

- **Strings de usuario reemplazados o centralizados:** ~85+ (incluye variantes y CTAs repetidos).
- **Archivos tocados:** ~35+ (componentes, páginas app, i18n, tests, layouts).

## Infraestructura añadida

- `lib/credit-hub/i18n/locales/es-DO/credit-hub.ts` — catálogo `CREDIT_HUB_ES_DO`.
- `lib/credit-hub/i18n/useTranslations.ts` — resolución por `tenantConfig.locale`.
- `lib/credit-hub/i18n/zod-error-map.ts` — mapa de errores Zod en español (`registerCreditHubSpanishZodErrorMap`).
- `components/credit-hub/system/CreditHubI18nBootstrap.tsx` — registro del mapa Zod al entrar al árbol credit-hub.
- Dependencia **`zod`** para el mapa de errores y pruebas.

## Greps finales (CI-like)

Tras los cambios, ejecutar en PowerShell desde la raíz del dashboard:

```powershell
Select-String -Path "components\credit-hub\**\*.tsx" -Pattern '>Submit<|>Cancel<|>Continue<|>Back<|>Next<|>Loading<'
```

Se espera **sin coincidencias** en UI. Palabras técnicas internas (`isLoading`, tipos `BankDecisionType`, etc.) no son UI.
