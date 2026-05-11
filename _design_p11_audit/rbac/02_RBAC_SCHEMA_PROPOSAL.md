# 02 — RBAC Dynamic Schema Proposal

**Spec source:** `rbac-audit-prompt.txt` FASE 2.
**Audit input:** `01_CURRENT_AUTH_STATE.md` (20 gaps, 2 critical).
**Decision:** Build the new RBAC tables as **additive** to the existing schema, then deprecate the legacy `module_catalog` / `tenant_modules` in a follow-up sprint.

This document specifies:
- The 5 new tables (DDL, indexes, FKs, RLS).
- How they relate to existing tables (`tenants`, `users`, `module_catalog`, `tenant_modules`).
- Pydantic schemas (request/response shapes).
- SQLAlchemy models.
- An ER diagram (ASCII).
- Seed data plan (cores + role templates + permissions).

The actual code lives in three companion files:
- `migrations/versions/012_rbac_dynamic.py` — Alembic migration (upgrade + downgrade).
- `models/rbac.py` — SQLAlchemy + Pydantic models.
- `scripts/rbac_seed_data.py` — Idempotent seed (cores + roles + permissions).

---

## 2.1 Design decisions (deviations from prompt spec)

| # | Spec said | We propose | Why |
|---|---|---|---|
| D1 | Migration filename `YYYYMMDD_rbac_dynamic.py` | `012_rbac_dynamic.py` | Matches existing convention (`001_…` through `011_…`). Alembic auto-discovers either; using `NNN_` keeps the directory readable. |
| D2 | `platform_cores` as a new table | New table, **AND** seed it from existing `module_catalog` slugs to keep one source of truth | Avoids two parallel core registries. Future cleanup migration can drop `module_catalog`. |
| D3 | `tenant_subscriptions (tenant_id, core_name)` composite PK | Same composite PK + add a unique constraint reusing existing `tenant_modules` semantics where possible | `tenant_modules` data needs a migration path. We add a `legacy_module_row_id` column to `tenant_subscriptions` for backfill traceability (dropped after Sprint 2). |
| D4 | `user_tenant_roles.user_id UUID` | `user_id INTEGER REFERENCES users(id)` | `users.id` is INT autoincrement today (002). Converting to UUID is a destructive migration with FK fan-out. Defer to a separate sprint. |
| D5 | `tenants.id` referenced as UUID | Cast TEXT→UUID on the new FKs using `tenants.id::uuid` only where the existing tenant data is UUID-shaped | `tenants.id` is declared TEXT in 001 but later migrations cast to UUID. We accept the drift and use TEXT for the new FK column, with a runtime check. |
| D6 | Schema-only; no `users` table changes | **Also add `password_hash`, `is_active`, `mfa_enabled`, `last_login_at` to `users` in the same migration** | Otherwise the RBAC schema is half-built (login still impossible against the DB). Gap G03 from FASE 1. |
| D7 | One migration | One migration, six logical blocks (users extension + 5 new tables + indexes + RLS + seed FKs) | Atomic upgrade/downgrade. |

---

## 2.2 ER diagram (ASCII)

