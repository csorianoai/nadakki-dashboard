# _API_CONTRACT.md — NADAKKI CREDIT CORE
## Contrato de API para integración Frontend ↔ Backend
### Para Cowork — Referencia obligatoria antes de codear cualquier llamada a API

---

## 🌐 BASE URL

| Entorno | URL base |
|---|---|
| Producción | `https://nadakki-ai-suite.onrender.com` |
| Local (dev) | `http://localhost:8000` |

**Variable de entorno:** `NEXT_PUBLIC_API_BASE_URL`

---

## 🔐 HEADERS REQUERIDOS EN TODAS LAS REQUESTS

```typescript
const headers = {
  'Content-Type': 'application/json',
  'X-Tenant-ID': tenantId,           // OBLIGATORIO — del store/contexto, nunca hardcodeado
  'Authorization': `Bearer ${jwt}`,   // JWT del usuario
  // Solo para acciones de banco:
  'X-Role': 'BANK_ANALYST',
  'X-Bank-ID': bankId,
  // Solo para acciones de dealer:
  'X-Role': 'DEALER',
};
```

**REGLA DURA:** El `X-Tenant-ID` viene del store/sesión, **JAMÁS hardcodeado** en código TSX/CSS. Si no hay tenant disponible → mostrar error "Seleccione una institución", NO usar fallback.

---

## 📋 ROLES Y SUS HEADERS

| Rol | Headers requeridos | Puede hacer |
|---|---|---|
| **DEALER** | `X-Role: DEALER` + `X-Tenant-ID` | Crear solicitudes, cargar vehículos, ver sus deals, seleccionar ofertas |
| **BANK_ANALYST** | `X-Role: BANK_ANALYST` + `X-Bank-ID` + `X-Tenant-ID` | Ver expedientes, emitir ofertas, rechazar |
| **CLIENT** | `X-Application-ID` (público con código) | Ver estado de su solicitud, seleccionar oferta |
| **NADAKKI_ADMIN** | `X-Role: admin` + `X-Admin-Key` | Ver todo, todos los tenants |

---

## 🏗️ CREDIT CORE — ENDPOINTS

### 1. Crear nueva aplicación

```http
POST /api/v2/credit/applications
```

**Headers:** `X-Tenant-ID`, `Authorization`

**Body:**
```json
{
  "mode": "AI_ONLY"
}
```

**Response 200:**
```json
{
  "id": "uuid-string",
  "status": "DRAFT",
  "tenant_id": "credicefi",
  "created_at": "2026-05-09T18:00:00Z"
}
```

---

### 2. Guardar datos del solicitante

```http
POST /api/v2/credit/applications/{application_id}/applicant
```

**Body (ApplicantDataRD):**
```json
{
  "cedula": "00113579246",
  "nombre_completo": "Juan Pérez",
  "fecha_nacimiento": "1985-06-15",
  "estado_civil": "CASADO",
  "telefono_celular": "809-555-0001",
  "email": "juan@test.com",
  "direccion": "Av. Principal 100",
  "sector": "Naco",
  "municipio": "Santo Domingo",
  "provincia": "Distrito Nacional",
  "tipo_empleo": "ASALARIADO",
  "nombre_empleador": "Empresa XYZ",
  "antiguedad_empleo_meses": 36,
  "ingreso_mensual_declarado": 85000,
  "monto_solicitado": 600000,
  "plazo_meses": 48,
  "inicial_disponible": 150000,
  "referencias": [
    { "nombre": "Pedro", "telefono": "809-111-2222", "relacion": "Familiar" },
    { "nombre": "María", "telefono": "809-222-3333", "relacion": "Trabajo" }
  ],
  "autoriza_buro": true,
  "acepta_politica_datos": true,
  "firma_digital": "2026-05-09T10:00:00Z"
}
```

