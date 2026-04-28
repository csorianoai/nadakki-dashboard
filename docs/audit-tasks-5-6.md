# AUDITORÍA TAREAS 5 Y 6 — PROMPT V3

## Fecha: 2026-04-28

## Referencia: último commit dashboard `e8aacf9` (origin/main)

---

## SECCIÓN A — Utilidades y helpers (`lib/credit/utils/`)

| Archivo | Estado |
| --- | --- |
| `employment-tenure.ts` | **FALTA** (no existe archivo dedicado; la antigüedad se calcula con `formatTenure` en `age.ts`) |
| `income-normalizer.ts` | **FALTA** |
| `financial-calculator.ts` | **FALTA** (cálculos ad hoc en `WizardContainer.tsx`: `preliminaryPayment`, `preliminaryViability`, LTV/capacidad en paso 2) |
| `age.ts` | **EXISTE** — exporta `calculateAge`, `parseDateInput`, `formatTenure` |

---

## SECCIÓN B — Catálogos por país

| Ruta / archivo | Estado |
| --- | --- |
| `lib/credit/catalogs/do/` | **FALTA** (directorio no existe) |
| `lib/credit/catalogs/do/vehicle-brands.ts` | **FALTA** |
| `lib/credit/catalogs/do/banks.ts` | **FALTA** |
| `lib/credit/catalogs/do/employment-types.ts` | **FALTA** |
| `lib/credit/catalogs/dominican-provinces.ts` | **EXISTE** — `export interface AdministrativeDivision`, `export const DOMINICAN_PROVINCES` |
| `lib/credit/catalogs/useAdministrativeDivisions.ts` | **EXISTE** — `export function getAdministrativeDivisions`, `export function useAdministrativeDivisions` |

---

## SECCIÓN C — Hooks

| Hook | Estado |
| --- | --- |
| `lib/credit-hub/hooks/useTenantConfig.ts` | **EXISTE** |
| `lib/credit-hub/hooks/useCatalogs.ts` | **FALTA** |
| `lib/credit/catalogs/useAdministrativeDivisions.ts` | **EXISTE** (ruta bajo `lib/credit/catalogs/`, no bajo `hooks/`) |

### Firma observada — `useTenantConfig`

```ts
export function useTenantConfig(): { tenantConfig: TenantBankingConfig; loading: boolean } {
  const { tenantId, loading } = useTenant();
  const config = useMemo(() => buildDefaultConfig(tenantId || "tenant-no-disponible"), [tenantId]);
  return { tenantConfig: config, loading };
}
```

---

## SECCIÓN D — Componentes del wizard

**Directorio:** `components/credit-hub/dealer/wizard/`

| Archivo | Notas |
| --- | --- |
| `WizardContainer.tsx` | **Único** `.tsx`/`.ts` en el árbol del wizard (monolito; no hay steps extraídos) |

| Componente esperado (prompt) | Estado |
| --- | --- |
| `Step3FinancialAndProduct.tsx` | **FALTA** |
| `Step3Financial.tsx` | **FALTA** (no hay archivo obsoleto separado) |
| `Step3Product.tsx` | **FALTA** |
| `Step2Employment.tsx` | **FALTA** |
| `Step3Employment.tsx` | **FALTA** |

La fusión financiero/producto y el paso laboral viven **dentro** de `WizardContainer.tsx` (pasos por índice `currentStep`, no por archivos).

---

## SECCIÓN E — Campos legacy en `components/credit-hub/dealer/`

Búsqueda en todo el subárbol **dealer** (principalmente `WizardContainer.tsx`).

| Patrón | Coincidencias | Interpretación |
| --- | ---: | --- |
| `Tiempo en empleo` / `tiempo_empleo` / `employment_time` / `time_in_job` | **3** | `time_in_job` sigue en tipo, estado inicial y payload derivado (fallback si no hay `employment_start_date`). **UI** “Tiempo en empleo” ya no aparece como label; campo legacy residual en modelo. |
| `Frecuencia de pago` / `payment_frequency` / `frecuencia_pago` | **3** | Sin UI de frecuencia; queda en tipo/initial y payload fijo `"monthly"`. |
| `Banco principal` / `primary_bank` / `banco_principal` | **4** | Sin label “Banco principal *”; existe **“Banco (opcional)”** si `has_bank_account === "yes"`. |
| `Historial de mora` / `delinquency_history` / `historial_mora` | **0** | No hallado en dealer. |
| `Factura` / `invoice_required` | **0** | No hallado en dealer con esos patrones. |

