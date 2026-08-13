# LOOP CONTRACT-ALIGN-01 · AUDIT REPORT

## HALLAZGOS PRINCIPALES

### ✅ CONTRATOS YA CORREGIDOS

El código en `lib/credit-hub/api/bankClient.ts` (líneas 46-75) **YA IMPLEMENTA** las correcciones de contrato mediante la función `toBankDecideRequestBody`:

```typescript
// CORRECTO ✅
decision_type: "APPROVE" | "REJECT" | "COUNTER"  // no "COUNTER_OFFER"
notes: legacy.justification                       // no "reason"
counter_terms: { ... }                            // incluido para COUNTER
interest_rate: legacy.terms.interest_rate         // no "rate"
```

###  TABLA DE AUDITORÍA - ENDPOINTS CRÍTICOS

| Endpoint | Body actual | Contrato OK | Notas |
|----------|-------------|-------------|-------|
| `POST /api/v2/credit/applications/{id}/claim` | `{ analyst_id }` | ✅ SÍ | Línea 165, campo correcto |
| `POST /api/v2/credit/applications/{id}/decide` | `toBankDecideRequestBody()` | ✅ SÍ | Función transforma legacy→backend |
| `POST /api/v2/credit/applications/{id}/messages` | `{ sender_type, message_text }` | ✅ SÍ | Línea 196-199, sender_type correcto |
| `GET /api/v2/credit/applications/{id}/expediente/full` | N/A | ⚠️ BACKEND | NO devuelve `financial` (ver abajo) |
| `GET /api/v2/credit/applications/queue` | Query params | ✅ SÍ | Línea 95 |
| `GET /api/v2/credit/applications/{id}/offers/compare` | N/A | ✅ SÍ | Línea 220 |
| `GET /api/v2/credit/applications/{id}/counter-offer` | N/A | ✅ SÍ | Línea 180 |
| `POST /api/v2/credit/applications/bulk-decide` | `{ application_ids, rule, analyst_id, justification }` | ✅ SÍ | Línea 193-203 |

### ⚠️ ISSUE: EXPEDIENTE/FULL NO DEVUELVE `financial`

**Medición verificada por el usuario:**
```
GET /api/v2/credit/applications/{id}/expediente/full
Claves raíz: application_id, tenant_id, user_role, applicant, vehicle,
documents, credit_history, decisions, stipulations, offers, audit_trail,
completeness, completeness_analysis, kyc_mode, ocr_mode,
data_source_label, generated_at, performance_ms, audit_view_id
```

**Bloque `financial` ausente** a pesar del fix en PR #809.

**Impacto:** El frontend en `lib/credit-hub/utils/expedienteAdapter.ts` línea 63 llama `extractFinancial(summary, ex.financial)` pero `ex.financial` es `undefined`.

**Causa:** BACKEND. El backend no serializa el bloque consolidado.

**Workaround actual:** El adaptador busca en `credit_history.summary.financial` o campos individuales (líneas 19-35 del adaptador).

**Recomendación:** Reportar a backend que el bloque `financial` consolidado NO aparece en la respuesta real de producción.

## VERIFICACIÓN DEL FLUJO DE DECISIÓN EN LA UI

### ✅ DecisionPanel - Contratos correctos

Archivo: `components/credit-hub/bank/sections/DecisionPanel.tsx`

**Aprobar:** Manda `decision: "APROBADO"` → `toBankDecideRequestBody` lo transforma a `decision_type: "APPROVE"` ✅

**Rechazar:** Manda `decision: "RECHAZADO"` → transformado a `decision_type: "REJECT"` ✅

**Contraoferta:** Manda `decision: "CONTRA_OFERTA"` con `terms` → transformado a:
```json
{
  "decision_type": "COUNTER",
  "counter_terms": {
    "amount": terms.approved_amount,
    "interest_rate": terms.interest_rate,
    "term_months": terms.term_months,
    "down_payment_pct": terms.down_payment_required
  }
}
```

**Justificación:** Va en `notes` (línea 53 de `toBankDecideRequestBody`) ✅

**Secuencia claim→decide:** Implementada en `recordDecision` líneas 155-176:
1. POST /claim (línea 161)
2. Si falla → throw (correcto, no intenta decide)
3. Si OK → POST /decide (línea 171)

### ⚠️ MEJORAS PENDIENTES EN UI

1. **Errores crudos mostrados al usuario:**
   - "insufficient_role" se muestra sin traducir
   - Ubicación: componentes que llaman `recordDecision`
   - Recomendación: Agregar mapeo de error codes a mensajes amigables

2. **Formulario de contraoferta:**
   - Verificar que pida: monto, plazo, tasa, enganche
   - Verificar que se mapeen correctamente a `counter_terms`

## CAMPOS NO USADOS - Potencial limpieza

Estos campos del dashboard NO están en el schema del backend (no causan error por `extra_forbidden` si no se mandan):

- `conditions` array en terms (línea 67-72 de bankClient.ts) se transforma a `stipulations`
- `down_payment_required` (legacy) se transforma a `down_payment_pct`

**Estado:** OK, la función `toBankDeciseRequestBody` ya maneja la transformación.

## RECOMENDACIONES

### CRÍTICO
1. ✅ **Contratos ya corregidos** - No requiere acción inmediata
2. ⚠️ **Reportar a backend:** `financial` consolidado ausente en expediente/full

### MEJORAS
3. Agregar error mapping en UI para códigos como "insufficient_role", "counter_terms_required", "not_claimed"
4. Verificar formulario de contraoferta muestra todos los campos requeridos

### NO TOCAR
- `toBankDecideRequestBody` está correcto, NO modificar
- Secuencia claim→decide está correcta, NO cambiar
- `postApplicationMessage` usa `sender_type` correcto, NO tocar
