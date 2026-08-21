# FE-A2Z · Progreso

| Packet | Estado | PR | BASE_SHA | HEAD_SHA | Verificado Vercel | Fecha |
|--------|--------|----|---------|---------|--------------------|-------|
| F0 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |
| F1 | COMPLETO | #361✓ | fd1e2239 | 4d9af005 | Pendiente | 2026-08-19 |
| F2 | COMPLETO | - | 679b5587 | 2266ae7b | N/A | 2026-08-19 |
| F3 | COMPLETO | #362✓ | 679b5587 | ea3f57e6 | Pendiente | 2026-08-19 |
| F4 | COMPLETO | #364✓ | aacd0dd2 | 63887bfe | Pendiente | 2026-08-19 |
| F5 | COMPLETO | #365✓ | 63887bfe | 9a556ced | Pendiente | 2026-08-19 |
| F6 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |
| N1 | COMPLETO | #366✓ | 9a556ced | 6e37ddac | Pendiente | 2026-08-20 |
| N2 | COMPLETO | #367✓ | 9a556ced | 3f793ec5 | Pendiente | 2026-08-20 |
| N3 | WAITING_FOR_MERGE | #369 | 3de40daa | TBD | no | 2026-08-20 | ConfiguracionView, bloques guardables |
| N4 | WAITING_FOR_MERGE | #370 | 3de40daa | TBD | no | 2026-08-20 | Credential Vault, 3 estados TEST_CONNECTION |
| N5 | WAITING_FOR_MERGE | #368 (parcial), #371 (completo) | 3de40daa | TBD | no | 2026-08-20, 2026-08-21 | Readiness + 9 production gates |
| Z1 | EN_PROGRESO | - | - | - | - | 2026-08-21 | Certificación final |

## Notas

### F6 · Colisión de Layouts [COMPLETO]

**Activo:**
- `components/credit-hub/bank/BankDetailLayout.tsx`
- Servido por: `app/(forge)/credit-hub/bank/applications/[applicationId]/page.tsx`
- Línea 50: `<BankDetailLayout application={appQuery.data} ... />`

**Inactivo/Deprecable:**
- `components/forge/credit-hub/BankApplicationDetailView.tsx`
- Solo usado en tests desactualizados:
  - `tests/credit-hub/bank/compliance-approval.test.tsx`
  - `tests/credit-hub/bank/pages/detail-review.test.tsx`
- **Problema:** Tests mockean componente que ya no está en producción
- **Riesgo:** Trampa para futuros cambios - modificar BankApplicationDetailView no afecta producción

**Acción recomendada:**
- Deprecar `BankApplicationDetailView.tsx` o actualizar tests para usar `BankDetailLayout`
- Marcar con comentario deprecation en archivo hasta decisión final

### F4 · El cliente no inventa datos [WAITING_FOR_MERGE]

**Backend:** PRs #881, #884, #883 entregaron `Optional[float]` para `requested_amount`.

**Cambios:**
1. `BankDetailLayout.tsx` L179: `amount` permite `null`, no fuerza `?? 0`
2. `BankDetailLayout.tsx` L47: `defaultTerms` verifica `!= null`
3. `BankDecisionPanel.tsx` L18: `defaultTerms` verifica `!= null`
4. `AnalysisTab.tsx` L252, L266: `monthly_income` y `vehicle.value` verifican `!= null`

**Resultado:**
- Montos ausentes muestran "—" o "No informado", nunca RD$0 inventado
- Formatters `chMoney`/`chMoneyExact` manejan `null` correctamente

**Scope:** Solo montos. Ratios (DTI, PTI, LTV) pueden seguir bloqueados.

### F5 · La campana del dealer [WAITING_FOR_MERGE]

**Backend:** PR #857 entregó `/api/v2/credit/messages/unread-summary`. Hook `useDealerTotalUnreadMessages` ya implementado.

**Cambios:**
- `ChTopbar.tsx` L318-340: Badge ahora muestra número siempre (antes solo >9)
- Badge consistente 16px para todos los contadores
- Número visible para 1-9 mensajes (antes solo punto rojo)

**Resultado:**
- Campana muestra `total_unread` como número visible
- Dropdown lista `by_application` en orden descendente (backend ya ordena)
- Una sola petición O(1) al endpoint unread-summary

**Scope:** Solo contador global. Badge por solicitud ya funcionaba.
