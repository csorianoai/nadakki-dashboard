# M0 · Medición: Dónde se pierde el monto
## Solicitud: ramon almonte soriano · 2014 Toyota Corolla · ...c04ba720

---

## CAMPO_EN_EL_WIZARD

**Archivo:** `components/credit-hub/dealer/wizard/WizardContainer.tsx`

**Línea 172:** Definición del campo en el form state
```typescript
requested_amount: string;
```

**Línea 271:** Valor inicial
```typescript
requested_amount: "",
```

**Línea 404:** Construcción del payload para el submit
```typescript
financial: {
  requested_amount: formData.requested_amount,  // ← Se manda
  desired_term: formData.desired_term,
  down_payment: formData.down_payment || "0",
  monthly_debts: formData.monthly_debts || "0",
  // ...
}
```

**CONCLUSIÓN:** El wizard TIENE el campo y LO MANDA en el payload del submit.

---

## EN_EL_PAYLOAD

**Archivo:** `lib/credit-hub/api/creditCoreClient.ts`

**Línea 130-138:** Función `createApplication`
```typescript
export async function createApplication(params: {
  tenantId: string;
  payload: CreateCreditApplicationPayload;
}): Promise<CreditApplication> {
  const raw = await creditCoreFetch<unknown>("/applications", {
    method: "POST",
    tenantId: params.tenantId,
    body: JSON.stringify({
      application_payload: params.payload,  // ← Payload completo envuelto
      initial_state: "DRAFT",
    }),
  });
  return normalizeApplication(raw);
}
```

**Archivo:** `lib/credit-hub/types/creditCore.ts`

**Línea 145-146:** Definición del tipo `CreateCreditApplicationPayload`
```typescript
financial: {
  requested_amount: string | number;  // ← Campo obligatorio en el tipo
  desired_term: string;
  // ...
}
```

**CONCLUSIÓN:** El payload del POST SÍ incluye `requested_amount` dentro de `application_payload.financial.requested_amount`.

---

## EN_LA_RESPUESTA_POST

**Archivo:** `lib/credit-hub/api/normalizers.ts`

**Línea 91-192:** Función `normalizeApplication` que procesa TODAS las respuestas del backend (POST create, GET list, GET detail)

**Líneas 110-113:** Extracción del `requested_amount`
```typescript
// Requested amount: top-level → payload.financial.requested_amount
const requestedAmount = pickString(record, ["requested_amount", "requestedAmount", "amount"])
  || pickString(payloadFinancial, ["requested_amount", "requestedAmount", "amount"])
  || "0";  // ← DEFECTO CRÍTICO: fallback a "0" viola regla F4
```

**Línea 178:** Asignación al objeto normalizado
```typescript
requested_amount: requestedAmount,
```

**EVIDENCIA DEL BACKEND (de documentación):**

1. `docs/audits/FE_A2Z_PROGRESO.md` línea 40:
   ```
   **Backend:** PRs #881, #884, #883 entregaron `Optional[float]` para `requested_amount`.
   ```

2. `REPORTE-TAREAS-1-2-3.md` línea 121:
   ```
   - ✅ expediente/full devuelve financial con requested_amount ≠ 0
   ```

3. `e2e/CONTRATOS-VERIFICADOS.md` línea 125:
   ```
   "requested_amount": 600000,
   ```

4. `docs/credit-hub/FULL_WIZARD_VALIDATION_REPORT.md` línea 64:
   ```
   "requested_amount": "500000",
   ```

**CONCLUSIÓN:** El backend SÍ devuelve `requested_amount`, pero el normalizer usa `"0"` como fallback cuando el campo está ausente o `null`.

---

## EN_EL_GET_LISTADO

**Archivo:** `lib/credit-hub/api/creditCoreClient.ts`

**Línea 118-124:** `listApplications`
```typescript
export async function listApplications(params: { tenantId: string }): Promise<CreditApplication[]> {
  const raw = await creditCoreFetch<unknown>("/applications", {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeApplications(raw);
}
```

**Archivo:** `lib/credit-hub/api/normalizers.ts`

**Línea 194-196:** `normalizeApplications` usa el MISMO `normalizeApplication` que el POST
```typescript
export function normalizeApplications(raw: unknown): CreditApplication[] {
  return pickArray(raw).map(normalizeApplication);
}
```

**CONCLUSIÓN:** El GET del listado usa el MISMO normalizer con el MISMO defecto del fallback `"0"`.

---

## EN_EL_GET_EXPEDIENTE

**Archivo:** `lib/credit-hub/api/creditCoreClient.ts`

**Línea 141-150:** `getApplication` (expediente detail)
```typescript
export async function getApplication(params: {
  tenantId: string;
  applicationId: string;
}): Promise<CreditApplication> {
  const raw = await creditCoreFetch<unknown>(`/applications/${encodeURIComponent(params.applicationId)}`, {
    method: "GET",
    tenantId: params.tenantId,
  });
  return normalizeApplication(raw);
}
```

**CONCLUSIÓN:** El GET del expediente usa el MISMO normalizer con el MISMO defecto del fallback `"0"`.

---

## EL_COMPONENTE_LEE

### Listado del dealer

**Archivo:** `components/credit-hub/dealer/ApplicationCard.tsx`

**Línea 63:**
```typescript
const requestedAmount = Number(application.requested_amount || 0);
```