---

## SECCIÓN F — Campos nuevos / comportamiento ya presente (dealer)

| Patrón | Coincidencias | Notas |
| --- | ---: | --- |
| `Fecha de ingreso` / `employment_start_date` / `fecha_ingreso_empleo` | **12+** | Fecha de ingreso laboral y garante; payload y validación de paso. |
| `Otros ingresos` / `other_income` / `has_other_income` (no `other_incomes` plural API) | **8** | Un solo monto opcional, no lista `other_incomes[]` tipo API avanzada. |
| `Dirección de la empresa` / `employer_address` | **5** | Presente. |
| `Tipo de contrato` / `contract_type` | **5** | Select fijo en componente. |
| `calculateLTV` / `calculatePMT` / `calculateDTI` | **0** | No hay funciones con esos nombres; LTV y cuota preliminar son **inline** (`amountToFinance`, `ltv`, `preliminaryPayment`, `preliminaryViability`). |

---

## SECCIÓN G — Input components reutilizables

| Ruta | Estado |
| --- | --- |
| `components/credit-hub/inputs/` | **FALTA** (directorio no existe) |
| `CurrencyInput.tsx` | **FALTA** |
| `DatePicker.tsx` | **FALTA** |
| `PhoneInput.tsx` | **FALTA** |

El wizard usa `ForgeInput`, `ForgeSelect`, etc. desde `components/credit-hub/primitives/`.

---

## SECCIÓN H — Tests

| Ruta | Estado |
| --- | --- |
| `tests/lib/utils/` | Existe **`age.test.ts`** únicamente |
| `tests/credit-hub/dealer/wizard/` | **FALTA** (no existe) |
| `tests/credit-hub/inputs/` | **FALTA** |
| `tests/lib/utils/employment-tenure.test.ts` | **FALTA** |
| `tests/lib/utils/income-normalizer.test.ts` | **FALTA** |
| `tests/lib/utils/financial-calculator.test.ts` | **FALTA** |
| `tests/credit-hub/dealer/wizard/Step3FinancialAndProduct.test.tsx` | **FALTA** |
| `tests/credit-hub/dealer/wizard/Step2Employment.test.tsx` | **FALTA** |

**Existe:** `tests/credit-hub/content/wizard/WizardContainer.test.tsx` (cubre flujo monolítico).

---

## SECCIÓN I — Backend (`nadakki-ai-suite`)

| Ruta | Estado |
| --- | --- |
| `services/credit/validators/applicant_validator.py` | **EXISTE** — incluye `employment_start_date` y validadores asociados |
| `services/credit/schemas/` | **FALTA** como directorio con esquemas dedicados (0 archivos bajo esa ruta en el inventario actual) |

**Grep en `services/credit/schemas/`:** sin resultados (ruta vacía o inexistente).

**Grep en `services/credit/`** para campos nuevos vs legacy en schemas: no aplicable por ausencia de carpeta `schemas/`; validación parcial concentrada en `applicant_validator.py` para empleo.

---

# RESUMEN EJECUTIVO

## ✅ YA IMPLEMENTADO (Tareas 5 y 6 a nivel funcional en UI monolítica)

| Componente | Ubicación | Notas |
| --- | --- | --- |
| Paso laboral rediseñado (fecha ingreso, antigüedad calculada, dirección empresa, provincia/municipio empresa, contrato, otros ingresos) | `WizardContainer.tsx` | Sin archivo `Step2Employment.tsx` |
| Fusión financiero + producto (un solo paso índice 2) | `WizardContainer.tsx` | Título sección “Información financiera y producto”; KPIs LTV, monto a financiar, capacidad estimada |
| Cálculo edad / tenure | `lib/credit/utils/age.ts` | `formatTenure` reutilizado para payload `time_in_job` |
| Provincias/municipios RD | `dominican-provinces.ts` + `useAdministrativeDivisions.ts` | |
| Config tenant (LTV max, product types, etc.) | `useTenantConfig.ts` + `tenantConfig.ts` | |
| Tests de regresión wizard | `tests/credit-hub/content/wizard/WizardContainer.test.tsx` | |