```
                       ┌─────────────────────────────┐
                       │  tenants  (existing, 001)   │
                       │  ─────────────────────────  │
                       │  id            TEXT  PK     │◀──────────┐
                       │  name          TEXT         │           │
                       │  slug          TEXT  UNIQUE │           │
                       │  plan          TEXT         │           │
                       │  created_at    TIMESTAMPTZ  │           │
                       └─────────────────────────────┘           │
                                       ▲                         │
                                       │                         │
        ┌──────────────────────────────┴──────────────┐          │
        │                                             │          │
        │                                             │          │
┌───────────────────────┐                ┌─────────────────────────────┐
│ users (existing,002)  │                │  tenant_subscriptions (NEW) │
│ ───────────────────── │                │  ──────────────────────────│
│ id              INT PK│◀─┐             │  tenant_id      TEXT  FK    │
│ tenant_id       TEXT  │  │             │  core_name      VARCHAR(50) │
│ email           TEXT  │  │             │  plan_tier      VARCHAR(20) │
│ role            TEXT  │  │             │  started_at     TIMESTAMPTZ │
│ password_hash   TEXT⚡│  │             │  expires_at     TIMESTAMPTZ │
│ is_active       BOOL⚡│  │             │  status         VARCHAR(20) │
│ mfa_enabled     BOOL⚡│  │             │  monthly_cost_usd NUMERIC   │
│ last_login_at   TS  ⚡│  │             │  legacy_module_row_id UUID  │
└───────────────────────┘  │             │  PK (tenant_id, core_name)  │
   (⚡ = added in 012)     │             └─────────────────────────────┘
                           │                          │
                           │                          ▼ (FK core_name)
                           │             ┌─────────────────────────────┐
                           │             │  platform_cores  (NEW)      │
                           │             │  ──────────────────────────│
                           │             │  core_name     VARCHAR(50)  PK
                           │             │  display_name  VARCHAR(100) │
                           │             │  icon          VARCHAR(50)  │
                           │             │  enabled       BOOLEAN      │
                           │             │  version       VARCHAR(20)  │
                           │             │  description   TEXT         │
                           │             │  category      VARCHAR(64)  │
                           │             │  created_at, updated_at TS  │
                           │             └─────────────────────────────┘
                           │                          ▲
                           │                          │ (FK core_name)
                           │             ┌─────────────────────────────┐
                           │             │  platform_role_templates    │
                           │             │  (NEW)                      │
                           │             │  ──────────────────────────│
                           │             │  id              UUID PK    │
                           │             │  core_name       VARCHAR(50)│◀──┐
                           │             │  role_key        VARCHAR(50)│   │
                           │             │  display_name    VARCHAR    │   │
                           │             │  description     TEXT       │   │
                           │             │  is_system       BOOLEAN    │   │
                           │             │  is_tenant_specific BOOLEAN │   │
                           │             │  tenant_id       TEXT FK nul│   │
                           │             │  created_at, updated_at TS  │   │
                           │             │  UNIQUE (core_name,         │   │
                           │             │          role_key,          │   │
                           │             │          tenant_id)         │   │
                           │             └─────────────────────────────┘   │
                           │                          ▲                     │
                           │                          │ (FK role_template_id)
                           │             ┌─────────────────────────────┐   │
                           │             │ platform_role_permissions   │   │
                           │             │  (NEW)                      │   │
                           │             │  ──────────────────────────│   │
                           │             │  id                UUID PK  │   │
                           │             │  role_template_id  UUID FK  │   │
                           │             │  resource          VARCHAR  │   │
                           │             │  action            VARCHAR  │   │
                           │             │  granted           BOOLEAN  │   │
                           │             │  scope             VARCHAR  │   │
                           │             │  created_at        TS       │   │
                           │             │  UNIQUE(role_template_id,   │   │
                           │             │         resource, action)   │   │
                           │             └─────────────────────────────┘   │
                           │                                                │
                           │             ┌─────────────────────────────┐   │
                           │             │  user_tenant_roles (NEW)    │   │
                           │             │  ──────────────────────────│   │
                           └─────────────│  user_id      INT FK        │   │
                                         │  tenant_id    TEXT FK       │   │
                                         │  core_name    VARCHAR(50) FK│   │
                                         │  role_template_id UUID  FK  │───┘
                                         │  granted_by   INT (user FK) │
                                         │  granted_at   TIMESTAMPTZ   │
                                         │  expires_at   TIMESTAMPTZ   │
                                         │  active       BOOLEAN       │
                                         │  id           UUID PK       │
                                         │  UNIQUE (user_id, tenant_id,│
                                         │          core_name,         │
                                         │          role_template_id)  │
                                         └─────────────────────────────┘
```

Read direction: a **user** in a **tenant** is granted a **role_template** scoped to a **core**; that role_template carries **permissions** as `(resource, action, granted, scope)` triplets. The tenant must have a `tenant_subscription` to the core for any of it to take effect at request time.

---

## 2.3 Table-by-table DDL (Postgres dialect)

