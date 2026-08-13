# CONTRATOS VERIFICADOS POR EJECUCIÓN

**REGLA**: Antes de llamar a un endpoint nuevo, leer su schema del `openapi.json`. No adivinar nombres de campo.

Estos contratos costaron 3+ corridas cada uno para identificar los campos correctos.

---

## POST /api/v1/admin/tenants

**Status**: 201  
**Verificado contra**: Producción `https://api.nadakki.com` (git_sha: 68f0f1c0c04c)

### Request Body
```json
{
  "tenant_name": "QA E2E <timestamp>",
  "slug": "qa-e2e-<timestamp>",
  "institution_type": "bank",
  "plan": "enterprise",
  "subscribed_cores": ["credit"],
  "admin_email": "admin@qa-e2e-<timestamp>.com",
  "admin_password": "<secure-password>",
  "lender_config": {
    "lender_code": "pilot",
    "adapter_type": "pilot",
    "priority": 100,
    "config": {}
  },
  "external_ref": "qa-e2e-<timestamp>"
}
```

### Response Body
```json
{
  "tenant_id": "uuid",
  "admin_user_id": "uuid",
  "slug": "qa-e2e-<timestamp>",
  "checks": {
    "tenant_created": "ok",
    "admin_user_created": "ok",
    "lender_assignment": "ok",
    "rls_validated": true,
    ...
  }
}
```

### Notas
- Todos los campos son **REQUERIDOS**
- `lender_config.adapter_type` debe coincidir con `lender_code`
- Sin trailing commas en JSON (JavaScript las permite, backend no)

---

## POST /api/v1/admin/dealers

**Status**: 201  
**Verificado contra**: Producción `https://api.nadakki.com` (git_sha: 68f0f1c0c04c)

### Request Body
```json
{
  "institution_tenant_id": "<tenant_id del paso anterior>",
  "dealer_name": "Dealer QA <timestamp>",
  "dealer_slug": "dealer-<timestamp>",
  "contact_email": "contacto@dealer-<timestamp>.com",
  "admin_email": "dealer@dealer-<timestamp>.com",
  "admin_password": "<secure-password>",
  "lender_access": [
    {
      "lender_code": "pilot"
    }
  ]
}
```

### Response Body
```json
{
  "dealer_id": "uuid",
  "dealer_admin_user_id": "uuid",
  "checks": {
    "dealer_created": "ok",
    "admin_user_created": "ok",
    ...
  }
}
```

### Notas Críticas
- **Campo**: `institution_tenant_id` (NO `tenant_id`)
- **Campo**: `dealer_slug` (NO `slug`)
- **Ambos emails requeridos**: `contact_email` Y `admin_email`
- **`lender_access`**: Array de objetos con SOLO `lender_code`
  - ❌ NO incluir `enabled`, `priority`, ni UUIDs
  - ❌ Enviar UUID vacío causa: `invalid input syntax for type uuid: ""`

---

## POST /api/v2/credit/applications

**Status**: 201  
**Verificado contra**: Producción (dealer token)

### Request Body
```json
{
  "application_payload": {
    "applicant": {
      "cedula": "40227099500X",
      "nombre_completo": "Juan Pérez",
      "fecha_nacimiento": "1990-01-01",
      "ingreso_mensual": 50000,
      "telefono": "8095550100"
    },
    "vehicle": {
      "marca": "Toyota",
      "modelo": "Corolla",
      "year": 2023,
      "precio_venta": 700000
    },
    "financial": {
      "requested_amount": 600000,
      "down_payment": 100000,
      "term_months": 48
    }
  }
}
```

### Response Body
```json
{
  "application_id": "uuid",
  "state": "SUBMITTED"
}
```

### Notas Críticas
- **Root key**: `application_payload` envuelve TODO
- ❌ Enviar `applicant`, `vehicle`, `financial` en root causa 422:
  - "Field required" para `application_payload`
  - "Extra inputs are not permitted" para los campos sueltos

---

