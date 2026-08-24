# F2 · Inventario de Tests Que Leen Source

**Loop:** FE-CIERRE  
**Fecha:** 2026-08-24

## Resumen

Total archivos de test con `readFileSync`: **14**

Priorizados para reescritura (auth/ownership): **6**

---

## Tests Priorizados (Auth / Ownership)

### Autenticación (3)

1. **`tests/auth/tenant-sync.test.ts`**
   - Lee: `lib/auth/auth-context.tsx`, `lib/auth/token-storage.ts`, `contexts/AuthContext.tsx`
   - Verifica: localStorage sync en login/logout/switch
   - Prioridad: **ALTA** (auth core)

2. **`tests/auth/sic-token-refresh.test.ts`**
   - Lee: `lib/auth/token-refresh.ts`, `lib/api/fetch-client.ts`, `lib/auth/auth-context.tsx`
   - Verifica: Refresh proactivo y retry-on-401
   - Prioridad: **ALTA** (auth core)

3. **`tests/auth/session-init-timeout.test.ts`**
   - Lee: `lib/auth/auth-context.tsx`
   - Verifica: Timeout en init
   - Prioridad: **MEDIA**

### Ownership (3)

4. **`tests/api/middleware-tenant-claim.test.ts`**
   - Lee: `app/api/v2/[[...path]]/route.ts`
   - Verifica: Extracción de tenant_key del JWT
   - Prioridad: **ALTA** (multi-tenant security)

5. **`tests/credit-hub/bank/claim-before-decide.test.ts`**
   - Lee: `lib/credit-hub/api/bankClient.ts`
   - Verifica: `analyst_id` en decision
   - Prioridad: **MEDIA**

6. **`tests/bank-application-detail/auto-claim.test.ts`**
   - Lee: `lib/credit-hub/api/bankClient.ts`
   - Verifica: `analyst_id` en claim
   - Prioridad: **MEDIA**

---

## Tests Restantes (No Priorizados)

### API / Backend Integration (5)

7. **`tests/api/bff-v1-proxy.test.ts`**
   - Lee: `app/api/v1/[[...path]]/route.ts`
   - Verifica: v1 proxy headers

8. **`tests/api/bff-token-propagation.test.ts`**
   - Lee: `app/api/v2/[[...path]]/route.ts`
   - Verifica: Token propagation

9. **`tests/api/cors-decision-routing.test.ts`**
   - Lee: `lib/credit-hub/api/client.ts`
   - Verifica: CORS same-origin

10. **`tests/marketing/campaigns.test.ts`**
    - Lee: múltiples
    - Verifica: Marketing agents

11. **`tests/cockpit/platform-fetch-separation.test.ts`**
    - Lee: múltiples en `lib/cockpit/api/`
    - Verifica: Separación de fetch

### Otros Dominios (3)

12. **`tests/utils/timestamp-format.test.ts`**
    - Lee: `components/credit-hub/dealer/ApplicationCard.tsx`
    - Verifica: formatTimeAgo usage

13. **`tests/credit-hub/bank/decision-payload-contract.test.ts`**
    - Lee: `lib/credit-hub/api/bankClient.ts`
    - Verifica: Decision payload structure

14. **`tests/autos-portal/marketplace-resolution.test.ts`**
    - Lee: Autos portal
    - Verifica: AP-5 resolution

---

## Estado de Reescritura

- **Reescritos**: 0 de 6 priorizados
- **Verificados con mutación**: 0
- **Pendientes**: 6

---

## Próximos Pasos

1. Reescribir `tenant-sync.test.ts` (localStorage sync)
2. Reescribir `sic-token-refresh.test.ts` (token refresh)
3. Verificar mutación en cada test reescrito
4. Continuar con ownership tests según tiempo disponible
