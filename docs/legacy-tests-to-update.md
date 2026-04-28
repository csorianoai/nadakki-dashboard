# Tests legacy a actualizar — Plan de refactor

## Audit ejecutado: 2026-04-28

Ámbito: `nadakki-dashboard` — `tests/credit-hub/` y `components/credit-hub/` (coincidencias v3: edad manual, tiempo en empleo, frecuencia de pago, banco principal, historial de mora, factura).

## Tests obsoletos detectados

| Archivo | Línea | Campo legacy | Reemplazo |
| --- | --- | --- | --- |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 23 | `applicant_age` en `fullData` | Eliminar; edad derivada de `applicant_date_of_birth` + asserts sobre texto calculado si aplica |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 80 | `change("Edad *", …)` | Eliminar; solo `Fecha de nacimiento *` + validar edad mostrada o `stepIsValid` vía UI |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 34, 97 | `time_in_job` / `Tiempo en empleo *` | `employment_start_date` + etiqueta “Fecha de inicio…” (según copy actual del wizard) |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 37, 99 | `payment_frequency` / `Frecuencia de pago *` | Eliminar del flujo E2E si el campo ya no existe; o mapear a nuevo modelo si persiste solo en payload |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 44, 109 | `primary_bank` / `Banco principal *` | `Banco (opcional)` bajo “¿Tiene cuenta bancaria?” si el flujo actual usa `has_bank_account` + `primary_bank` opcional |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 46–47 | `has_late_payment_history`, `max_late_payment_days` | Verificar si UI/payload v3 eliminó “Historial de mora”; alinear fixture y expect `buildCreateApplicationPayload` |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 66 | `document_invoice_uploaded` | Checklist dinámico `tenantConfig.required_documents`; eliminar o sustituir por doc key vigente |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 77–78 | `Cédula / Identificación *` | Etiqueta actual del paso Identificación (tipo doc + número); actualizar `getByLabelText` |
| tests/credit-hub/content/wizard/WizardContainer.test.tsx | 89, 102, 111, 121–126 | Títulos de paso (`Información laboral`, `Información financiera`, `Vehículo / producto`, `Co-debtor`) | Alinear con `steps[]` actual (p. ej. “Finanzas y producto”, garante condicional, etc.) |

**Nota:** No hubo coincidencias en `tests/credit-hub` para textos “Historial de mora”, `delinquency_history`, “Factura” / `factura_required`; el acercamiento legacy está en el fixture (`has_late_payment_history`, `document_invoice_uploaded`) y en expectativas del payload.

## Componentes con hardcoded a corregir

| Archivo | Línea | Hardcoded | Reemplazo |
| --- | --- | --- | --- |
| components/credit-hub/dealer/wizard/WizardContainer.tsx | 101, 148, 196–197 | Default `"CEDULA"` en estado inicial y fallbacks | `tenantConfig.document_types?.default_primary` o primer tipo permitido del tenant |
| components/credit-hub/dealer/wizard/WizardContainer.tsx | 519, 646 | Valores de option `"CEDULA"` / `"PASAPORTE"` en JSX | Generar options desde `useTenantConfig()` / catálogo de tipos de documento |
| components/credit-hub/dealer/wizard/WizardContainer.tsx | 199, 264, 304–305, 504, 529–531, 650–651 | Ramas `=== "CEDULA"` / `"PASAPORTE"` | Mantener como constantes de dominio OK si vienen de config; evitar duplicar listas literales en UI |

**Resumen grep `"CEDULA"\|"PASAPORTE"`:** 18 líneas, todas en `WizardContainer.tsx` (ningún otro archivo bajo `components/credit-hub/` en este audit).

## Plan de ejecución

1. **WizardContainer.test.tsx — fixture `fullData`:** Sincronizar con `ApplicationFormData` actual (document type, fechas, municipio, ingresos múltiples, consentimiento presencial/remoto, etc.).
2. **WizardContainer.test.tsx — `fillApplicantAndContinue`:** Quitar `Edad *`; ajustar labels de identificación y geografía si cambiaron a selects encadenados.
3. **WizardContainer.test.tsx — `advanceToConsents`:** Reemplazar pasos laboral/financiero/vehículo según número y títulos reales de pasos; quitar frecuencia de pago y “banco principal” obligatorio si ya no aplican.
4. **WizardContainer.test.tsx — `buildCreateApplicationPayload` test:** Revisar `toMatchObject` vs shape nuevo (financial sin mora, documents sin factura fija, etc.).
5. **WizardContainer.tsx (post-tests):** Externalizar defaults de tipo de documento a `useTenantConfig()` según tabla de arriba.
6. **new.test.tsx:** Sin cambios por este audit (no referencia campos legacy del wizard).

## Archivos a tocar (lista)

- `tests/credit-hub/content/wizard/WizardContainer.test.tsx` (único archivo de tests con hallazgos directos)
- `components/credit-hub/dealer/wizard/WizardContainer.tsx` (hardcoded CEDULA/PASAPORTE; campos mora/factura en payload si aún existen en tipo — revisar al actualizar tests)
