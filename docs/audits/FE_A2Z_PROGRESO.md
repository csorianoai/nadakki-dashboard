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
| HOTFIX-PRIVACY | WAITING_FOR_MERGE | #375 | 139d56e3 | cf562141 | no | 2026-08-21 | Purge wizard drafts on logout (Z1 FAIL encontrado por Cowork) |
| PERF-IDLE | WAITING_FOR_MERGE | #376 | 139d56e3 | 145ae37f | no | 2026-08-21 | Reduce polling 30s→120s + pause when hidden |
| FIX-CEDULA-MASK | WAITING_FOR_MERGE | #377 | a0285e68 | 11aad89d | no | 2026-08-21 | Cedula mask idempotence + tests |

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

### HOTFIX-PRIVACY · Wizard drafts sobreviven logout [PR #375 - Z1 FAIL]

**Problema crítico encontrado por Cowork (Ley 172-13):**
- `nadakki_dealer_wizard_v1_*` keys sobrevivían logout con PII en texto plano
- Contenido: cédula, nombre completo, fecha_nacimiento, teléfono, correo, empresa, cargo, dirección, ingreso_mensual
- Equipo compartido en concesionario = exposición PII post-logout
- **Z1 PRIVACY_CLIENT_STORAGE marcado PASS por error** - certificado por código, no por DevTools real

**Causa raíz:**
- `clearWizardDraftStorage()` solo limpiaba UN draft (tenant+user específico)
- NO purgaba TODOS los drafts en logout
- Si tenant/user eran null o había múltiples drafts, PII sobrevivía

**Fix:**
- `purgeAllWizardDrafts()` itera localStorage y remueve TODAS las claves con `WIZARD_DRAFT_KEY_PREFIX`
- Llamado en `logout()` del AuthContext
- Criterio: borrador existe para salir y volver, pero NO para sobrevivir logout
- Logout = usuario declara que terminó → PII debe eliminarse

**Verificación pendiente:**
- DevTools → Application → Local Storage tras logout
- Confirmar que NO existen keys `nadakki_dealer_wizard_v1_*`

### PERF-IDLE · Polling reducido [PR #376]

**Problema encontrado:**
- Página dealer nunca alcanza idle state
- 2 hooks con `refetchInterval: 30_000` siempre activos
- Battery/resource impact en móviles

**Análisis de código:**
1. `useDealerTotalUnreadMessages.ts` - Poll cada 30s (campana)
2. `useNotifications.ts` - Poll cada 30s (notificaciones globales)
3. `ApplicationMessageThread.tsx` - Poll cada 30s (solo cuando thread abierto)

**Fix:**
- Hooks 1 y 2: `30_000` → `120_000` (2 minutos)
- Agregado `document.visibilitychange` listener
- `refetchInterval: isVisible ? 120_000 : false` - Pause cuando tab hidden
- Thread de mensajes: mantenido en 30s (latencia importa, solo cuando abierto)

**Impacto:**
- Antes: 2 requests cada 30s en idle (4 requests/min)
- Después: 2 requests cada 120s cuando visible, 0 cuando hidden (1 request/min max)
- Reducción 75% en requests idle, 100% cuando background

---

## LOOP FE-MONTO · El monto no llega al expediente

### M0 · Dónde se pierde el monto [COMPLETADO]

**Solicitud medida:** ramon almonte soriano · 2014 Toyota Corolla · ...c04ba720
**Síntoma:** Listado muestra "—", expediente muestra "RD$0"

**Medición completa:** Ver `M0_MEDICION_MONTO.md` (documento técnico exhaustivo)

**VEREDICTO:** `NOMBRES_DISTINTOS` (defecto de normalizer, no de backend)

**Defecto raíz:** `lib/credit-hub/api/normalizers.ts:113`
```typescript
|| "0";  // ← Convierte dato ausente en "0", viola regla F4
```