> Full Alembic version with `upgrade()`/`downgrade()` is in `migrations/versions/012_rbac_dynamic.py`. This section is the human-readable spec.

### platform_cores

```sql
CREATE TABLE platform_cores (
    core_name      VARCHAR(50)  PRIMARY KEY,
    display_name   VARCHAR(100) NOT NULL,
    icon           VARCHAR(50),
    enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    version        VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
    description    TEXT         NOT NULL DEFAULT '',
    category       VARCHAR(64)  NOT NULL DEFAULT 'core',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_cores_enabled ON platform_cores (enabled) WHERE enabled = TRUE;
```

**No RLS** — this is shared platform reference data.

### platform_role_templates

```sql
CREATE TABLE platform_role_templates (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    core_name           VARCHAR(50)  NOT NULL REFERENCES platform_cores(core_name) ON DELETE CASCADE,
    role_key            VARCHAR(50)  NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    description         TEXT         NOT NULL DEFAULT '',
    is_system           BOOLEAN      NOT NULL DEFAULT TRUE,
    is_tenant_specific  BOOLEAN      NOT NULL DEFAULT FALSE,
    tenant_id           TEXT         REFERENCES tenants(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_role_template UNIQUE (core_name, role_key, tenant_id),
    CONSTRAINT chk_tenant_specific CHECK (
        (is_tenant_specific = FALSE AND tenant_id IS NULL) OR
        (is_tenant_specific = TRUE  AND tenant_id IS NOT NULL)
    )
);

CREATE INDEX idx_role_templates_core_system ON platform_role_templates (core_name) WHERE is_system = TRUE;
CREATE INDEX idx_role_templates_tenant ON platform_role_templates (tenant_id) WHERE tenant_id IS NOT NULL;
```

**RLS:** enabled with policy `tenant_isolation` for `is_tenant_specific = TRUE` rows; system rows visible to all.

### platform_role_permissions

```sql
CREATE TABLE platform_role_permissions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    role_template_id    UUID         NOT NULL REFERENCES platform_role_templates(id) ON DELETE CASCADE,
    resource            VARCHAR(100) NOT NULL,
    action              VARCHAR(50)  NOT NULL,
    granted             BOOLEAN      NOT NULL DEFAULT TRUE,
    scope               VARCHAR(20)  NOT NULL DEFAULT 'tenant',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT uq_role_perm UNIQUE (role_template_id, resource, action),
    CONSTRAINT chk_scope CHECK (scope IN ('tenant', 'self', 'core', 'platform'))
);

CREATE INDEX idx_perm_by_role ON platform_role_permissions (role_template_id);
CREATE INDEX idx_perm_lookup  ON platform_role_permissions (role_template_id, resource, action) WHERE granted = TRUE;
```

**No RLS** — permissions are reference data attached to (potentially tenant-specific) role templates; isolation is enforced at the role_template level.

### tenant_subscriptions

```sql
CREATE TABLE tenant_subscriptions (
    tenant_id              TEXT         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    core_name              VARCHAR(50)  NOT NULL REFERENCES platform_cores(core_name) ON DELETE RESTRICT,
    plan_tier              VARCHAR(20)  NOT NULL DEFAULT 'starter',
    started_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at             TIMESTAMPTZ,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'active',
    monthly_cost_usd       NUMERIC(10,2) NOT NULL DEFAULT 0,
    legacy_module_row_id   UUID,          -- backfilled from tenant_modules.id, dropped after Sprint 2
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, core_name),
    CONSTRAINT chk_status CHECK (status IN ('active', 'suspended', 'cancelled', 'trial', 'past_due')),
    CONSTRAINT chk_plan   CHECK (plan_tier IN ('starter', 'professional', 'enterprise', 'custom'))
);

CREATE INDEX idx_tenant_subs_active ON tenant_subscriptions (tenant_id) WHERE status = 'active';
CREATE INDEX idx_tenant_subs_expiring ON tenant_subscriptions (expires_at) WHERE status = 'active' AND expires_at IS NOT NULL;
```

**RLS:** enabled, policy `tenant_isolation` using `app.tenant_id` (TEXT comparison).

