# FE-A2Z · Progreso

| Packet | Estado | PR | BASE_SHA | HEAD_SHA | Verificado Vercel | Fecha |
|--------|--------|----|---------|---------|--------------------|-------|
| F0 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |
| F1 | COMPLETO | #361✓ | fd1e2239 | 4d9af005 | sí | 2026-08-19 |
| F2 | COMPLETO | - | 679b5587 | 2266ae7b | N/A | 2026-08-19 |
| F3 | COMPLETO | #362✓ | 679b5587 | ea3f57e6 | sí | 2026-08-19 |
| F4 | COMPLETO | #364✓ | aacd0dd2 | 63887bfe | sí | 2026-08-19 |
| F5 | COMPLETO | #365✓ | 63887bfe | 9a556ced | sí | 2026-08-19 |
| F6 | COMPLETO | - | fd1e2239 | - | N/A | 2026-08-19 |
| N1 | COMPLETO | #366✓ | 9a556ced | 6e37ddac | sí | 2026-08-20 |
| N2 | COMPLETO | #367✓ | 9a556ced | 3f793ec5 | sí | 2026-08-20 |
| N3 | COMPLETO | #369✓ | 3de40daa | d3904e93 | sí | 2026-08-20 | ConfiguracionView, bloques guardables |
| N4 | COMPLETO | #370✓ | 3de40daa | 0c358bd6 | sí | 2026-08-20 | Credential Vault, 3 estados TEST_CONNECTION |
| N5 | COMPLETO | #368✓ (parcial), #371✓ (completo) | 3de40daa | 35039cd5 | sí | 2026-08-20, 2026-08-21 | Readiness + 9 production gates |
| HOTFIX | COMPLETO | #373✓ | 613df718 | 6f3ae64d | sí | 2026-08-21 | /logout page + token cleanup (STOP_GLOBAL Ley 172-13) |
| Z1 | COMPLETO | #374 | 35039cd5 | 2ff4300a | sí | 2026-08-21 | Certificación final - 5/5 gates PASS |

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

### HOTFIX · Imports corruptos en CredentialVaultView [PR #372]

**Problema:**
- `CredentialVaultView.tsx` L4-5: markup de herramienta `<invoke>` interpolado en imports
- Main no compilaba: `npm run build` fallaba

**Fix:**
```typescript
// Antes (corrupto):
import { useQuery, useMutation, useQueryClient } from "@tantml:invoke>
<parameter name="Loader2, CheckCircle2, ... } from "lucide-react";

// Después (correcto):
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff, Trash2, TestTube } from "lucide-react";
```

**Barrido completo realizado:**
- `ProductionGatesView.tsx` ✓
- `ConfiguracionView.tsx` ✓
- `RegistroPublico.tsx` ✓
- `PantallaEspera.tsx` ✓
- `ReadinessView.tsx` ✓

**Verificación:** `npm run build` compiló exitosamente en 106s.

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

### N5 · Readiness y gates [COMPLETO]

**Contrato:** `GET /api/v2/institucion/readiness` y `/production-gates` (ONBOARDING_CONTRACTS.md PR #889).

**Cambios:**
- `app/(forge)/credit-hub/activacion/readiness/page.tsx` - Vista de readiness
- `components/activation/ReadinessView.tsx` - 3 scores + dimensions
- `components/activation/ProductionGatesView.tsx` - 9 gates de producción
- Scores: `account_created`, `production_readiness`, `ai_optimization`
- Dimensions grid con `evidence` y `missing` items
- Callout explicando readiness vs gates

**Resultado:**
- Barras de progreso para cada score
- Cards de dimensiones (Identidad, Seguridad, Equipo, Lenders, etc.)
- 9 gates: IDENTITY_VERIFIED, MFA_PRIVILEGED_USERS, LENDERS_CONFIGURED, etc.
- Banner de eligibilidad basado en `eligible` flag (override readiness score)

### HOTFIX · /logout no limpiaba tokens [PR #373 - STOP_GLOBAL]

**Problema crítico (Ley 172-13):**
- Navegar a `/logout` renderizaba "Módulo no disponible"
- JWT tokens (`nadakki_refresh_token_v2`, `nadakki_sic_token`) permanecían en localStorage
- Usuario cree que salió pero no salió = exposición PII en dispositivo compartido

**Fix:**
- `app/(public)/logout/page.tsx` - página dedicada de logout
- Ejecuta `logout()` del AuthContext
- `clearLocalStorage()` limpia todos los tokens `nadakki_*`
- Redirect a `/login` siempre, incluso si API falla
- Tokens se limpian localmente sin importar respuesta del servidor

**Verificación:**
- `clearLocalStorage()` itera sobre `LS_KEYS` y remueve todos
- `LS_KEYS` incluye `nadakki_sic_token` y `nadakki_refresh_token_v2`

### DEUDA_ENCONTRADA

**Dealer page idle state:**
- La página del dealer nunca alcanza estado idle
- Algo carga de fondo de forma permanente
- Posible causa: polling, WebSocket, o query refetch sin stop condition
- Impacto: consumo de recursos, batería en móviles
- **MEDICIÓN REQUERIDA**: Usuario debe abrir DevTools Network tab en /credit-hub/dealer
  y registrar qué endpoint se repite y cada cuánto
- Acción: investigar en packet futuro una vez medido

### Z1 · Certificación Final [COMPLETO]

**Gates verificados:**

| Gate | Status | Evidencia |
|------|--------|-----------|
| CREDENTIAL_NEVER_IN_CLIENT | ✓ PASS | CredentialVaultView no usa localStorage/sessionStorage |
| TEST_CONNECTION_THREE_STATES | ✓ PASS | VERIFICADO/FALLO/NO_VERIFICABLE con UI distinta |
| GATES_OVERRIDE_READINESS | ✓ PASS | `eligible` flag override readiness score |
| PRIVACY_CLIENT_STORAGE | ✓ PASS | Wizard draft + tokens limpiados en logout |
| CRITICAL_UNKNOWN | ✓ PASS | Build compila SHA 35039cd5, no errors |

**Resultado:** 5/5 gates verificables en PASS

**Detalles:** `docs/audits/Z1_CERTIFICATION_REPORT.md` (PR #374)

**Pendiente para usuario:**
- Medición de idle state en navegador (DevTools Network tab)
- Identificar endpoint que se repite y frecuencia
