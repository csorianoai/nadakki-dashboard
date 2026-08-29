# Censo cruzado del PATCH del wizard

Fecha: 2026-08-28
Estado: FASE 1, sin cambios de codigo ni PR

## Alcance

`lib/credit-hub/dealer/wizard-step-fields.ts` aplana el payload que el wizard
manda a `PATCH /api/v2/credit/applications/{id}/fields`. El backend valida las
claves contra `EDITABLE_FIELDS` en `services/credit/application_edit_service.py`
(lineas 19-31) y corta en la primera desconocida (linea 124).

## Lista A: claves que arma el wizard

| grupo efectivo | claves |
|---|---|
| Solicitante + Empleo | `full_name`, `document_type`, `document_other_type`, `identification`, `date_of_birth`, `age`, `marital_status`, `phone`, `email`, `address`, `city`, `municipality`, `province`, `country`, `referencias_personales`, `employment_type`, `employer_name`, `position`, `employment_start_date`, `employer_address`, `employer_province`, `employer_municipality`, `contract_type`, `monthly_income`, `has_other_income`, `other_income`, `work_phone` |
| Consentimiento | `presence`, `bureau_authorization`, `terms_accepted`, `data_processing_authorization`, `consent_method`, `consent_audit_hash`, `consent_accepted_at`, `signature_full_name` |
| Financiero + Vehiculo | `requested_amount`, `desired_term`, `down_payment`, `monthly_debts`, `estimated_monthly_expenses`, `has_bank_account`, `has_late_payment_history`, `max_late_payment_days`, `product_type`, `make`, `model`, `version`, `year`, `color`, `price`, `dealer_supplier`, `condition`, `mileage` |
| Codeudor + documentos | `required`, `full_name`, `document_type`, `document_other_type`, `identification`, `date_of_birth`, `email`, `address`, `province`, `municipality`, `phone`, `monthly_income`, `relationship`, `employment`, `employer_name`, `employment_start_date`; `documents`/`documentos` solo si el valor es array |

El helper reutiliza el ultimo grupo para indices posteriores a 3. El builder de
creacion tambien contiene `source`, `version`, `segment`, `documents` y
`consents`, pero esos objetos no se envian al PATCH plano por el helper.

## Lista B: claves aceptadas

Fuente: `services/credit/application_edit_service.py:19-25`.

```text
telefono_celular
telefono_trabajo
email
direccion
sector
municipio
provincia
nombre_empleador
antiguedad_empleo_meses
cargo
ingreso_mensual_declarado
otros_ingresos
inicial_disponible
plazo_meses
referencias_personales
```

La misma fuente declara como no editables identidad y vehiculo:

```text
cedula, nombre_completo, fecha_nacimiento, vin,
plate_number, precio_venta, valor_tasacion
```

## A - B: lo que el wizard manda y no acepta

Todas las claves de A salvo `email` y `referencias_personales` son desconocidas
por nombre. La diferencia no es una lista de campos faltantes aislados: el
wizard usa nombres ingleses y el endpoint es un editor limitado con nombres
espanoles.

**LEGITIMO, pero requiere mapeo de contrato:** `phone` ->
`telefono_celular`, `work_phone` -> `telefono_trabajo`, `address` ->
`direccion`, `province`/`employer_province` -> `provincia`,
`municipality`/`employer_municipality` -> `municipio`, `employer_name` ->
`nombre_empleador`, `position` -> `cargo`, `monthly_income` ->
`ingreso_mensual_declarado`, `desired_term` -> `plazo_meses`, `down_payment` ->
`inicial_disponible`, mas `email` y `referencias_personales`.

**NO LEGITIMO para este endpoint:** identidad (`full_name`, `identification`,
`date_of_birth` y equivalentes), vehiculo (`make`, `model`, `vin` y
equivalentes), consentimiento, codeudor y campos de creacion que no figuran en
la whitelist. No deben entrar agregandolos uno por uno.

## B - A: acepta el endpoint y el wizard no manda con ese nombre

```text
telefono_celular, telefono_trabajo, direccion, sector, municipio, provincia,
nombre_empleador, antiguedad_empleo_meses, cargo, ingreso_mensual_declarado,
otros_ingresos, inicial_disponible, plazo_meses
```

`email` y `referencias_personales` si aparecen en ambos lados.

## Por que existe la whitelist

