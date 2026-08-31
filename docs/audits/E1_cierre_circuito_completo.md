# E1 — Cierre de circuito Dealer → Banco → Dealer (primer end-to-end completo)

**Fecha:** 2026-08-29
**Entorno:** `staging-dashboard.nadakki.com`
**Bundle dealer:** `dpl_FL4JPtKdBEL4HrmeW121WPKjhAhZ`
**Bundle banco:** `dpl_HBBpAZzfSFSegq7ZN5Thuo2QCdUX`
**Solicitud creada:** `ff0272b7-63f2-40f9-b038-4c8f00f29cee`
**Cuenta dealer:** portal concesionario (rol Dealer) · **Cuenta analista:** `qa-analyst-assigned@qa-b1c.com` (rol Banco)
**Cliente de prueba:** "Cliente E1 Cierre QA" · Toyota Corolla 2022 · monto solicitado RD$1,000,000

> Resultado: **el circuito cierra de punta a punta por primera vez.** Dealer crea → despacha → analista aprueba → dealer ve la aprobación. Todos los pasos verificados en pantalla. Quedan hallazgos abiertos (sección final), ninguno bloquea el circuito.

---

## 1. Qué había que destrabar antes de correr E1

| PR / acción | Problema | Estado |
|---|---|---|
| #437 | "Tipo de contrato" `disabled` por `catalogsLoading \|\| !catalogs` en `WizardContainer` | Arregló una instancia, pero no la viva |
| #438 (1ª) | La ruta viva monta `StepApplicant → DealerWizardApplicantEmploymentStep`, no `WizardContainer` — 2ª instancia del mismo binding | Arreglada + test que monta la pantalla real |
| #440 | "Nueva solicitud" reusaba el draft fijo del fixture en vez de crear uno nuevo | Ahora crea draft nuevo con `application_id` propio |
| Deploy/propagación | El alias servía el `dpl` viejo (service worker PWA + `next-static`/`workbox-precache` + edge cache ~50 min) pese a "desplegado" | Se resolvió; **verificar el hash del bundle es parte del procedimiento** |

**Procedimiento de verificación de bundle (obligatorio antes de medir):** cerrar todas las pestañas → desregistrar service worker + borrar caches (`next-static`, `workbox-precache`) → reabrir → leer `?dpl=` de los `<script src>` y confirmar que **cambió** respecto del deploy anterior.

---

## 2. Recorrido E1 — los 8 pasos, tal como se ejecutaron

