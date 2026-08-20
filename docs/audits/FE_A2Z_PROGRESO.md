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
| N3 | NOT_TESTED | - | - | - | - | Endpoints C1 Codex |
| N4 | NOT_TESTED | - | - | - | - | Endpoints C2 Codex |
| N5 | WAITING_FOR_MERGE | #368 | 3f793ec5 | 40ee209b | Pendiente | Parcial readiness |

## Notas

### F6 · Colisión de Layouts [COMPLETO]

**Activo:**
- `components/credit-hub/bank/BankDetailLayout.tsx`
- Servido por: `app/(forge)/credit-hub/bank/applications/[applicationId]/page.tsx`

**Inactivo/Deprecable:**
- `components/forge/credit-hub/BankApplicationDetailView.tsx`
- Solo usado en tests desactualizados

**Acción recomendada:**
- Deprecar `BankApplicationDetailView.tsx` o actualizar tests

### F4 · El cliente no inventa datos [COMPLETO]

**Backend:** PRs #881, #884, #883 entregaron `Optional[float]` para `requested_amount`.

**Cambios:**
1. `BankDetailLayout.tsx` L179: `amount` permite `null`, no fuerza `?? 0`
2. `BankDetailLayout.tsx` L47: `defaultTerms` verifica `!= null`
3. `BankDecisionPanel.tsx` L18: `defaultTerms` verifica `!= null`
4. `AnalysisTab.tsx` L252, L266: `monthly_income` y `vehicle.value` verifican `!= null`

**Resultado:**
- Montos ausentes muestran "—" o "No informado", nunca RD$0 inventado

**Scope:** Solo montos. Ratios (DTI, PTI, LTV) pueden seguir bloqueados.

### F5 · La campana del dealer [COMPLETO]

**Backend:** PR #857 entregó `/api/v2/credit/messages/unread-summary`.

**Cambios:**
- `ChTopbar.tsx` L318-340: Badge ahora muestra número siempre (antes solo >9)

**Resultado:**
- Campana muestra `total_unread` como número visible
- Dropdown lista `by_application` en orden descendente

**Scope:** Solo contador global. Badge por solicitud ya funcionaba.

### N1 · Registro público [COMPLETO]

**Contrato:** `POST /api/v2/onboarding/registro` (ONBOARDING_CONTRACTS.md PR #889).

**Cambios:**
- `app/(public)/registro/page.tsx` - Ruta pública sin autenticación
- `components/activation/RegistroPublico.tsx` - Formulario 4 campos
- Campos: `nombre_legal`, `rnc`, `email_admin`, `telefono`, `tipo_institucion`
- Validación RNC dominicano (9 u 11 dígitos)

**Resultado:**
- Mensaje post-registro: "Revisamos tu solicitud en 24 a 48 horas"
- RNC duplicado: respuesta genérica (no revela existencia)

### N2 · Espera de verificación [COMPLETO]

**Contrato:** Estados sobre `tenants.status` (ONBOARDING_CONTRACTS.md PR #889).

**Cambios:**
- `app/(public)/activacion/page.tsx` - Pantalla de estado
- `components/activation/PantallaEspera.tsx` - Display por estado
- Estados: CREATED, PROFILE_INCOMPLETE, CONFIGURATION, VALIDATION, REJECTED, etc.
- Redirección automática cuando READY_FOR_SANDBOX o superior

**Resultado:**
- Estado visible, qué se está revisando, a quién escribir
- Si rechazado: motivo y cómo corregir

### N5 · Readiness y gates [WAITING_FOR_MERGE - PARCIAL]

**Contrato:** `GET /api/v2/institucion/readiness` (ONBOARDING_CONTRACTS.md PR #889).

**Cambios:**
- `app/(forge)/credit-hub/activacion/readiness/page.tsx` - Vista de readiness
- `components/activation/ReadinessView.tsx` - 3 scores + dimensions
- Scores: `account_created`, `production_readiness`, `ai_optimization`
- Dimensions grid con `evidence` y `missing` items
- Callout explicando readiness vs gates

**Resultado:**
- Barras de progreso para cada score
- Cards de dimensiones (Identidad, Seguridad, Equipo, Lenders, etc.)
- Placeholder para gates de producción

**Scope:** Solo readiness display. Gates, configuración (N3) y credential vault (N4) esperan C1 y C2 de Codex.