## POST /api/v2/credit/applications/{id}/claim

**Status**: 200  
**Verificado contra**: Producción (bank token)

### Request Body
```json
{
  "analyst_id": "<user_id del analista>"
}
```

### Response Body
```json
{
  "success": true,
  "claimed_by": "uuid",
  "claimed_at": "2026-08-13T20:00:00Z"
}
```

### Notas Críticas
- **`analyst_id`**: Obtener de `GET /api/v2/auth/me`
  - ⚠️ El `user_id` está **ANIDADO**: `me.user.id` (NO en root `me.id`)
- Debe llamarse **ANTES** de `POST .../decide`
- Si no se reclama primero: 403 `not_claimed`

---

## POST /api/v2/credit/applications/{id}/decide

**Status**: 200  
**Verificado contra**: Producción (bank token)

### Request Body — APPROVE
```json
{
  "decision_type": "APPROVE",
  "notes": "Aprobado sin condiciones"
}
```

### Request Body — REJECT
```json
{
  "decision_type": "REJECT",
  "notes": "Ingreso insuficiente"
}
```

### Request Body — COUNTER (Contrapropuesta)
```json
{
  "decision_type": "COUNTER",
  "notes": "Oferta ajustada por DTI",
  "counter_terms": {
    "amount": 500000,
    "term_months": 60,
    "down_payment": 150000,
    "interest_rate": 0.14
  }
}
```

### Response Body
```json
{
  "success": true,
  "decision": "COUNTER",
  "application_state": "COUNTER_OFFER"
}
```

### Notas Críticas
- **`decision_type`**: MAYÚSCULAS — `APPROVE`, `REJECT`, `COUNTER`
- **`counter_terms`** requerido si `decision_type === "COUNTER"`
  - `down_payment`: monto en PESOS (NO porcentaje)
  - `interest_rate`: PORCENTAJE ENTERO (17.25 = 17.25%, NO 0.1725)
    - Backend guarda lo que recibe sin interpretar
    - Enviar 0.135 resulta en tasa del 0.135% en auditoría (defecto P1)
    - Validar: 1 ≤ interest_rate ≤ 100
- ❌ Frontend anterior enviaba `down_payment_pct` → causaba 422
- Debe llamarse **DESPUÉS** de `claim`

---

## POST /api/v2/auth/login

**Status**: 200  
**Verificado contra**: Producción (múltiples corridas)

### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword"
}
```

### Response Body
```json
{
  "token": "jwt-token-here",
  "user": { ... },
  "tenant": { ... }
}
```

### Notas Críticas
- **Body acepta SOLO `email` y `password`**
- ❌ Incluir `tenant_slug` u otro campo → 401 Invalid credentials
- El tenant sale del JWT decodificado, NO del body
- Identificado después de 3+ corridas con 401 por incluir `tenant_slug`

---

## Historial de Correcciones

| Endpoint | Error Inicial | Causa | Corrida que lo detectó |
|----------|---------------|-------|------------------------|
| `POST /tenants` | 500 UUID error | Trailing commas en JSON | RUN 1-5 intermitente |
| `POST /dealers` | 422 Field required | Nombres de campo incorrectos | RUN 1 (shell 219326) |
| `POST /dealers` | 500 UUID error | `lender_access` con UUID vacío | RUN 2-4 (múltiples) |
| `POST /applications` | 422 Field required | Campos no envueltos en `application_payload` | RUN 1 (shell 911074) |
| `POST /decide` | 409 Validation | `down_payment_pct` en lugar de `down_payment` | Detectado pre-E2E |

---

## Lecciones Aprendidas

1. **NUNCA adivinar nombres de campo** — leer OpenAPI schema primero
2. **JSON estricto** — sin trailing commas (JS las acepta, backend no)
3. **Validar payloads con ejecución** — no confiar solo en lectura de código
4. **UUIDs vacíos son fatales** — backend no valida, crashea en SQL
5. **Campos anidados** — verificar estructura exacta (`me.user.id` no `me.id`)
