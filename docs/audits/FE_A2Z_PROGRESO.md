# FE-A2Z · Progreso

| Packet | Estado | PR | BASE_SHA | HEAD_SHA | Verificado Vercel | Fecha |
|--------|--------|----|---------|---------|--------------------|-------|
| F0 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |
| F1 | WAITING_FOR_MERGE | #361 | fd1e2239 | - | - | 2026-08-19 |
| F2 | COMPLETO | - | fd1e2239 | d8c18b71 | N/A | 2026-08-19 |
| F3 | COMPLETO | #362 | fd1e2239 | 3001ca75 | N/A | 2026-08-19 |
| F6 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |

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
