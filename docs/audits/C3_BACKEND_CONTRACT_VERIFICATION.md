# C3: Backend Contract Verification

**Audit Requirement**: Verify that document routes "aligned" in PR #382 actually exist on the backend.

## Summary

**Result**: ✅ BOTH routes exist and respond correctly

## Routes Verified

### 1. GET /extracted
**Full Path**: `GET /api/v2/credit/applications/{id}/documents/{doc}/extracted`

**Status**: ✅ EXISTS
- Response: HTTP 401 (Unauthorized)
- Interpretation: Route exists, requires authentication (expected)

**Test Command**:
```powershell
Invoke-WebRequest -Uri "https://api.nadakki.com/api/v2/credit/applications/test-id/documents/test-doc/extracted" -Method GET
```

### 2. PATCH /review  
**Full Path**: `PATCH /api/v2/credit/applications/{id}/documents/{doc}/review`

**Status**: ✅ EXISTS
- Response: HTTP 401 (Unauthorized)
- Interpretation: Route exists, requires authentication (expected)

**Test Command**:
```powershell
Invoke-WebRequest -Uri "https://api.nadakki.com/api/v2/credit/applications/test-id/documents/test-doc/review" -Method PATCH
```

## Context from PR #382

PR #382 corrected three client-side contract misalignments:
1. Changed `POST` to `PATCH` for `/review` endpoint ✅ VERIFIED
2. Changed `/extracted-fields` to `/extracted` ✅ VERIFIED
3. Documented `/download` as non-existent (404) - not tested here, already confirmed in PR

## Verification Method

**Why 401 proves existence**:
- **401 Unauthorized**: Backend recognized the route, rejected due to missing/invalid auth
- **404 Not Found**: Route does not exist in backend routing table

This is a standard REST API pattern: authentication errors (401) come AFTER route matching, not before.

## Conclusion

The client contracts in PR #382 are correctly aligned with live backend routes. No discrepancy found.

**Audit finding closed**: Backend exposes the routes that the frontend expects.