El servicio separa campos editables por dealer de identidad y vehiculo core:
comprueba `BLOCKED_FIELDS`, luego `EDITABLE_FIELDS`, y solo despues verifica si
la solicitud sigue editable. Ampliarla con el payload completo del wizard
convertiria el control de edicion en permiso para reescribir identidad,
vehiculo y consentimiento. La evidencia indica un desacople de contratos, no
una sucesion de campos que deban agregarse al backend.

## Tipo de contrato deshabilitado

`WizardContainer.tsx:1108` lo deshabilita cuando
`catalogsLoading || !catalogs`. No depende de otro campo del formulario.

`useCatalogs.ts:18-33` carga de forma asincrona los modulos locales de DO,
incluido `DO_CONTRACT_TYPES`; en `:47-56`, si la carga falla, captura el error,
deja `catalogs` en `null` y termina loading. Por lectura de codigo, la causa es
catalogo no cargado o carga fallida, no una dependencia de otro campo. Para
separar esas dos causas hace falta una corrida de navegador que capture consola
y estado despues de terminar el loading; no se infiere.

## Decision pendiente

No ampliar `EDITABLE_FIELDS` por campo. Cesar debe decidir primero si el wizard
debe usar este endpoint o un contrato de persistencia propio. Solo despues se
puede implementar el mapeo de los campos legitimos, excluir los no legitimos,
mostrar el 422 y agregar la guarda cruzada. La guarda tambien debe declarar que
los campos se arman por partes y que su cobertura estatica no alcanza valores
dinamicos.

## Fase 2: medicion de endpoints de persistencia

Medida leyendo `routers/credit_router.py:901-940` y
`services/credit/schemas.py:163-279`.

### `/applicant`

Contrato: `ApplicantDataRDV2`. Acepta exactamente estos campos declarados por
el modelo: `name`, `monthly_income`, `national_id`, `employment_status`,
`co_borrower_name`, `co_borrower_monthly_income`, `cedula`, `nombre_completo`,
`fecha_nacimiento`, `estado_civil`, `nacionalidad`, `telefono_celular`,
`telefono_trabajo`, `email`, `direccion`, `sector`, `municipio`, `provincia`,
`tipo_empleo`, `nombre_empleador`, `cargo`, `antiguedad_empleo_meses`,
`ingreso_mensual_declarado`, `otros_ingresos`, `monto_solicitado`,
`plazo_meses`, `inicial_disponible`, `referencias`, `autoriza_buro`,
`acepta_politica_datos`, `firma_digital`.

El modelo tiene `extra="ignore"`. Por tanto, enviar `full_name` o cualquiera de
las claves inglesas no falla: devuelve 200 y las descarta antes de persistir.
Eso explica el falso verde del despacho.

### `/vehicle`

Contrato: `VehicleDataRDV2`. Acepta: `vin`, `year`, `make`, `model`,
`vehicle_value`, `loan_amount_requested`, `marca`, `modelo`, `version`, `anio`,
`condicion`, `transmision`, `combustible`, `color`, `km_odometro`,
`vin_chasis`, `placa`, `precio_venta`, `valor_tasacion`,
`propietario_vehiculo`, `tiene_gravamen_previo`, `entidad_gravamen`.

También usa `extra="ignore"`. Las claves `product_type`, `price`,
`dealer_supplier`, `condition` y `mileage` no son el contrato exacto; algunas
pueden mapearse (`price` -> `vehicle_value`, `condition` -> `condicion`,
`mileage` -> `km_odometro`), pero no deben enviarse con el nombre del wizard.

### Remanente sin endpoint en `/applicant` o `/vehicle`

Quedan sin destino directo medido: `monthly_debts`,
`estimated_monthly_expenses`, `has_bank_account`, `has_late_payment_history`,
`max_late_payment_days`, `product_type`, `dealer_supplier`, la fecha de inicio
de empleo sin conversión a `antiguedad_empleo_meses`, `contract_type`, detalles
de `other_incomes`, campos completos de codeudor, y el objeto de documentos.

`documents` tiene otro circuito (`document-requests` y upload), y el
consentimiento tiene `initiate/accept`; ninguno debe pasar por estos endpoints.
No se encontró un endpoint de persistencia para todos los campos restantes.

### Resultado de Fase 2

**PREMISA_REFUTADA.** `/applicant` y `/vehicle` no cubren las aproximadamente
70 claves del wizard como contrato directo. Un cambio que solo mapee los campos
conocidos deja datos sin persistir y mantiene un falso 200 por `extra="ignore"`.
Se detiene la implementación hasta una decisión de contrato para el remanente.
