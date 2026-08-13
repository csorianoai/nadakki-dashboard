# E2E TEST HARNESS - PLAYWRIGHT STAGING

## Propósito

Script completo E2E que ejecuta el ciclo operativo de crédito desde onboarding hasta decisión, en el ambiente de staging.

## Estructura

### 12 Pasos del Harness

1. **Onboarding por API**: Crear tenant con superadmin token
2. **Alta de dealer por API**: Crear usuario dealer
3. **Login dealer POR UI**: Usar Playwright para login real
4. **Crear solicitud con documento**: Wizard completo, capturar POST /documents
5. **Verificar privacidad**: localStorage/sessionStorage NO contienen nombre ni cédula (Ley 172-13)
6. **Login banco POR UI**: Analista
7. **Ver cola**: Application aparece
8. **Verificar montos IGUALES**: queue amount === detail header amount (ANTES de decidir)
9. **Contraoferta**: 650k, 17.25%, 48m, 200k enganche, capturar body/response
10. **Rechazar**: Nueva solicitud, capturar
11. **Aprobar**: Nueva solicitud, capturar
12. **Mensajería bidireccional**: Banco → Dealer, Dealer responde, verificar visibilidad

### Verificaciones Críticas

#### Montos NO en cero

```typescript
// ANTES de cualquier decisión:
const queueAmount = await extractAmountFromQueue(applicationId);
const headerAmount = await extractHeaderAmount();
expect(headerAmount).toBe(queueAmount);
expect(headerAmount).not.toBe("RD$0");
```

#### Contraoferta - campo correcto

```typescript
// Body enviado:
{
  decision_type: "COUNTER",
  counter_terms: {
    amount: 650000,
    interest_rate: 17.25,
    term_months: 48,
    down_payment: 200000  // PESOS, no porcentaje
  }
}

// Response verificado:
expect(response.terms.down_payment_required).toBe(200000);
expect(response.terms.interest_rate).toBe(17.25);
expect(response.terms.interest_rate).not.toBe(0);
```

#### Error sin claim

```typescript
// Nueva solicitud SIN llamar POST /claim antes:
await clickDecide();
const errorMessage = await page.textContent('[data-testid="error-message"]');

// NO debe decir "not_claimed" en inglés
expect(errorMessage).toContain("reclamar la solicitud");
expect(errorMessage).not.toContain("not_claimed");
```

#### Privacidad - Ley 172-13

```typescript
// Después de enviar solicitud:
const localStorage = await page.evaluate(() => window.localStorage);
const sessionStorage = await page.evaluate(() => window.sessionStorage);

// NO deben contener datos personales:
expect(localStorage).not.toContain(applicantCedula);
expect(localStorage).not.toContain(applicantName);
expect(sessionStorage).not.toContain(applicantCedula);
expect(sessionStorage).not.toContain(applicantName);
```

## Aislamiento de Operaciones

**CRÍTICO**: Cada operación usa su PROPIA solicitud fresca.

```typescript
// MAL - reutilizar solicitud:
await decideCounter(app1);
await decideReject(app1); // ❌ 409 offer_room_closed

// BIEN - solicitudes separadas:
const app1 = await createApplication();
await decideCounter(app1);

const app2 = await createApplication();
await decideReject(app2);

const app3 = await createApplication();
await decideApprove(app3);
```

## Unicidad de Datos

Para evitar conflictos 409 en índice único de `credit_applications`:

```typescript
const timestamp = Date.now();

// Tenant único:
const tenantSlug = `qa-e2e-${timestamp}`;

// Cédulas únicas por aplicación:
const cedula = (index: number) => `402${String(timestamp).slice(-7)}${String(index).padStart(2, "0")}`;

// App 0: 40212345600
// App 1: 40212345601
// App 2: 40212345602
```

## Ejecución

### Requisitos

1. **Backend staging** con git_sha 6ab6d524 (verificado same as production)
2. **Frontend local** corriendo: `npm run dev`
3. **Token superadmin** válido (30min) en `QA_SUPERADMIN_TOKEN`
4. **Playwright instalado**: `npx playwright install`

### Comando

```bash
# Single run:
npm run test:e2e e2e/credit-operational-flow-staging.spec.ts

# Three runs for verification:
npm run test:e2e e2e/credit-operational-flow-staging.spec.ts -- --repeat-each=3
```

### Qué Debe Pasar

1. ✅ 12 pasos completan sin HTTP 500
2. ✅ Montos header === queue, no cero
3. ✅ down_payment enviado como pesos (200000), no porcentaje
4. ✅ interest_rate guardado (17.25) y no cero
5. ✅ Error messages en español, no códigos inglés
6. ✅ localStorage limpio de PII
7. ✅ trace_id aparece en error logs
8. ✅ Tres corridas con datos distintos, todas verde

### Salida al Final

```
=== TEST RUN INVENTORY ===
Tenant created: qa-e2e-1723456789012 (uuid-tenant-id)
Applications created: [app-uuid-1, app-uuid-2, app-uuid-3, ...]
Dealer: dealer-1723456789012@qa.local
Bank: analista-1723456789012@qa.local
```

## Limitaciones y Extensiones Futuras

### NO Incluido (out of scope para MVP)

- Estipulaciones: endpoint identificado, pero sin forms UI todavía
- 8 campos analista: varios NO retornados por backend aún
- Subida documentos: error handling añadido, pero requiere backend fix

### Extensiones Post-MVP

- Test de rechazo por `insufficient_role` (dealer intenta decidir)
- Test de `already_claimed` (dos analistas sobre misma app)
- Test de `offer_room_closed` después de decisión APPROVED
- Flujo completo dealer: ver contraoferta, aceptar/rechazar
- Flujo de estipulaciones cuando UI esté lista

## Debugging

### Si Token Expira

```
Error: Failed to create tenant: 401 Unauthorized
```

**Fix**: Pedir nuevo token con mensaje "TOKEN VENCIDO"

### Si Staging No Tiene Commits

```
Error: GET /expediente/full returns 500
```

**Fix**: Verificar git_sha staging === 6ab6d524, si no, DETENER el test

### Si 409 en Create Application

```
Error: duplicate key value violates unique constraint
```

**Causa**: Cédula repetida por timestamp collision

**Fix**: Script ya usa timestamp + index, pero si persiste, agregar randomUUID al final

## Mantenimiento

### Limpiar Tenants de Staging

Después de múltiples corridas, staging acumula tenants `qa-e2e-*`. Para limpiar:

```sql
-- Solo con acceso DB y supervisión de Cesar
DELETE FROM tenants WHERE slug LIKE 'qa-e2e-%';
```

O por API con superadmin:

```bash
curl -X DELETE https://nadakki-ai-suite-staging.onrender.com/api/v2/tenants/{id} \
  -H "Authorization: Bearer ${SUPERADMIN_TOKEN}"
```