### user_tenant_roles

```sql
CREATE TABLE user_tenant_roles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id           TEXT        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    core_name           VARCHAR(50) NOT NULL REFERENCES platform_cores(core_name) ON DELETE RESTRICT,
    role_template_id    UUID        NOT NULL REFERENCES platform_role_templates(id) ON DELETE RESTRICT,
    granted_by          INTEGER     REFERENCES users(id) ON DELETE SET NULL,
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ,
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_user_tenant_role UNIQUE (user_id, tenant_id, core_name, role_template_id)
);

CREATE INDEX idx_user_tenant_roles_user_tenant ON user_tenant_roles (user_id, tenant_id) WHERE active = TRUE;
CREATE INDEX idx_user_tenant_roles_role ON user_tenant_roles (role_template_id) WHERE active = TRUE;
CREATE INDEX idx_user_tenant_roles_user ON user_tenant_roles (user_id) WHERE active = TRUE;
```

**RLS:** enabled, policy `tenant_isolation` using `app.tenant_id`.

### users — additive columns

```sql
ALTER TABLE users
    ADD COLUMN password_hash    TEXT,
    ADD COLUMN is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN mfa_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN last_login_at    TIMESTAMPTZ;

CREATE INDEX idx_users_email_active ON users (LOWER(email)) WHERE is_active = TRUE;
```

`users.role` (legacy varchar) is **kept untouched** during this migration to avoid breaking the ~hundreds of `X-Role` reads. It will be deprecated in a follow-up migration once `user_tenant_roles` is the source of truth.

---

## 2.4 Seed data plan

`scripts/rbac_seed_data.py` is **idempotent** (`ON CONFLICT DO NOTHING`) and seeds:

### Cores (4 active + 4 future placeholders)

| core_name | display_name | category | enabled | version |
|---|---|---|---|---|
| `credit` | Credit Core | core | TRUE | 2.0.0 |
| `legal` | Legal Core | core | TRUE | 1.0.0 |
| `marketing` | Marketing Engine | marketing | TRUE | 1.0.0 |
| `sic` | SIC (Credit Intelligence) | core | TRUE | 1.0.0 |
| `accounting` | Accounting Core | core | FALSE | 0.1.0 |
| `engineering` | Engineering Core | core | FALSE | 0.1.0 |
| `design` | Design Core | core | FALSE | 0.1.0 |
| `salud` | Healthcare Core | core | FALSE | 0.1.0 |

(Names match existing `module_catalog.slug` values so backfill is trivial.)

### Role templates (per core)

| core | role_key | display_name | is_system |
|---|---|---|---|
| credit | `dealer` | Dealer | TRUE |
| credit | `banker` | Banker | TRUE |
| credit | `customer` | Customer | TRUE |
| credit | `credit_admin` | Credit Admin | TRUE |
| credit | `auditor` | Credit Auditor | TRUE |
| legal | `lawyer` | Lawyer | TRUE |
| legal | `paralegal` | Paralegal | TRUE |
| legal | `client` | Legal Client | TRUE |
| legal | `legal_admin` | Legal Admin | TRUE |
| marketing | `marketer` | Marketer | TRUE |
| marketing | `designer` | Designer | TRUE |
| marketing | `marketing_admin` | Marketing Admin | TRUE |
| sic | `analyst` | SIC Analyst | TRUE |
| sic | `compliance_officer` | Compliance Officer | TRUE |
| sic | `sic_admin` | SIC Admin | TRUE |
| (cross) | `tenant_admin` | Tenant Admin | TRUE — `core_name='platform'` |
| (cross) | `platform_superadmin` | Platform Superadmin | TRUE — `core_name='platform'` |
| (cross) | `billing_admin` | Billing Admin | TRUE — `core_name='platform'` |

> The three cross-cutting roles need a `platform` pseudo-core. The seed script inserts a `platform_cores` row with `core_name='platform', enabled=TRUE, category='platform'` first, so the FK constraint holds.

### Permissions (sample)