**Validaciones server-side:**
- Cédula validada con algoritmo Luhn
- Mínimo 2 referencias requeridas
- `autoriza_buro` debe ser `true` (sin esto → 422)
- `acepta_politica_datos` debe ser `true`

**Response 200:**
```json
{ "applicant_id": "uuid", "status": "APPLICANT_SAVED" }
```

**Errores:**
- `422 Unprocessable Entity` — validación falló
- `403 Forbidden` — cross-tenant violation

---

### 3. Guardar datos del vehículo (calcula LTV automáticamente)

```http
POST /api/v2/credit/applications/{application_id}/vehicle
```

**Body (VehicleDataRD):**
```json
{
  "marca": "Toyota",
  "modelo": "Corolla",
  "version": "XSE",
  "anio": 2024,
  "vin": "OPTIONAL_VIN_STRING",
  "km_odometro": 0,
  "condicion": "NUEVO",
  "transmision": "AUTOMATICA",
  "precio_venta": 750000,
  "valor_tasacion": 720000,
  "tiene_trade_in": false
}
```

**Validaciones:**
- Año entre 2000 y año actual+1
- `valor_tasacion > 0`
- Si `condicion = NUEVO` → `km_odometro` debe ser 0 (sino 422)

**Response 200:**
```json
{
  "vehicle_id": "uuid",
  "ltv_ratio": 0.83,
  "ltv_pct": 83.3,
  "monto_a_financiar": 600000,
  "alerta": "EXCEEDS_MAX_LTV_80PCT"  // null si LTV ≤ 80%
}
```

**Cálculo de LTV en frontend (para preview en vivo):**
```typescript
const ltv = monto_a_financiar / valor_tasacion;
const alertaLtv = ltv > 0.80 ? 'EXCEEDS_MAX_LTV_80PCT' : null;
```

---

### 4. Procesar con AI (scoring + decision)

```http
POST /api/v2/credit/applications/{application_id}/process
```

**Body:**
```json
{ "mode": "AI_ONLY" }
```

**Response 200:**
```json
{
  "score": 745,
  "recommendation": "APPROVE_WITH_CONDITIONS",
  "score_breakdown": {
    "income_factor": 0.85,
    "stability_factor": 0.78,
    "dti_factor": 0.92,
    "ltv_factor": 0.65,
    "history_factor": null
  },
  "ai_decision": {
    "model_version": "v3.2",
    "confidence": 0.84,
    "evidence_count": 7
  }
}
```

**Score interpretation:**
- `> 700`: Verde (high confidence)
- `500-700`: Amarillo (review required)
- `< 500`: Rojo (likely decline)

---

### 5. Ver expediente completo (Bank persona)

```http
GET /api/v2/credit/applications/{application_id}/full
```

**Response 200:**
```json
{
  "application": {
    "id": "uuid",
    "status": "PENDING_REVIEW",
    "tenant_id": "credicefi",
    "created_at": "...",
    "monto_a_financiar": 600000,
    "plazo_meses": 48
  },
  "applicant": { /* full ApplicantDataRD */ },
  "vehicle": { /* full VehicleDataRD + ltv data */ },
  "ai_decision": {
    "score": 745,
    "recommendation": "APPROVE_WITH_CONDITIONS",
    "confidence": 0.84,
    "evidence": [
      {
        "type": "INCOME_VERIFICATION",
        "source": "SIC",
        "confidence": 0.91,
        "description": "Ingreso mensual verificado: RD$85,000",
        "timestamp": "..."
      },
      // más evidencia...
    ]
  },
  "offers": [
    {
      "offer_id": "uuid",
      "banco_nombre": "Banco Piloto RD",
      "banco_tenant_id": "banco-pilot",
      "monto_aprobado": 600000,
      "tasa_anual_nominal": 18.5,
      "plazo_aprobado_meses": 48,
      "cuota_mensual": 17450,
      "inicial_requerido": 150000,
      "seguro_vida_mensual": 850,
      "seguro_vehiculo_mensual": 1200,
      "total_cuota": 19500,  // calculated
      "estado": "APROBADO",
      "condiciones": []
    }
  ],
  "cuota_estimada": 17450,
  "events": [ /* audit trail completo */ ],
  "score_breakdown": { /* factors */ }
}
```