### Paso 1 — Solicitante + Empleo (datos tecleados, sin bypass) → **avanza**
- "Nueva solicitud" (#440) → al hacer "Siguiente" se creó `application_id=ff0272b7…` (UUID real, distinto del fixture `c1a0d001-…-0001`).
- Datos del solicitante tecleados a mano; nombre "Cliente E1 Cierre QA".
- **El paso 1 avanzó al Consentimiento** (`/new/consent?application_id=ff0272b7…`).
- ⚠️ **Caveat (ver hallazgos):** "Tipo de contrato" siguió `disabled` en este bundle incluso editando activamente "Tipo de empleo". El paso avanzó porque el campo traía `indefinido` heredado del draft, **no** por una selección hecha a mano.

### Paso 2 — Consentimiento → **avanza**
- Presencia: "Sí, está aquí".
- 2 autorizaciones obligatorias marcadas (Ley 172-13 · Política de tratamiento). Buró de crédito queda opcional ("no está activa en este entorno").
- Firma digital + botón **"Confirmar"** (necesario antes de "Siguiente", si no, no avanza).
- Documentos: opcionales en este paso ("quedarán como pendientes").
- Avanzó a `/new/vehicle`.

### Paso 3 — Vehículo → **avanza**
- Financieros: plazo 48 meses · cuota inicial RD$200,000 · deudas mensuales · gasto estimado.
- Producto: Vehículo usado · Toyota · Corolla · 2022 · precio RD$1,200,000 · condición Usado · Dealer/Suplidor.
- Declaración del dealer (5 preguntas obligatorias): pérdida total No · accidentes No · gravámenes No · título a nombre del vendedor Sí · kilometraje coincide Sí.
- **Firma digital del dealer** (obligatoria; registra "Fecha de firma").
- Pre-evaluación de riesgo en vivo: con deudas altas dio **"Riesgoso" (DTI 51%)**; ajustando deudas mensuales bajó a **"Ajustar" (DTI 36.9%)**, dentro del máximo institucional 40%. Segmento LATAM opcional (no bloquea).
- Completitud 100% · avanzó a `/new/review`.

### Paso 4 — Revisión → **avanza**
- ¿Garante o cofirmante? → No.
- **Documento del vehículo (Requerido):** se subió un archivo (matrícula/título). *Ver hallazgo: el upload al servidor devolvió 500.*
- **3 referencias personales completas** (nombre + dirección + teléfono 7+ dígitos) — mínimo requerido.
- Sin errores, "Enviar solicitud" habilitado.

### Paso 5 — Despachar → **crea las ofertas**
- "Enviar solicitud" → **"SOLICITUD RECIBIDA"** (página `/new/complete`).
- **2 ofertas creadas** (Exchange multi-banco, REAL):
  - **Mock** — RD$1,000,000 · APR 17% · 48m · cuota RD$27,830
  - **Pilot [MEJOR]** — RD$1,000,000 · APR 12% · 48m · cuota RD$10,000
- ⚠️ Toast de error: *"0 documento(s) subido(s), 1 con error. Primer error: Error HTTP 500"* — el documento del vehículo no persistió (ver hallazgos). No bloqueó el despacho.

### Paso 6 — Cola del analista + expediente → **aparece y abre**
- (Sesión cambia a cuenta analista `qa-analyst-assigned@qa-b1c.com`, rol Banco.)
- Bandeja → **`ff0272b7` aparece** (Estado "Completada", Prioridad Baja, recibida ~40 min). En la **lista** el solicitante sale como "Sin n\*\*\*" (masking conocido `applicant`/`applicant_data`).
- **El expediente abre**: muestra "Cliente E1 Cierre QA" (nombre correcto en el detalle), Toyota Corolla 2022, panel "DECISIÓN DE CRÉDITO [Comité L3]".

### Paso 7 — Selector de lender + aprobar + registrar → **la decisión se registra**
- **Selector de lender presente**: "Lender que responde" (opciones `mock` / `pilot`). Elegido **pilot**.
- Aprobar · monto aprobado RD$1,000,000 · plazo 48 · tasa 12% · justificación.
- 1er intento → **`422 bank_decision_rejected: compliance_required_before_approval`** (gate real).
- Pestaña **Compliance (2 incidencias)** → **"Aprobar compliance"** → `POST /api/v2/credit/applications/ff0272b7…/compliance/approve` → **200**. (La UI de compliance no refrescó el "Pendiente" pese al 200 — desfase visual.)
- Reintento de la decisión → ✅ **"Decisión registrada"** ("Solicitud aprobada · 48 meses", "Ver comprobante").
- Confirmado en el Panel del banco: **Tasa de aprobación 0% → 100%**, Pendientes de decisión 5 → 4.
- ⚠️ La decisión quedó como **"aprobada por RD$0"** pese a cargar RD$1,000,000 (ver hallazgos).

### Paso 8 — El dealer ve la decisión → **circuito cerrado**
- (Sesión vuelve a la cuenta dealer.)
- Vista dealer de `ff0272b7`: badge **"✓ Aprobada"** + **"¡Felicitaciones! Esta solicitud fue aprobada. Contacto: Institución financiera"**.
- Cronología visible para el dealer: `MULTI_LENDER_OFFERS_PERSISTED → APPLICATION_CLAIMED → COMPLIANCE_APPROVED → BANK_DECISION_MADE → DECISION_RENDERED → APPLICATION_APPROVED_WITH_STIPULATIONS`.
- **¿Atribuida a pilot?** → No explícitamente (ver hallazgos).
- **¿Aviso o tuvo que entrar?** → Tuvo que entrar (ver hallazgos).

---

## 3. Hallazgos abiertos (para Codex / equipo)

### Nuevos (surgidos en este recorrido)
1. **Upload de documento → HTTP 500 en el despacho.** El documento del vehículo (obligatorio en el form del paso 4) no persiste: *"0 documentos subidos, 1 con error. Primer error: Error HTTP 500"*. Los 9 documentos quedan `PENDIENTE` en dealer y banco. No bloquea el circuito. *(El usuario ya lo está registrando.)*
2. **Decisión "aprobada por RD$0".** En el paso 7 se cargó monto aprobado RD$1,000,000, pero la decisión se registró y se muestra como RD$0. El monto no se refleja en el registro de la decisión.
3. **El dealer no ve el lender que aprobó.** La aprobación se atribuye a "Institución financiera" (genérico). "pilot" aparece solo como la tarjeta de oferta [MEJOR]; el lender seleccionado como aprobador no se nombra en la vista dealer.
4. **Sin notificación al dealer.** Página de Notificaciones: *"Notificaciones no conectadas — cuando el backend publique `GET /api/v2/credit/notifications`, las alertas aparecerán aquí"* [ROADMAP]. El dealer solo se entera navegando al expediente.

### Gate de compliance — el analista choca con él sin saber que existe
5. **El `422 compliance_required_before_approval` aparece recién al intentar aprobar, sin señal previa.** El analista completa lender + monto + tasa + justificación, hace clic en "Aprobar solicitud" y **ahí** recibe el error 422. Nada en el panel de decisión indica de antemano que la aprobación regulatoria (pestaña Compliance → "Aprobar compliance") es un **prerrequisito**. El flujo correcto es: pestaña Compliance → "Aprobar compliance" (`POST .../compliance/approve` → 200) → recién entonces "Aprobar solicitud" registra. Recomendación: señalizar el prerrequisito en el panel de decisión (badge/estado "Compliance pendiente" que deshabilite o advierta antes del intento), no dejar que se descubra por el 422.
6. **Desfase de UI en Compliance.** `POST .../compliance/approve` devuelve 200 pero el panel de la pestaña sigue mostrando "Pendiente de aprobación regulatoria" hasta refrescar — refuerza la confusión del punto anterior (el analista no ve confirmación de que el gate se levantó).

### Ya conocidos (NO reportar como nuevos)
- **`***` / "Sin n\*\*\*" en la lista de la bandeja** — masking por lectores que leen la clave `applicant` en vez de `applicant_data`. En el **detalle** el nombre sí aparece correcto. *(Con Codex, zona `DBK-BANK-WORKFLOW`.)*
- Score 0 / "Riesgo no disponible" / "No calculado" / campos "No informado" en el expediente del banco — misma raíz de lectura (`applicant_data`).

### Verificar (posible regresión)
7. **"Tipo de contrato" siguió `disabled` en el bundle `dpl_FL4JPtKd`**, incluso editando activamente "Tipo de empleo" (descarta estado stale). El paso 1 avanzó por el valor `indefinido` heredado del draft, no por selección a mano. Firma idéntica a #437 (catalogs poblado, `catalogsLoading=false`). Un dealer con un Empleo genuinamente vacío todavía quedaría trabado. Conviene confirmar que #438 habilita el campo en un draft nuevo y vacío.

---

## 4. Datos usados en el recorrido (para reproducir)

- **Solicitante:** Cliente E1 Cierre QA · Cédula 001-1111111-8 · nac. 1985-01-15 · casado? single · tel 8095550101 · cliente.e1@qa-b1c.com · RD · Distrito Nacional / Santo Domingo de Guzmán
- **Empleo:** empleado privado · Empresa E1 SRL · ingreso 85.000 · deudas 3.000 (ajustado) · tipo de contrato `indefinido` (heredado, campo disabled)
- **Vehículo:** Toyota Corolla 2022 usado · precio RD$1,200,000 · plazo 48m · cuota inicial 200.000 · Dealer/Suplidor "AutoDealer QA"
- **Referencias:** María Pérez Gómez / Juan Rodríguez Peña / Ana Martínez Cruz (con dirección y teléfono cada una)
- **Decisión banco:** lender pilot · Aprobar · monto 1.000.000 · tasa 12% · plazo 48

---

*Log generado a partir de la corrida en vivo del 2026-08-29 sobre `ff0272b7`. Cada paso fue verificado en pantalla (screenshots + estado DOM/React + llamadas de red donde aplica).*
