# ONBOARDING CONTRACTS

Status: contract draft for ONB-A2Z consumers.

This document defines the backend contracts for Activation OS packets B, C and E.
It does not claim that the runtime implementation is complete.

## Lifecycle States

`tenants.status` is the single source of truth. Do not create `activation_state`.

Allowed Activation OS states:

```text
CREATED
PROFILE_INCOMPLETE
CONFIGURATION
VALIDATION
REJECTED
REOPENED
READY_FOR_SANDBOX
READY_FOR_PRODUCTION
ACTIVE
SUSPENDED
```

Legacy status mapping for the migration proposal:

```text
active               -> ACTIVE
suspended            -> SUSPENDED
INACTIVE             -> SUSPENDED
PENDING_INTEGRATION  -> CONFIGURATION
trial                -> READY_FOR_SANDBOX
```

`DEFAULT 'ACTIVE'` exists only to preserve already-operational tenants during
schema migration. Any tenant created through public onboarding must set
`status='CREATED'` explicitly.

## Legal Transitions

Any transition not listed here is illegal and must return `409` without changing
the database.

| From | To | Actor |
|---|---|---|
| none | `CREATED` | public registration |
| `CREATED` | `PROFILE_INCOMPLETE` | institution |
| `PROFILE_INCOMPLETE` | `CONFIGURATION` | institution |
| `CONFIGURATION` | `VALIDATION` | institution |
| `VALIDATION` | `READY_FOR_SANDBOX` | Nadakki operator |
| `VALIDATION` | `REJECTED` | Nadakki operator |
| `REJECTED` | `REOPENED` | institution |
| `REOPENED` | `VALIDATION` | institution |
| `READY_FOR_SANDBOX` | `READY_FOR_PRODUCTION` | system, only when all production gates pass |
| `READY_FOR_PRODUCTION` | `ACTIVE` | institution launch |
| any state | `SUSPENDED` | Nadakki operator |
| `SUSPENDED` | reevaluated previous state | Nadakki operator |

Suspension stores `previous_state = tenants.status` before moving to
`SUSPENDED`. Reactivation must recalculate production gates. It must not restore
`ACTIVE` blindly.

Each accepted transition writes:

```text
tenant_id
from_state
to_state
actor_id
actor_role
reason
correlation_id
created_at
```

Transition audit also writes to the existing `audit_logs` system. Do not create a
second audit log system for ONB-A2Z.

## Readiness

Endpoint:

```text
GET /api/v2/institucion/readiness
```

Response shape:

```json
{
  "account_created": 0,
  "production_readiness": 0,
  "ai_optimization": 0,
  "dimensions": [
    {
      "name": "Identidad",
      "score": 0,
      "evidence": [],
      "missing": []
    }
  ]
}
```

Rules:

- Readiness is derived from database evidence.
- There is no `PUT` endpoint that accepts a client-provided percentage.
- Changing a real configuration row changes readiness on the next read.
- Checklist rows do not increase readiness unless the underlying evidence exists.
- Level 3 dimensions are displayed but do not count toward
  `production_readiness`.

Required dimensions:

```text
Identidad
Seguridad
Equipo
Lenders
Politicas
Documentos
Cumplimiento
Integraciones
```

## Production Gates

Endpoint:

```text
GET /api/v2/institucion/production-gates
```

Response shape:

```json
{
  "eligible": false,
  "gates": [
    {
      "name": "IDENTITY_VERIFIED",
      "status": "FAIL",
      "evidence": [],
      "blocking_reason": "identity_not_verified"
    }
  ]
}
```

Gate names:

```text
IDENTITY_VERIFIED
MFA_PRIVILEGED_USERS
LENDERS_CONFIGURED
CREDIT_POLICY_CONFIGURED
DOCUMENT_POLICY_CONFIGURED
COMPLIANCE_COMPLETE
CREDENTIALS_USABLE
OPERATIONAL_ROLES
CERTIFICATION_PASSED
```

`PRODUCTION_ELIGIBLE = true` only when every required gate is `PASS`.

`CERTIFICATION_PASSED` is defined by ONB-A but fed by ONB-E. Until ONB-E writes
evidence, this gate is `FAIL`.

Readiness never overrides gates. Certification never overrides gates.

Required proof case:

```text
CERTIFICATION   = PASS
READINESS_SCORE = 100
MFA_GATE        = FAIL
RESULT          = PRODUCTION_ELIGIBLE false
```

## Real Operations Guard

Primitive:

```python
def assert_real_operations_allowed(tenant_id: str) -> None:
    """Raise when tenant cannot execute real operations."""
```

Rule:

```text
REAL_OPERATIONS_ALLOWED =
    tenants.status == ACTIVE
    AND all_required_production_gates == PASS
```

`READY_FOR_PRODUCTION` means the system no longer blocks launch. It does not
allow real operations. Only `ACTIVE` with all gates passing allows them.

Operational endpoint error contract:

```json
{
  "error_code": "TENANT_NOT_PRODUCTION_ELIGIBLE",
  "correlation_id": "<uuid>"
}
```

Operational `403` responses must not include gate names, blocking reasons,
readiness data or internal onboarding model fields.

Activation workspace endpoints may return full gate diagnostics.

## Public Registration

Endpoint:

```text
POST /api/v2/onboarding/registro
```

Unauthenticated request fields:

```text
nombre_legal
rnc
email_admin
telefono
```

Rules:

- Normalize and validate RNC before writing.
- Duplicate RNC returns a generic response and does not reveal existence.
- Rate limit by IP and by normalized RNC.
- Public registration creates a tenant with `status='CREATED'`.
- Public registration does not create an active user or provisioning resources.
- Email verification token is required before human review.

## Verification Queue

Platform admin endpoints:

```text
GET  /api/v2/admin/onboarding/pendientes
GET  /api/v2/admin/onboarding/{tenant_id}
POST /api/v2/admin/onboarding/{tenant_id}/aprobar
POST /api/v2/admin/onboarding/{tenant_id}/rechazar
POST /api/v2/admin/onboarding/{tenant_id}/suspender
```

Only platform operators may approve, reject or suspend onboarding requests. A
tenant admin cannot approve any tenant, including its own.

Approval moves the tenant to `READY_FOR_SANDBOX`, records verifier metadata and
creates the institution admin user.

## Credential Vault

Credentials persist in `bank_credentials` through `CredentialsVault`. Do not
create a second credential table.

Endpoints:

```text
POST   /api/v2/institucion/credenciales
GET    /api/v2/institucion/credenciales
POST   /api/v2/institucion/credenciales/{id}/probar
DELETE /api/v2/institucion/credenciales/{id}
```

`GET` returns metadata only:

```text
provider
environment
created_at
updated_at
last_four
verification_status
last_tested_at
```

It never returns the secret.

Connection test statuses:

```text
VERIFICADO
FALLO
NO_VERIFICABLE
```

`NO_VERIFICABLE` in `LIVE` makes `CREDENTIALS_USABLE` fail.

Each test stores evidence without secrets:

```text
provider
environment
status
tested_at
tested_by
latency_ms
provider_reference
error_class
credential_version
```

## Certification

Certification proves that the configured workflow functions. It does not prove
that configuration is complete.

Certification result feeds the `CERTIFICATION_PASSED` production gate. It does
not directly enable production.

Mission data must be synthetic and explicitly marked. Certification must not
touch protected tenants or generate real decisions.