## ⚠️ PARCIALMENTE IMPLEMENTADO

| Área | Estado actual | Falta |
| --- | --- | --- |
| Eliminación total legacy modelo | `time_in_job`, `payment_frequency` aún en `ApplicationFormData` y payload | Retirar del tipo/initial o documentar como solo servidor; eliminar fallback `time_in_job` si ya no aplica |
| Otros ingresos v3 “múltiples fuentes” | Un solo campo `other_income` | Arreglo `other_incomes[]` si el contrato API lo exige |
| Catálogos dinámicos empleo/vehículo/bancos | Marcas hardcodeadas en `select("vehicle_make", ...)` | `vehicle-brands`, `employment-types`, `banks` por tenant/país |
| Cálculos financieros reutilizables | Funciones locales en wizard | `financial-calculator.ts`, tests unitarios, posible alinear con motor análisis |
| DTI explícito en paso fusión | Capacidad estimada con fórmula 0.4 | Mostrar DTI nominal / barra si prompt lo pide |

## ❌ FALTA POR IMPLEMENTAR (estructura sugerida por prompt)

| Componente | Prioridad | Notas |
| --- | --- | --- |
| `lib/credit/utils/employment-tenure.ts` | Media | Opcional si se mantiene `formatTenure` en `age.ts` |
| `lib/credit/utils/income-normalizer.ts` | Media | |
| `lib/credit/utils/financial-calculator.ts` | Alta | Extraer LTV/PMT/capacity DTI de `WizardContainer` |
| `lib/credit/catalogs/do/*` | Alta | Marcas, bancos, tipos empleo |
| `useCatalogs.ts` | Media | Abstracción sobre catálogos por `country_code` |
| `Step2Employment.tsx` / `Step3FinancialAndProduct.tsx` | Media | Refactor modular del monolito |
| `components/credit-hub/inputs/*` | Baja/Media | Según estándar UX |
| Tests dedicados por utilidad y por step | Alta | |
| `services/credit/schemas/` unificados | Media | Solo si el backend centraliza payloads aquí |

## 🚮 LEGACY AÚN PRESENTE (referencias en código dealer)

| Campo | Archivo | Líneas (aprox.) |
| --- | --- | --- |
| `time_in_job` | `WizardContainer.tsx` | ~57, ~135, ~247 |
| `payment_frequency` | `WizardContainer.tsx` | ~66, ~144, ~255 |
| `primary_bank` | `WizardContainer.tsx` | ~73, ~151, ~264, ~652 |

**Tests:** `WizardContainer.test.tsx` aún incluye claves `time_in_job`, `payment_frequency`, `primary_bank` en fixture `fullData` (compatibilidad con tipo).

---

## 📋 RECOMENDACIÓN

- **Gran parte del comportamiento** de las Tareas 5 y 6 (empleo con fecha de ingreso, fusión financiero-producto, métricas en pantalla) **ya está en `WizardContainer.tsx`** tras el commit `e8aacf9`.
- **No re-ejecutar el prompt v3 completo** como greenfield: conviene un **Prompt 3b** enfocado en:
  1. Extraer utilidades (`financial-calculator`, opcional `employment-tenure` vs `age.ts`).
  2. Catálogos `lib/credit/catalogs/do/*` + `useCatalogs` o extensión de `useTenantConfig`.
  3. Limpiar residuos `time_in_job` / `payment_frequency` / modelo `primary_bank` según contrato final.
  4. Partir el wizard en steps y tests alineados.
- **Saltar directo al Prompt 4** (garante + documentos) solo si se acepta deuda técnica (monolito + campos legacy en tipo).

---

*Auditoría solo lectura: sin tests ejecutados, sin commits, sin cambios de código.*