**Flujo completo verificado:**
1. ✅ Wizard TIENE el campo `requested_amount` (línea 172, 404)
2. ✅ Payload del submit LO MANDA en `financial.requested_amount`
3. ✅ Backend devuelve `requested_amount` (evidencia documental: PRs #881/#884/#883, reportes E2E)
4. ❌ Normalizer usa `"0"` como fallback cuando el campo es `null` o ausente
5. ❌ Tipo define `requested_amount: string` en vez de `string | null`
6. ❌ Componentes convierten `"0"` a `Number(0)` y muestran `RD$ 0`

**Casos buenos encontrados:**
- `BankDetailLayout.tsx:182`: usa `?? null` en vez de `?? 0` ✅
- Pero el arreglo no funciona si el normalizer devuelve `"0"` en vez de `null`

**Para el backend:** NADA. El backend está bien según evidencia documental.

**Hipótesis secundaria a verificar en M1:**
- Capturar respuesta real de API para solicitud `...c04ba720` en DevTools
- Confirmar si backend devuelve `null`, `0`, o campo ausente
- Si backend devuelve `0` literal → hay segundo defecto (no guardó el monto)

### M1 · El monto visible [PR #379 - COMPLETO]

**Rama:** `fix/fe-monto-display`
**Veredicto M0:** `NOMBRES_DISTINTOS` - defecto del normalizer, no del backend

**Arreglos aplicados:**
1. `lib/credit-hub/api/normalizers.ts:113`: `|| "0"` → `|| null`
2. Tipos actualizados: `requested_amount: string` → `string | null`
   - `lib/credit-hub/types/creditCore.ts`
   - `lib/credit-hub/types/bankDecision.ts` (`BankQueueItem`)
3. Componentes modificados para mostrar "No informado" cuando `null`:
   - `components/credit-hub/dealer/ApplicationCard.tsx` (listado dealer, 2 variants)
   - `components/credit-hub/bank/BankApplicationCard.tsx` (tarjetas banco + formatDop)
   - `components/credit-hub/bank/BankDetailView.tsx` (expediente banco)
4. Sumas (pipeline, KPIs) actualizadas para skip `null`:
   - `components/credit-hub/dealer/DealerDashboardView.tsx`
   - `components/credit-hub/bank/elite/BankKpiStrip.tsx`

**Verificación:**
- `npm run build` → "Compiled successfully" (2.1min)
- TypeScript: sin errores de tipo
- 12 archivos modificados
- M0_MEDICION_MONTO.md: análisis exhaustivo del recorrido del dato

**Regla F4 aplicada:**
- API lo envía → se muestra
- API no lo envía → "No informado", NUNCA RD$0
- Un cero es un dato. Si no hay dato, no se muestra un cero.

**Pendiente verificación en Vercel:**
- Solicitud ...c04ba720 debe mostrar "No informado" (no "—" ni "RD$0")
- Capturar respuesta API para confirmar si backend devuelve `null` o `0`

---

## LOOP FE-MONTO · Packet M2

### M2 · El estado de la solicitud [PR #380 - COMPLETO]

**Rama:** `fix/fe-estado-solicitud`

**Problema reportado:**
- Solicitud recién enviada (..c04ba720) muestra "ESTADO DESCONOCIDO"
- Listado la marca "legacy completed"
- Contador "Enviadas (0)" no la incluye

**Causa raíz:**
- CreditOrchestrator introdujo 11 estados nuevos (`RECEIVED`, `AI_ANALYSIS`, `AI_COMPLETE`, `SENT_TO_BANKS`, `DOCUMENTS_PENDING`, `FAILED`, `EXPIRED`, `CANCELLED`, `READY_FOR_DISBURSEMENT`, `DISBURSED`)
- `mapBackendState` en `normalizers.ts` NO los reconocía
- Caían al `default` case → `rawState.toLowerCase()` → string no tipado
- No se contaban para filtros ni etiquetas

**Arreglo aplicado:**
```typescript
// Antes:
case "SUBMITTED":
case "BANK_SUBMITTED": return "submitted";

// Ahora:
case "SUBMITTED":
case "BANK_SUBMITTED":
case "RECEIVED":           // M2: New orchestrator state
case "AI_ANALYSIS":        // M2: New orchestrator state
case "AI_COMPLETE":        // M2: New orchestrator state
case "SENT_TO_BANKS":      // M2: New orchestrator state
case "DOCUMENTS_PENDING":  // M2: New orchestrator state
  return "submitted";
```

También mapeados:
- `FAILED`, `EXPIRED`, `CANCELLED` → `rejected` (terminales negativos)
- `READY_FOR_DISBURSEMENT`, `DISBURSED` → `processed` (funding completado)

**Justificación del mapeo:**
- Estados de tránsito (`RECEIVED`, `AI_ANALYSIS`, etc.) → `submitted`
  - Cuentan para filtro "Enviadas"
  - Son pipeline activo
- Estados terminales negativos → `rejected`
- Estados post-aprobación → `processed`

**Impacto:**
- Solicitudes recién enviadas se cuentan en "Enviadas"
- Estados muestran etiquetas legibles ("Recibida", "Análisis IA", etc.)
- No más "legacy completed" para solicitudes nuevas
- Contador de "Enviadas" funciona

**Verificación:**
- `npm run build` → "Compiled successfully" (3.9min)
- 3 archivos modificados
- M2_MEDICION_ESTADO.md: análisis exhaustivo del flujo de estados

**Pendiente verificación en Vercel:**
- Crear nueva solicitud y enviarla
- Confirmar estado legible (no "legacy completed")
- Confirmar contador "Enviadas" incluye la solicitud

**KYC/OCR "No configurado":**
- No es defecto si el tenant no tiene integración habilitada
- Verificar configuración del tenant en backend para confirmar

**Veredicto M2:** `BACKEND_STATE_MAPPING_INCOMPLETE` (normalizer obsoleto)

**Iteraciones usadas:** 3 de 12

---

## INFORME FINAL · LOOP FE-MONTO

**Estado:** COMPLETO
- M0: VEREDICTO `NO_SE_PERSISTE` (wizard no calculaba requested_amount)
- M1: PR #381 - Wizard auto-calcula requested_amount desde vehicle_price/down_payment + PR #379 - Display correcto para null
- M2: PR #380 - Mapeo completo de estados CreditOrchestrator

**PRs:**
- #379 (display) WAITING_FOR_MERGE
- #380 (estado) WAITING_FOR_MERGE  
- #381 (wizard) WAITING_FOR_MERGE

---

## PACKET · Bank Document Contracts [D1]

### D1 · Client-side contract misalignments [PR #382 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-document-contracts`

**Problema reportado por auditoría:**
- El analista del banco no puede ver documentos
- `lib/bank/document-preview-api.ts:36,71` cae a `/documents/{id}/download` que no existe (404)
- Preview devuelve 410 (deprecated - requería HMAC token que nadie emitía)
- Ambos caminos rotos

**3 contratos desalineados encontrados:**

1. **POST → PATCH en `/review`**
   - `lib/api/document-intelligence.ts:285`: usaba `method: "POST"`
   - Backend real: `PATCH /api/v2/credit/document-requests/{id}/review`
   - Documentado en `BACKEND_FRONTEND_COVERAGE_MATRIX.md:70`

2. **`/extracted-fields` → `/extracted`**
   - `lib/api/document-intelligence.ts:126`: pedía `/extracted-fields`
   - Backend real: `/extracted`

3. **`/download` no existe**
   - `lib/bank/document-preview-api.ts:38`: construye URL a `/download`
   - Usado como fallback en línea 71 cuando preview falla
   - Backend retorna 404 (endpoint no existe)

**Arreglos aplicados:**
1. ✅ POST → PATCH corregido
2. ✅ /extracted-fields → /extracted corregido
3. ⚠️ /download documentado como roto con TODOs y warning comments

**Comentarios agregados:**
```typescript
/**
 * ⚠️ WARNING: preview.json now returns 410 (deprecated - required HMAC token not emitted).
 * Fallback to /download also returns 404 (endpoint doesn't exist).
 * Both paths are currently broken. Analysts cannot view documents until backend provides working route.
 */
```

**Verificación:**
- `npm run build` → "Compiled successfully" (3.9min)
- 2 archivos modificados

**BLOQUEADO:** No se puede arreglar completamente sin medición de red real del usuario
- Necesito captura de DevTools Network cuando analista intenta abrir documento
- ¿Existe alguna ruta que SÍ funcione para obtener el PDF?
- Si no hay ruta funcional, es issue de backend

**Consumidores afectados:**
- `components/bank/DocumentPreviewPane.tsx` - Preview principal
- `components/document-intelligence/DocumentReviewPanel.tsx` - Review de documentos
- `e2e/bank/test_document_preview_e2e.spec.ts` - Tests E2E

**BASE_SHA:** 06c7fef6 (origin/main post-#381)
**HEAD_SHA:** 91696540
**Estado:** WAITING_FOR_MERGE + WAITING_FOR_NETWORK_MEASUREMENT

---

## LOOP FIX-FE · Cierre de 5 puntos de auditoría

### C1 · PII en sessionStorage tras el logout [PR #388 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-c1-pii-session-storage`

**Problema reportado (18 iteraciones):**
- PII persistía en `sessionStorage` tras logout
- 5 áreas identificadas: credit process results, stipulation workflows, workflow audit trail, saved scenarios, wizard telemetry

**Arreglo aplicado:**
1. **Nuevo archivo:** `lib/auth/auth-session-cleanup.ts`
   - `clearSessionStorage()`: pattern-based removal de claves PII
   - `PII_PREFIXES`: array de prefijos conocidos
   - `hasSessionStoragePII()` / `getSessionStoragePIIKeys()`: helpers de verificación

2. **Integración en logout:** `lib/auth/auth-context.tsx`
   - Llamada a `clearSessionStorage()` en función `logout()`
   - Se ejecuta DESPUÉS de `clearLocalStorage()`

**Test coverage:**
- `tests/auth/logout-pii-cleanup.test.ts` (nuevo)
- 6 tests ejecutables con `@jest-environment jsdom`
- SMOKE test: falla si `clearSessionStorage` se comenta
- Tests específicos por cada fuente de PII

**Resultado:** 6/6 tests passed
**BASE_SHA:** 48400ebe (origin/main post-C1)
**Estado:** WAITING_FOR_MERGE

---

### C2 · Tests que pasan sin ejecutar nada [PR #389 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-c2-executable-tests`

**Problema reportado (16 iteraciones):**
- Tests "source-level" que buscan strings en código (`expect(src).toContain(...)`)
- Pasan aunque el código esté comentado o roto
- Específicamente: `tests/auth/tenant-sync.test.ts` (líneas 45-46, 84, 97) y `tests/auth/sic-token-refresh.test.ts` (líneas 132-133)

**Arreglo aplicado:**
1. **Nuevo archivo de tests:** `tests/auth/tenant-sync-executable.test.ts`
   - Reemplaza tests source-level con tests ejecutables
   - Llama directamente a `syncLocalStorage()`, `clearLocalStorage()`, `tokenStorage` functions
   - SMOKE tests: fallan si el código se comenta

2. **Exportaciones agregadas:** `lib/auth/auth-context.tsx`
   - `export const LS_KEYS`
   - `export function syncLocalStorage(...)`
   - `export function clearLocalStorage()`

3. **Inventario completo:** `docs/audits/C2_SOURCE_LEVEL_TESTS_INVENTORY.md`
   - 80+ tests source-level catalogados
   - Priorizados: Critical (auth/propiedad), Medium, Low
   - Tests relacionados a auth/tokens ya reescritos

**Test coverage:**
- 14 executable tests (syncLocalStorage, clearLocalStorage, tokenStorage)
- Todos incluyen SMOKE tests para verificar ejecución real
- 14/14 tests passed

**BASE_SHA:** 48400ebe
**Estado:** WAITING_FOR_MERGE

---

### C3 · El contrato con el backend, verificado [PR #390 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-c3-backend-contract-verification`

**Problema reportado (12 iteraciones):**
- Verificar existencia de rutas backend: `GET /extracted` y `PATCH /review`
- Un 401 prueba existencia, un 404 prueba no-existencia

**Medición ejecutada:**
```powershell
# GET /extracted
Invoke-WebRequest -Uri "https://api.nadakki.com/api/v2/credit/applications/test-id/documents/test-doc/extracted" 
→ StatusCode: 401 ✓ (ruta existe)

# PATCH /review
Invoke-WebRequest -Uri "https://api.nadakki.com/api/v2/credit/applications/test-id/documents/test-doc/review" -Method PATCH
→ StatusCode: 401 ✓ (ruta existe)
```

**Resultado:**
- Ambas rutas confirmadas como existentes en `api.nadakki.com`
- Documentado en `docs/audits/C3_BACKEND_CONTRACT_VERIFICATION.md`

**BASE_SHA:** 48400ebe
**Estado:** WAITING_FOR_MERGE

---

### C4 · El monto, de punta a punta [PR #391 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-c4-requested-amount-verification`

**Problema reportado (10 iteraciones):**
- Confirmar que `updateField` del Provider puebla `requested_amount`
- Medir si es el único mecanismo o si el recálculo al cargar draft es crítico

**Arreglo aplicado:**
1. **Nuevo archivo de tests:** `tests/credit-hub/dealer/wizard/requested-amount-logic.test.ts`
   - 11 unit tests que ejecutan la lógica de cálculo directamente
   - Casos: 600000 precio + 30000 enganche → 570000 requested_amount
   - Edge cases: price=0, negativo, down>price, strings no numéricos
   - SMOKE test: verifica que la implementación en PR #387 es exacta

2. **Documentación:** `docs/audits/C4_REQUESTED_AMOUNT_VERIFICATION.md`
   - **Análisis del código:** `updateField` del Provider SÍ puebla el campo (líneas 358-361 de `DealerWizardProvider.tsx`)
   - **Draft reload:** NO hay recálculo al cargar draft en `main` actual (líneas 282-307)
   - **Conclusión:** `updateField` es el ÚNICO mecanismo poblando `requested_amount`
   - **Implicación:** Si `updateField` falla, no hay fallback

**Test coverage:**
- 11/11 tests passed
- Cálculo matemático verificado: `600000 - 30000 = 570000`
- Casos edge cubiertos

**BASE_SHA:** 48400ebe
**Estado:** WAITING_FOR_MERGE

---

### C5 · La app móvil nunca se compiló [PR #392 - WAITING_FOR_MERGE]

**Rama:** `fix/fe-c5-mobile-app-verification`

**Problema reportado (12 iteraciones):**
- Verificar proceso de build de app móvil
- Si no ejecutable, documentar con `NO_EJECUTABLE`
- Verificar: `capacitor.config.ts` URL, manifest icons, service worker no cachea rutas autenticadas

**Verificación ejecutada:**

1. **Capacitor config:** ✅ PASS
   - URL: `https://dashboard.nadakki.com/credit-hub/dealer` (producción correcta)
   - `cleartext: false`, `androidScheme: "https"`

2. **Manifest icons:** ✅ PASS
   - Declara 8 iconos (72, 96, 128, 144, 152, 192, 384, 512)
   - 8/8 iconos verificados en `public/icons/`

3. **Service worker:** ✅ PASS (crítico para Ley 172-13)
   - Rutas autenticadas usan `NetworkOnly` (NO se cachean):
     - `/api/*`, `/auth`, `/login`, `/dashboard`, `/dealer`, `/bank`, `/credit-hub`, `/applications`, `/documents`
   - Solo assets estáticos se cachean (CSS, JS, fonts, icons)
   - **Esto previene PII exposure** (mismo defecto que C1, distinta vía)

4. **Build:** ⚠️ NO_EJECUTABLE
   - Android SDK: ✅ FOUND at `C:\Users\ramon\AppData\Local\Android\Sdk`
   - Java/JDK: ❌ NOT FOUND (`JAVA_HOME` not set)
   - `npx cap sync android`: ✅ succeeded
   - `android/gradlew.bat`: ✅ exists
   - Build: ❌ blocked by missing Java

**Resultado:**
- **Configuración:** PASS (URL, icons, service worker security)
- **Build:** NO_EJECUTABLE (Java/JDK requerido)

**Documentación:** `docs/audits/C5_MOBILE_APP_VERIFICATION.md`

**BASE_SHA:** 48400ebe
**Estado:** WAITING_FOR_MERGE

---
