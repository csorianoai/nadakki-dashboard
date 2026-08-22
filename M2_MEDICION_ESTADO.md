# M2 · Medición: Estado de la solicitud
## Solicitud: ramon almonte soriano · 2014 Toyota Corolla · ...c04ba720

---

## SÍNTOMAS REPORTADOS

```text
el expediente    "ESTADO DESCONOCIDO · KYC: No configurado · OCR: No configurado"
el listado       "legacy completed", con Enviadas (0)
```

Una solicitud recién enviada no debería:
- Mostrar "ESTADO DESCONOCIDO"
- Figurar como "legacy completed"
- Tener contador de Enviadas en (0)

---

## MEDICIÓN: ¿Qué estado devuelve la API?

Sin acceso a DevTools en este momento, pero por análisis de código:

**Backend (CreditOrchestrator):**
Según `lib/credit-hub/honesty/display-status.ts:7-24`, el backend tiene estados nuevos:
- `DRAFT`
- `RECEIVED` ← Nuevo
- `AI_ANALYSIS` ← Nuevo
- `AI_COMPLETE` ← Nuevo
- `BANK_SUBMITTED`
- `SENT_TO_BANKS` ← Nuevo
- `HYBRID_IN_PROGRESS`
- `DOCUMENTS_PENDING` ← Nuevo
- `OFFER_SELECTED`
- `READY_FOR_DISBURSEMENT` ← Nuevo
- `DISBURSED` ← Nuevo
- `BANK_COMPLETE`
- `COMPLETED`
- `FAILED` ← Nuevo
- `EXPIRED` ← Nuevo
- `CANCELLED` ← Nuevo

**Frontend (normalizer):**
El `mapBackendState` en `lib/credit-hub/api/normalizers.ts:59-78` SOLO mapeaba:
- DRAFT
- SUBMITTED / BANK_SUBMITTED
- PROCESSING / HYBRID_IN_PROGRESS
- PROCESSED / BANK_COMPLETE / COMPLETED
- APPROVED / APPROVED_WITH_STIPULATIONS
- REJECTED / DECLINED
- OFFER_SELECTED
- CONDITIONED
- MANUAL_REVIEW

**Defecto identificado:**
Los estados nuevos del CreditOrchestrator (`RECEIVED`, `AI_ANALYSIS`, `AI_COMPLETE`, `SENT_TO_BANKS`, `DOCUMENTS_PENDING`, `FAILED`, `EXPIRED`, `CANCELLED`, `READY_FOR_DISBURSEMENT`, `DISBURSED`) NO estaban en el mapa del normalizer.

**Consecuencia:**
1. Backend devuelve `state: "RECEIVED"` (solicitud recién enviada)
2. Normalizer no lo reconoce → línea 76: `default: return rawState.toLowerCase() as CreditApplicationStatus`
3. Frontend status = `"received"` (string no tipado)
4. `formatApplicationStateLabel` lo recibe como estado desconocido
5. `resolveDisplayStatus` no lo reconoce (línea 109-120) → devuelve `"LEGACY"`
6. Se muestra como "Estado legado"
7. El contador de "Enviadas" busca `status === "submitted"`, pero el estado es `"received"` → count = 0

---

## ARREGLO APLICADO

**Archivo:** `lib/credit-hub/api/normalizers.ts`

**Función:** `mapBackendState` (líneas 59-93)

**Cambios:**
```typescript
// Antes (incompleto):
case "SUBMITTED":
case "BANK_SUBMITTED": return "submitted";

// Ahora (completo con estados del CreditOrchestrator):
case "SUBMITTED":
case "BANK_SUBMITTED":
case "RECEIVED":           // M2: New orchestrator state
case "AI_ANALYSIS":        // M2: New orchestrator state
case "AI_COMPLETE":        // M2: New orchestrator state
case "SENT_TO_BANKS":      // M2: New orchestrator state
case "DOCUMENTS_PENDING":  // M2: New orchestrator state
  return "submitted";
```

También agregados:
```typescript
case "FAILED":  // M2: Failed is a rejection
  return "rejected";

case "READY_FOR_DISBURSEMENT":
case "DISBURSED":
  return "processed";  // M2: Disbursement is processed/funded

case "EXPIRED":
case "CANCELLED":
  return "rejected";  // M2: Expired/cancelled are terminal rejections
```

**Justificación del mapeo:**
- `RECEIVED`, `AI_ANALYSIS`, `AI_COMPLETE`, `SENT_TO_BANKS`, `DOCUMENTS_PENDING` → `submitted`
  - Son estados activos de una solicitud en tránsito hacia el banco
  - Deben contar para el filtro "Enviadas" del dealer
  - Son parte del pipeline activo

