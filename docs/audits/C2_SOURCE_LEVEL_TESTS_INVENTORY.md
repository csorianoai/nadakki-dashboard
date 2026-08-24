# C2: Source-Level Tests Inventory

**Audit Finding #13**: Tests que describen en vez de detectar

## Summary

Found **14 test files** with **~80+ source-level tests** that read source code and assert on strings instead of executing behavior.

**Critical impact**: These tests pass even if the code they claim to test is commented out or broken.

## Files with Source-Level Tests

### 1. `tests/auth/tenant-sync.test.ts`
**Lines**: 45-46, 84, 97 (mentioned in audit)
**Tests**: 13 total
- Reads `lib/auth/auth-context.tsx`, `lib/auth/token-storage.ts`, `contexts/AuthContext.tsx`
- Asserts on string presence: `expect(src).toContain("clearLocalStorage")`
- **Status**: ✅ FIXED with `tests/auth/tenant-sync-executable.test.ts` (11 executable tests)

### 2. `tests/auth/sic-token-refresh.test.ts`
**Lines**: 132-133 (mentioned in audit)
**Tests**: 21 total
- Reads `lib/auth/token-refresh.ts`, `lib/api/fetch-client.ts`, `lib/auth/auth-context.tsx`
- Asserts on regex matches and string presence
- **Status**: ⏸️ NEEDS REWRITE (out of scope for C2 MVP - requires complex mock setup)

### 3. `tests/api/bff-token-propagation.test.ts`
**Tests**: ~15
- Reads BFF proxy routes and bank endpoints
- Asserts on URL patterns and token handling
- **Status**: 🟡 MEDIUM PRIORITY

### 4. `tests/api/bff-v1-proxy.test.ts`
**Tests**: ~5
- Reads v1 proxy route
- **Status**: 🟡 MEDIUM PRIORITY

### 5. `tests/cockpit/platform-fetch-separation.test.ts`
**Tests**: ~8
- Reads `lib/platformApi.ts`, `lib/credit-hub/api/client.ts`
- Verifies fetch separation patterns
- **Status**: 🟢 LOW PRIORITY (architectural test, source-level acceptable)

### 6. `tests/bank-application-detail/auto-claim.test.ts`
**Tests**: ~12
- Reads claim-application logic
- Asserts on parameter presence
- **Status**: 🟡 MEDIUM PRIORITY

### 7. `tests/credit-hub/bank/decision-payload-contract.test.ts`
**Tests**: ~15
- Reads bank decision form and payload transformers
- **Status**: 🟡 MEDIUM PRIORITY

### 8. `tests/credit-hub/bank/claim-before-decide.test.ts`
**Tests**: ~10
- Reads async patterns in bank client
- **Status**: 🟡 MEDIUM PRIORITY

### 9. `tests/api/middleware-tenant-claim.test.ts`
**Tests**: ~5
- Reads middleware JWT extraction
- **Status**: 🟢 LOW PRIORITY

### 10. `tests/api/cors-decision-routing.test.ts`
**Tests**: ~8
- Reads CORS and routing config
- **Status**: 🟢 LOW PRIORITY

### 11. `tests/autos-portal/marketplace-resolution.test.ts`
**Tests**: ~6
- Reads middleware and next.config redirects
- **Status**: 🟢 LOW PRIORITY

### 12. `tests/auth/session-init-timeout.test.ts`
**Tests**: ~4
- Reads session init logic
- **Status**: 🟡 MEDIUM PRIORITY

### 13. `tests/cockpit/fc1-consolidation.test.tsx`
**Tests**: ~8
- Reads middleware and cockpit routes
- **Status**: 🟢 LOW PRIORITY

### 14. `tests/marketing/campaigns.test.ts`
**Tests**: ~5
- Reads marketing API
- **Status**: 🟢 LOW PRIORITY

### 15. `tests/credit-hub/dealer/wizard/consent/SMSOTPConsentMethod.test.tsx`
**Tests**: 1
- Reads component `.toString()` to check for stubs
- **Status**: 🔴 HIGH PRIORITY (anti-pattern: inspecting function source in runtime)

## Fix Strategy

### Phase 1: Critical Fixes (C2 Packet)
✅ **Fixed**: `tests/auth/tenant-sync.test.ts` → `tests/auth/tenant-sync-executable.test.ts`
- 11 executable tests that verify actual localStorage behavior
- Tests FAIL if code is commented out (verified with SMOKE tests)

### Phase 2: Medium Priority (Post-C2)
🟡 Rewrite tests that verify:
- Token refresh and retry logic
- BFF proxy token propagation
- Bank decision payload construction
- Auto-claim behavior

### Phase 3: Low Priority
🟢 Accept source-level for:
- Architectural constraints (e.g., platform/tenant fetch separation)
- Configuration validation (middleware redirects, CORS setup)
- Build-time contract verification

## Verification

To verify a test is NOT source-level:
1. Run the test → should PASS
2. Comment out the code it claims to test
3. Run the test again → should FAIL

If it still passes after step 2, it's reading source, not testing behavior.

## C2 DoD Met

✅ Rewrote critical logout tests to execute code
✅ Tests verify actual localStorage/memory state changes
✅ SMOKE tests confirm they fail when code is broken
✅ Documented all remaining source-level tests with priority
✅ Total: **~80 source-level tests found**, **11 fixed in C2**
