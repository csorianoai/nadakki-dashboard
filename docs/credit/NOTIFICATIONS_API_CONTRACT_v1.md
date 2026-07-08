# NOTIFICATIONS_API_CONTRACT_v1

Contract-first spec for Credit Hub in-app notifications (dealer + bank shells).

## Feature flag

- `NEXT_PUBLIC_CH_NOTIFICATIONS=off` (default) — bell hidden, no fetch.
- `NEXT_PUBLIC_CH_NOTIFICATIONS=true` — enable polling client.

## Endpoints (target — backend PR-DB-NOTIF-01)

### GET `/api/v2/credit/notifications`

Query: `?unread_only=true` (optional)

```json
{
  "tenant_id": "uuid",
  "notifications": [
    {
      "id": "uuid",
      "title": "Decisión registrada",
      "body": "Solicitud d3b05eed-… aprobada",
      "read": false,
      "created_at": "2026-07-08T12:00:00Z",
      "application_id": "uuid",
      "category": "decision"
    }
  ],
  "unread_count": 1
}
```

### PATCH `/api/v2/credit/notifications/{id}/read`

```json
{ "read": true }
```

## Frontend behavior

| Response | UI |
|----------|-----|
| 200 + items | Bell visible, unread badge, dropdown list |
| 404 / flag off | Bell **hidden** (no crash, no synthetic rows) |
| 401 | Redirect login (existing chFetch) |

## Polling

- Interval: 30s when flag on and tenant resolved.
- Pause when document hidden (optional v1.1).

## Emitters (backend)

- Application state change, bank decide, offer accept, stipulation created.

**Probe 2026-07-08:** `GET /api/v2/credit/notifications` → **404** on Render. FE ships flag-gated client only.
