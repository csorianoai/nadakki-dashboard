# PR: SMS OTP — connect verification to real backend accept endpoint

## Estado anterior

The SMS OTP flow in `SMSOTPConsentMethod.tsx` had a stub for verification:

```tsx
// Verificación final del OTP queda para 7D / endpoint público de accept
onClick={() => onVerifyStub?.()}
```

`onVerifyStub` was a no-op callback threaded through `ConsentSection` -> `RemoteConsentSelector` -> `SMSOTPConsentMethod`. Clicking "Verificar codigo" would call `onPatch({ consent_method: "SMS_OTP", consent_accepted_at: ... })` in ConsentSection — simulating acceptance without ever validating the OTP against the backend.

The `initiate()` call was real (SMS was sent), but `accept()` was never called. The token from `initiate()` was not saved.

## Backend already existed (not modified)

All 4 consent endpoints were already deployed and tested:

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/v2/credit/consent/{app_id}/initiate` | JWT (staff) | Generate OTP, send SMS |
| `POST /api/v2/credit/consent/{token}/accept` | Public (token IS auth) | Verify OTP, record consent |
| `GET /api/v2/credit/consent/{token}/status` | Public | Poll consent status |
| `GET /api/v2/credit/consent/application/{app_id}/history` | JWT (staff) | Audit trail |

Backend repo (`nadakki-ai-suite`) was **not touched**. Existing backend tests:
- `tests/services/credit/consent/test_remote_consent_service.py`
- `tests/routers/test_consent_router.py`
- `tests/security/test_consent_router_p0.py`

## Props design decision

**Chose: replace `onVerifyStub` with `onComplete` + thread `consentsAccepted`/`fullName` from parent.**

Rationale for minimum blast radius:
- `onComplete` matches the exact same signature used by `EmailConsentMethod`, `WhatsAppConsentMethod`, and `SelfieConsentMethod` — `(data: { method: string; auditHash?: string }) => void`.
- `consentsAccepted: string[]` is built in `ConsentSection` from the existing checkbox state (already rendered in the remote path).
- `fullName` + `onFullNameChange` are threaded from `consent_signature_full_name` in the wizard state. A local name input is rendered in the SMS verification section.
- `onVerifyStub` / `onSmsVerifyStub` are completely removed from all 3 files — no dead props remain.

This aligns SMS OTP with all other remote methods: initiate sends the message, verification calls `accept()`, success fires `onComplete({ method, auditHash })`.

## Files changed

| File | Change |
|------|--------|
| `lib/credit-hub/api/consent-client.ts` | Added `accept()` method, `ConsentAcceptPayload`, `ConsentAcceptResponse` types |
| `components/.../SMSOTPConsentMethod.tsx` | Save token from initiate; replace stub with real `api.accept()` call; add verify loading/error states; add fullName input; add resend button |
| `components/.../RemoteConsentSelector.tsx` | Remove `onSmsVerifyStub` prop; add `consentsAccepted`, `fullName`, `onFullNameChange` props; pass `onRemoteComplete` as `onComplete` to SMS |
| `components/.../ConsentSection.tsx` | Remove `onSmsVerifyStub` handler; build `consentsAccepted[]` from checkbox state; pass `fullName`/`onFullNameChange` through |
| `tests/.../SMSOTPConsentMethod.test.tsx` | Rewritten: 8 tests covering send, verify success, invalid OTP error, expired OTP error, fullName required, no stub references |
| `tests/.../RemoteConsentSelector.test.tsx` | Updated props: removed `onSmsVerifyStub`, added `consentsAccepted`/`fullName`/`onFullNameChange`, added `useTranslations` mock |

## Tests executed

| Gate | Result |
|------|--------|
| `npx tsc --noEmit` | PASS (0 errors) |
| `npx next build --webpack` | PASS |
| SMSOTPConsentMethod tests (8) | PASS |
| RemoteConsentSelector tests (3) | PASS |

## Compliance risk

| | Before | After |
|-|--------|-------|
| OTP verification | Visual-only (`onPatch` sets `consent_accepted_at` without backend validation) | Real `accept()` call — backend validates OTP hash, records IP/user_agent, returns `audit_hash` |
| Consent record | No audit hash from backend | `audit_hash` stored in wizard state via `onComplete` |
| Error handling | Silent (no-op callback) | Backend errors displayed: "Invalid OTP", "No pending OTP found or expired" |
| Resend | Not possible after first send | Resend button resets state, allows new `initiate()` |

**Risk before:** HIGH — consent could be recorded as accepted without any OTP validation. A dealer could skip verification entirely.

**Risk after:** LOW — OTP must match the SHA-256 hash stored by the backend. Invalid/expired codes show explicit errors. `audit_hash` provides non-repudiation.

## Technical risk

**LOW** — Changes are isolated to 4 source files + 2 test files. No new dependencies. No schema changes. The `accept()` endpoint is public (no auth header needed — the token itself is the authorization), matching the existing `getStatus()` pattern. The `includeTenant: false` flag is correctly set.