**Esta response es la fuente de verdad para la página `/credit-hub/bank/applications/[id]`.**

---

### 6. Banco emite oferta (Bank persona)

```http
POST /api/v2/credit/applications/{application_id}/offers
```

**Headers extra:** `X-Role: BANK_ANALYST`, `X-Bank-ID`

**Body (BankOffer):**
```json
{
  "banco_nombre": "Banco Piloto RD",
  "banco_tenant_id": "banco-pilot",
  "monto_aprobado": 600000,
  "tasa_anual_nominal": 18.5,
  "plazo_aprobado_meses": 48,
  "cuota_mensual": 17450,
  "inicial_requerido": 150000,
  "seguro_vida_mensual": 850,
  "seguro_vehiculo_mensual": 1200,
  "estado": "APROBADO",
  "condiciones": []
}
```

**O para rechazar:**
```json
{
  "estado": "RECHAZADO",
  "motivo_rechazo": "DTI_EXCEEDS_THRESHOLD",
  "comentario": "Capacidad de pago insuficiente"
}
```

**Response 200:**
```json
{ "offer_id": "uuid", "status": "OFFER_CREATED" }
```

---

### 7. Listar ofertas (Dealer/Cliente)

```http
GET /api/v2/credit/applications/{application_id}/offers
```

**Response 200:** Array de offers ordenadas por `total_cuota` ascendente.

---

### 8. Seleccionar una oferta (Dealer/Cliente)

```http
POST /api/v2/credit/applications/{application_id}/offers/{offer_id}/select
```

**Response 200:**
```json
{ "status": "OFFER_SELECTED", "selected_offer_id": "uuid" }
```

---

### 9. Tabla de amortización

```http
GET /api/v2/credit/applications/{application_id}/amortization
```

**Response 200:**
```json
{
  "tasa_anual": 18.5,
  "plazo_meses": 48,
  "monto_financiado": 600000,
  "cuota_mensual": 17450,
  "tabla": [
    { "cuota": 1, "principal": 8200, "interes": 9250, "saldo": 591800 },
    { "cuota": 2, "principal": 8326, "interes": 9124, "saldo": 583474 },
    // ... 48 cuotas
    { "cuota": 48, "principal": 17400, "interes": 50,   "saldo": 0.0 }
  ]
}
```

---

### 10. Cola del dealer

```http
GET /api/v2/credit/dealer/deals
```

**Headers:** `X-Role: DEALER`

**Query params:**
- `status` — DRAFT | SUBMITTED | APPROVED | REJECTED
- `from_date`, `to_date`
- `page`, `limit`

**Response 200:**
```json
{
  "items": [ /* applications resumidas */ ],
  "total": 142,
  "page": 1,
  "limit": 25
}
```

---

### 11. Cola del banco

```http
GET /api/v2/credit/bank/queue
```

**Headers:** `X-Role: BANK_ANALYST`, `X-Bank-ID`

**Query params:**
- `min_score` — filter score mínimo
- `max_amount` — filter monto máximo
- `status` — pendiente | respondida
- `page`, `limit`

**Response 200:** misma estructura que `/dealer/deals`

---

## 📤 DOCUMENT UPLOAD ENDPOINTS

### Upload documento

```http
POST /api/v2/credit/applications/{application_id}/documents
Content-Type: multipart/form-data
```

**Form fields:**
- `file` — el archivo (max 5MB, PNG/JPG/PDF)
- `tipo` — CEDULA_FRENTE | CEDULA_REVERSO | CARTA_EMPLEO | ESTADO_CUENTA_1 | ESTADO_CUENTA_2 | ESTADO_CUENTA_3 | DECLARACION_TAXES | OTROS

