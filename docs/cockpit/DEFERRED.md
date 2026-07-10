# Network Cockpit — Deferred Backend Endpoints

Endpoints expected by the cockpit UI. When missing, UI shows **DEMO badge** + example data.

| Endpoint | Phase | Notes |
|----------|-------|-------|
| `GET /observability/v1/network/health` | F1 | Network health row |
| `GET /observability/v1/cores/summary` | F1 | Core cards grid |
| `GET /observability/v1/activity` | F1 | Activity feed |
| `GET /observability/v1/alerts` | F1 | Alerts panel |
| `GET /credit-hub/v1/dashboard` | F2 | 9 KPIs + chart series |
| `GET /credit-hub/v1/requests` | F2 | Global queue + filters |
| `GET /credit-hub/v1/compliance/aml` | F2 | AML panel |
| `GET /credit-hub/v1/dealers/ranking` | F2 | Top dealers |
| `GET /credit-hub/v1/audit-trail` | F2 | Audit list |
| `GET /tenant-admin/v1/tenants` | F3 | Tenant table + topbar selector |
| `POST/PATCH /tenant-admin/v1/tenants` | F3 | Wizard create/edit |
| `POST /tenant-admin/v1/tenants/{id}/status` | F3 | Suspend/reactivate |
| `GET /tenant-admin/v1/plans` | F3 | Wizard step 3 |
| `GET /tenant-admin/v1/cores/registry` | F3 | Core checkboxes |
| `GET /auth-users/v1/users` | F3 | Users table |
| `GET /auth-users/v1/roles` | F3 | Role select |
| `POST /auth-users/v1/users` | F3 | Create user |
| `POST /auth-users/v1/users/{id}/password-reset` | F3 | Reset token |
| `GET /observability/v1/usage` | F3 | Subscription usage bars |

**Existing tenant-scoped (wired for export only):** `GET /api/v2/credit/bank/export/queue.xlsx`