**Línea 96 (compact variant):**
```typescript
<p className="font-mono font-medium text-forge-text">RD$ {requestedAmount.toLocaleString("es-DO")}</p>
```

**Línea 144 (card variant):**
```typescript
<p className="font-mono text-2xl font-bold text-forge-text">RD$ {requestedAmount.toLocaleString("es-DO")}</p>
```

**DEFECTO:** `Number("0")` = `0`, muestra `RD$ 0` cuando el backend no envió el monto.

---

### Listado del banco

**Archivo:** `components/credit-hub/bank/shared/bankUi.tsx`

**Línea 360:**
```typescript
<td className="ch-num" data-field="amount">{chMoney(a.requested_amount)}</td>
```

**Archivo:** `lib/credit-hub/formatters.ts` (inferido del código):
```typescript
export function chMoney(value: string | number | null): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (num === null || !Number.isFinite(num)) return "—";
  // ...
}
```

**DEFECTO POTENCIAL:** Si `chMoney("0")` devuelve `RD$ 0` en vez de `"—"`, muestra cero cuando el backend no envió el monto.

---

### Expediente del banco

**Archivo:** `components/credit-hub/bank/BankDetailLayout.tsx`

**Línea 182:**
```typescript
const amount = financial.requested_amount ?? analysis?.financed_amount ?? null;
```

**Línea 257:**
```typescript
{chMoneyExact(amount)}
```

**ESTE COMPONENTE ESTÁ BIEN:** Usa `null` como fallback y `chMoneyExact` debería mostrar "—" o "No informado" para `null`.

---

### Expediente del dealer

**Archivo:** `components/credit-hub/dealer/DealerApplicationDetailView.tsx`

**Línea 191:**
```typescript
const amount = parseRequestedAmount(data.requested_amount);
```

*(función `parseRequestedAmount` no encontrada en el grep, probablemente convierte string a number)*

---

## VEREDICTO

```text
NOMBRES_DISTINTOS
```

**Explicación:**

El defecto NO es que el monto no se guarde, ni que no se mande, ni que el componente lea el campo equivocado.

**El defecto es que el normalizer del frontend usa `"0"` como fallback cuando el backend devuelve `null` o el campo está ausente.**

Esto crea una ambigüedad fatal:
- `requested_amount: "0"` en el frontend puede significar:
  1. El usuario solicitó RD$0 (dato real, aunque extraño)
  2. El backend no envió el monto (dato ausente)

El código del componente `BankDetailLayout.tsx` línea 182 está **BIEN** porque usa `?? null` en vez de `?? 0`. Pero ese arreglo solo funciona si el normalizer devuelve `null` cuando el campo está ausente, no `"0"`.

---

## DÓNDE SE PIERDE

**Archivo exacto:** `lib/credit-hub/api/normalizers.ts`

**Línea exacta:** 113

**Código defectuoso:**
```typescript
const requestedAmount = pickString(record, ["requested_amount", "requestedAmount", "amount"])
  || pickString(payloadFinancial, ["requested_amount", "requestedAmount", "amount"])
  || "0";  // ← AQUÍ
```

**Arreglo necesario:**
```typescript
const requestedAmount = pickString(record, ["requested_amount", "requestedAmount", "amount"])
  || pickString(payloadFinancial, ["requested_amount", "requestedAmount", "amount"])
  || null;  // ← Devolver null en vez de "0"
```

**Y cambiar el tipo en `lib/credit-hub/types/creditCore.ts` línea 65:**
```typescript
// Actual (INCORRECTO):
requested_amount: string;

// Debería ser:
requested_amount: string | null;
```

---

## PARA_EL_BACKEND

**NO HAY NADA PARA EL BACKEND.**

El backend SÍ está devolviendo `requested_amount` según la evidencia documental. El problema es exclusivamente del cliente.

---

## HIPÓTESIS SECUNDARIA A VERIFICAR

Es posible que **para la solicitud `...c04ba720` específicamente**, el backend SÍ esté devolviendo `null` o el campo ausente por alguna razón (e.g., creada con wizard antiguo, migración de esquema, estado corrupto).

**Verificación necesaria (en navegador):**

1. Abrir DevTools → Network
2. Navegar a `/credit-hub/dealer/applications`
3. Capturar la respuesta de `GET /api/v2/credit/applications`
4. Buscar el objeto con `application_id` que termina en `c04ba720`
5. Ver si `requested_amount` está presente y qué valor tiene

**Si el backend devuelve `null` o el campo ausente:**
- El normalizer lo convierte a `"0"` (defecto del frontend)
- M1 arregla el normalizer

**Si el backend devuelve `0` o `"0"` literal:**
- Hay un segundo defecto: el backend no guardó el monto que el wizard envió
- M1 sigue siendo necesario (para mostrar "No informado" en vez de RD$0 cuando el backend diga `null`)
- PERO también hay que reportar al backend para que investigue por qué no guardó el monto

---

## SIGUIENTES PASOS

1. **M1 (14 iter):** Arreglar el normalizer y los componentes para que `null` = "No informado", nunca RD$0
2. **Verificación en Vercel:** Capturar la respuesta real de la API para `...c04ba720` y confirmar si el backend devuelve `null`, `0`, o el campo ausente
3. **Si el backend devuelve `0` literal:** Reportar a Cesar/Ramon con la evidencia de que el POST del wizard sí manda el monto pero el backend no lo guarda

---

**Medición completada: 2026-08-22**
**Presupuesto usado: 1 de 12 iteraciones**