**Response 200:**
```json
{
  "document_id": "uuid",
  "tipo": "CEDULA_FRENTE",
  "filename": "cedula_frente.jpg",
  "size_bytes": 234567,
  "storage_url": "/internal/url",
  "ocr_status": "PENDING",
  "uploaded_at": "..."
}
```

---

### Listar documentos

```http
GET /api/v2/credit/applications/{application_id}/documents
```

---

### Eliminar documento (soft-delete)

```http
DELETE /api/v2/credit/applications/{application_id}/documents/{doc_id}
```

---

## 🎨 TENANT BRANDING ENDPOINT

### Obtener branding del tenant actual

```http
GET /api/v2/tenants/{tenant_id}/branding
```

**Response 200:**
```json
{
  "tenant_id": "credicefi",
  "display_name": "Credicefi",
  "logo_url": "https://cdn.nadakki.com/logos/credicefi.svg",
  "brand_primary": "#1B4A8C",
  "brand_dark": "#081E3D",
  "locale": "es-DO",
  "currency": "DOP",
  "regulatory_profile": "INDOTEL",
  "application_status_labels": {
    "DRAFT": "Borrador",
    "SUBMITTED": "Enviada",
    "PENDING_REVIEW": "En revisión",
    "APPROVED": "Aprobada",
    "REJECTED": "Rechazada"
  },
  "copy_overrides": {
    "applicant.singular": "socio",
    "applicant.plural": "socios"
  }
}
```

**USO EN FRONTEND:**
```typescript
// app/(forge)/credit-hub/layout.tsx
const branding = await fetch(`${API_BASE}/api/v2/tenants/${tenantId}/branding`)
  .then(r => r.json());

// CSS variables se aplican vía style prop
<body style={{
  '--forge-brand-500': branding.brand_primary,
  '--forge-brand-900': branding.brand_dark,
}}>
```

---

## 🚨 MANEJO DE ERRORES — STANDARD

Todos los errores siguen este formato:

```json
{
  "error": {
    "code": "ERR_LTV_EXCEEDS_THRESHOLD",
    "message": "El LTV excede el umbral configurado para este tenant (80%)",
    "field": "valor_tasacion",
    "reference": "ERR-2026-05-09-1847"
  }
}
```

**Status codes esperados:**
| Code | Significado | Acción frontend |
|---|---|---|
| 200 | OK | Continuar |
| 201 | Created | Continuar + mostrar éxito |
| 400 | Bad Request | Mostrar mensaje al usuario |
| 401 | Unauthorized | Redirect a login |
| 403 | Forbidden / Cross-tenant | Mostrar "No tienes permiso" |
| 404 | Not Found | Mostrar "No encontrado" |
| 422 | Validation error | Mostrar errores en form fields |
| 500 | Server error | Toast genérico + Sentry |

---

## 🔧 CLIENT HTTP — PATRÓN RECOMENDADO

Usa `@tanstack/react-query` (ya está en dependencies).