Permissions follow `(resource, action, scope)` triplets. The seed script ships a baseline; below are illustrative entries — full list in `scripts/rbac_seed_data.py`.

| role | resource | action | scope |
|---|---|---|---|
| credit.dealer | `credit.application` | `create` | tenant |
| credit.dealer | `credit.application` | `read` | self |
| credit.dealer | `credit.application` | `update` | self |
| credit.banker | `credit.application` | `read` | tenant |
| credit.banker | `credit.offer` | `create` | tenant |
| credit.credit_admin | `credit.*` | `*` | tenant |
| credit.auditor | `credit.application` | `read` | tenant |
| credit.auditor | `credit.audit_log` | `read` | tenant |
| platform.tenant_admin | `tenant.user` | `*` | tenant |
| platform.tenant_admin | `tenant.subscription` | `read` | tenant |
| platform.platform_superadmin | `*` | `*` | platform |
| platform.billing_admin | `tenant.subscription` | `*` | platform |

Wildcards (`*`) are interpreted at the middleware/check layer; they are valid string literals in the DB.

---

## 2.5 Pydantic schemas

Defined in `models/rbac.py`. Public-facing shapes:

```python
class CoreOut(BaseModel):
    core_name: str
    display_name: str
    icon: str | None
    enabled: bool
    version: str
    description: str
    category: str

class RoleTemplateOut(BaseModel):
    id: UUID
    core_name: str
    role_key: str
    display_name: str
    description: str
    is_system: bool
    is_tenant_specific: bool
    tenant_id: str | None

class PermissionOut(BaseModel):
    resource: str
    action: str
    granted: bool
    scope: Literal["tenant", "self", "core", "platform"]

class TenantSubscriptionOut(BaseModel):
    tenant_id: str
    core_name: str
    plan_tier: Literal["starter", "professional", "enterprise", "custom"]
    started_at: datetime
    expires_at: datetime | None
    status: Literal["active", "suspended", "cancelled", "trial", "past_due"]
    monthly_cost_usd: Decimal

class UserRoleOut(BaseModel):
    id: UUID
    user_id: int
    tenant_id: str
    core_name: str
    role: RoleTemplateOut
    granted_at: datetime
    expires_at: datetime | None
    active: bool

class GrantRoleRequest(BaseModel):
    user_id: int
    tenant_id: str
    core_name: str
    role_template_id: UUID
    expires_at: datetime | None = None
```

These are deliberately shallow — joins are resolved by the service layer, not by nested ORM-style schemas, to keep API responses cache-friendly.

---

## 2.6 Migration risk register

(Carried forward from FASE 1, now resolved or mitigated at this layer.)

| FASE 1 ref | Risk | Mitigation in this proposal |
|---|---|---|
| R5 | `tenants.id` TEXT vs UUID drift | New FK columns use TEXT (`tenants.id`'s declared type). Matches existing pattern in `oauth_tokens`, `users`. |
| R6 | `users.id` INT vs proposed UUID | We use `INTEGER REFERENCES users(id)`. No destructive change. |
| R7 | `module_catalog` core slugs | Seed script reads existing `module_catalog` slugs and reuses identical strings. |
| R8 | `tenant_modules` backfill | `tenant_subscriptions.legacy_module_row_id` retains traceability. Backfill SQL in seed script. |
| G14 | RLS variable naming drift | `tenant_subscriptions` and `user_tenant_roles` use **`app.tenant_id`** (TEXT-comparable, matches `tenants.id` type). |

---

## 2.7 Files generated

| File | Path | Purpose |
|---|---|---|
| Migration | `nadakki-ai-suite/migrations/versions/012_rbac_dynamic.py` | Alembic upgrade/downgrade |
| Models | `nadakki-ai-suite/models/rbac.py` | SQLAlchemy ORM + Pydantic |
| Seed | `nadakki-ai-suite/scripts/rbac_seed_data.py` | Idempotent seeder |
| This doc | `nadakki-dashboard/_design_p11_audit/rbac/02_RBAC_SCHEMA_PROPOSAL.md` | Architectural rationale |

**Migration NOT executed.** Only files are created.
