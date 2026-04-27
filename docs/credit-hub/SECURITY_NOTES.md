# Credit Hub Security Notes

## Backend Actor Role Enforcement

Step 0 inspection found that the Credit Hub applications REST bridge validates
`X-Actor-Role` as one of `dealer | bank | customer | admin`, but it does not
currently enforce role-based access control for:

- `POST /api/v1/sic/credit-applications`
- `GET /api/v1/sic/credit-applications`
- `GET /api/v1/sic/credit-applications/{application_id}`

Frontend Fase 1 therefore includes a permission matrix and a defensive mutation
gate that blocks dashboard `viewer` users from `POST | PUT | PATCH | DELETE`
through `chFetch`.

This is not a substitute for backend authorization. Before production, backend
RBAC should enforce create/list/detail permissions server-side.

## Idempotency

The frontend sends `Idempotency-Key` on mutations. The current applications
bridge does not consume/replay this key, so duplicate submits can still create
multiple applications if the backend receives multiple POST requests.

Dealer Portal UX should prevent double-submits, and backend idempotency should
be added before high-volume production usage.