**Setup base:**
```typescript
// lib/forge/api.ts
import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

export function useApplication(id: string) {
  const tenantId = useTenant();  // de TenantThemeProvider
  return useQuery({
    queryKey: ['application', id, tenantId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v2/credit/applications/${id}/full`, {
        headers: {
          'X-Tenant-ID': tenantId,
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    staleTime: 30_000,  // 30s
  });
}
```

**Mutations:**
```typescript
export function useSubmitApplicant(applicationId: string) {
  const tenantId = useTenant();
  return useMutation({
    mutationFn: async (data: ApplicantDataRD) => {
      const res = await fetch(
        `${API_BASE}/api/v2/credit/applications/${applicationId}/applicant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
            'Authorization': `Bearer ${getToken()}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Submit failed');
      }
      return res.json();
    },
  });
}
```

---

## ⚠️ MULTI-TENANT — REGLAS DURAS PARA EL CLIENT

1. ❌ **JAMÁS** hardcodear `X-Tenant-ID: 'credicefi'` en el código
2. ✅ **SIEMPRE** leer el tenant del `TenantThemeProvider` o store
3. ❌ **JAMÁS** hardcodear UUIDs (`366b3c6c-...`)
4. ✅ **SIEMPRE** validar que `tenantId` está disponible antes de llamar API; si no → mostrar error de UI
5. ❌ **JAMÁS** copiar IDs de URLs ajenas — toda navegación es server-aware
6. ✅ Cross-tenant requests deben fallar visiblemente (no silently)

---

## 📊 FLUJOS COMPLETOS — REFERENCIA RÁPIDA

### Flujo Dealer (crear solicitud)

```
1. POST /applications              → obtiene application.id
2. POST /applications/:id/applicant → guarda datos del solicitante
3. POST /applications/:id/vehicle   → guarda vehículo, recibe LTV
4. POST /applications/:id/documents → multipart, upload de cada doc
5. POST /applications/:id/process   → AI scoring
6. (banco recibe en su queue)
7. (cuando llegan ofertas)
   GET /applications/:id/offers    → lista ofertas
8. POST /applications/:id/offers/:oid/select → cliente elige
```

### Flujo Bank Analyst

```
1. GET /bank/queue                  → ve solicitudes pendientes
2. GET /applications/:id/full       → revisa expediente completo
3. POST /applications/:id/offers    → emite oferta (o rechaza)
```

### Flujo Cliente final (con código de seguimiento)

```
1. GET /applications/:id/full       (con X-Application-ID público)
2. GET /applications/:id/offers     → ve ofertas comparadas
3. POST /applications/:id/offers/:oid/select → elige una
```

---

## 🔍 ENDPOINTS QUE TODAVÍA NO EXISTEN — TODOs

Estos endpoints están en el spec del Sprint 6 pero **pueden no estar implementados aún en backend**. Si los necesitas y no responden 200, escribe en `_BLOCKER_<task_id>.md` y avisa a Cesar:

- `POST /api/v2/credit/applications/{id}/sign` — firma digital final
- `GET /api/v2/credit/applications/{id}/approval-letter.pdf` — carta de aprobación PDF
- `POST /api/v2/credit/notifications/whatsapp` — notificación WhatsApp

---

## 📚 SCHEMA REFERENCES

Los schemas Pydantic vivien en el backend en:
- `services/credit/schemas/applicant.py` — `ApplicantDataRD`, `ApplicantDataRDV2`
- `services/credit/schemas/vehicle.py` — `VehicleDataRD`, `VehicleDataRDV2`
- `services/credit/schemas/offer.py` — `BankOffer`

**TypeScript types correspondientes deben vivir en:** `nadakki-dashboard/types/credit/*.ts`

Si los TypeScript types no existen, créalos espejando los Pydantic models. Mantén la convención de nombres exacta para que las requests sean predecibles.

---

## 🧪 TESTING — CÓMO VALIDAR EN LOCAL

```powershell
# Levantar backend local (en otra ventana / pestaña)
cd C:\Users\cesar\Projects\nadakki-ai-suite\nadakki-ai-suite
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# Test desde frontend Next dev
cd C:\Users\cesar\Projects\nadakki-dashboard
npm run dev
# Abre http://localhost:3000
```

**Variable de entorno frontend para apuntar a local:**
```
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🎯 CIERRE

Este contrato es la fuente de verdad para todas las llamadas API que Cowork escriba.

**Si encuentras un endpoint que NO está documentado aquí pero existe en el código backend:**
1. NO lo uses ciegamente
2. Escríbelo en `_API_DISCREPANCIES.md`
3. Pídeme que actualice este contrato

**Si necesitas un endpoint que NO existe:**
1. NO lo inventes
2. Escríbelo en `_API_REQUEST.md`
3. Yo evalúo si Ramon lo puede agregar al backend