- `FAILED`, `EXPIRED`, `CANCELLED` → `rejected`
  - Son terminales negativos
  - No se pueden recuperar sin crear nueva solicitud
  - Análogos a REJECTED/DECLINED

- `READY_FOR_DISBURSEMENT`, `DISBURSED` → `processed`
  - Son estados post-aprobación
  - Representan el funding completado o en curso
  - Análogos a COMPLETED/BANK_COMPLETE

---

## CÓMO SE MAPEA UN ESTADO (flujo completo)

### 1. Backend → Normalizer
```typescript
// Backend devuelve: { state: "RECEIVED" }
// normalizeApplication extrae:
const rawState = pickString(record, ["state"]);  // "RECEIVED"
status = mapBackendState(rawState);              // "submitted"
```

### 2. Normalizer → Componente
```typescript
// CreditApplication tiene: status: "submitted"
// DealerApplicationsListView filtra:
rows.filter((a) => a.status === "submitted")  // ✓ la encuentra
```

### 3. Componente → Display
```typescript
// ApplicationStatusBadge usa:
formatApplicationStateLabel(application.state)
// → resolveDisplayStatusLabel({ backendState: "RECEIVED", status: "submitted" })
// → SERVER_DISPLAY_STATUS_LABELS["RECEIVED"] = "Recibida"
// → Muestra "Recibida"
```

---

## CONTADOR DE ENVIADAS

**Archivo:** `components/credit-hub/dealer/DealerApplicationsListView.tsx`

**Línea 100:** El contador se calcula por filtro:
```typescript
const count = f.id === "all" ? applications.length : applications.filter((a) => a.status === f.id).length;
```

Para el filtro "Enviadas" (id: "submitted"):
```typescript
applications.filter((a) => a.status === "submitted").length
```

**Antes del fix:** Una solicitud con estado backend `RECEIVED` tenía `status === "received"` → no se contaba.

**Después del fix:** Una solicitud con estado backend `RECEIVED` tiene `status === "submitted"` → SÍ se cuenta.

---

## VERIFICACIÓN PENDIENTE

### En Vercel (DevTools):
1. Crear nueva solicitud y enviarla
2. Capturar respuesta de `GET /api/v2/credit/applications`
3. Ver campo `state` del backend (debería ser `RECEIVED`, `AI_ANALYSIS`, o similar)
4. Confirmar que el listado:
   - NO muestra "legacy completed"
   - SÍ muestra estado legible ("Recibida", "Análisis IA", etc.)
   - Contador "Enviadas" incluye la solicitud

### Estados específicos a verificar:
- `RECEIVED` → debe mostrar "Recibida"
- `AI_ANALYSIS` → debe mostrar "Análisis IA"
- `AI_COMPLETE` → debe mostrar "IA completada"
- `SENT_TO_BANKS` → debe mostrar "Enviada a bancos"
- `DOCUMENTS_PENDING` → debe mostrar "Documentos pendientes"

Todos deben:
- Aparecer en el filtro "Enviadas"
- NO aparecer como "Estado legado" o "legacy completed"
- Contar para el total de "Enviadas (N)"

---

## KYC Y OCR "No configurado"

El mensaje "KYC: No configurado · OCR: No configurado" es correcto si:
- El tenant no tiene integración con proveedor de KYC (e.g., Midatu)
- El tenant no tiene integración con proveedor de OCR

**No es un defecto del frontend** si el backend realmente no tiene esas capacidades habilitadas.

**Para confirmar:**
1. Verificar configuración del tenant en el backend
2. Si KYC/OCR están habilitados pero el mensaje dice "No configurado" → defecto del frontend (mostrar config del tenant)
3. Si KYC/OCR NO están habilitados → el mensaje es correcto

---

## RESUMEN M2

**Veredicto:** `BACKEND_STATE_MAPPING_INCOMPLETE`

**Causa raíz:**
- CreditOrchestrator introdujo nuevos estados (RECEIVED, AI_ANALYSIS, etc.)
- `mapBackendState` del normalizer no se actualizó
- Solicitudes con estados nuevos caían al `default` case (lowercase del estado crudo)
- No se reconocían en filtros ni contadores

**Arreglo:**
- Actualizado `mapBackendState` con 11 estados nuevos
- Mapeados a los buckets correctos del frontend (`submitted`, `rejected`, `processed`)
- Ahora el normalizer reconoce todos los estados del CreditOrchestrator

**Impacto:**
- Solicitudes recién enviadas se cuentan correctamente en "Enviadas"
- Estados muestran etiquetas legibles ("Recibida", "Análisis IA", etc.)
- No más "legacy completed" para solicitudes nuevas
- Contador de "Enviadas" funciona

---

**Fecha:** 2026-08-22
**Iteraciones usadas:** 3 de 12
