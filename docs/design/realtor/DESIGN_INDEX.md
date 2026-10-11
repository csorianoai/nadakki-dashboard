# Nadakki Realtor OS — DESIGN_INDEX

Censo: 2026-10-11. Encargo V3, exclusivamente G2-PANEL-ALTA.
Este índice registra evidencia; no redefine contratos ni concede acceso.

Base frontend: `5c7acd85ef5b3185948e2b4fa8f1ebbaedc7146e` (origin/main actualizado).
Rama: `codex/realtor-g2-alta-authorities`.
Snapshot backend main consultado: `cfb5c3334c4a0002aacf1556bda50dd5713a1d36`.
Índice contractual: `superloop/config/realtor_ola1.json` en ese snapshot.
Los SHAs siguientes son commits completos; los SHAs de blob no son versiones contractuales.

## Pantallas

| Tarea | Ruta frontend | Contratos consumidos | Versión contractual | Referencia visual | Versión de diseño | Implementación | PR | HEAD |
|---|---|---|---|---|---|---|---|---|
| G2-PANEL-ALTA | Pendiente; no creada dentro de app/realtor/ | C-RE-KERNEL; C-RE-ALTA (censo, sin consumo runtime) | KERNEL 1.0.0 congelado; ALTA 1.0.0 parcial en main; OpenAPI provisional #1826; ver autoridades | Design Loop no localizado ni proporcionado | Identificador pendiente; DESIGN_IN_REVIEW | BLOCKED; dependencia de seguridad; CONTRACT_PENDING contractual | [#772, draft documental](https://github.com/csorianoai/nadakki-dashboard/pull/772) | Sin HEAD de pantalla; snapshot documental 9725917c8f6e62d8036a4153faf910fdb75e2717 |
| DR-PANEL | Pendiente; no creada | C-RE-KERNEL; DR-CONTRATO (solo registro) | Parte 1/2 en main en cfb5c3334c4a0002aacf1556bda50dd5713a1d36; API pendiente | No proporcionada | Identificador pendiente; DESIGN_IN_REVIEW | BLOCKED; ejecución no autorizada | — | — |
| G2-WEB-AGENTE | Pendiente; no creada | C-RE-KERNEL; C-RE-ALTA (solo registro) | ALTA incompleto; mismas autoridades que el alta | No proporcionada | Identificador pendiente; DESIGN_IN_REVIEW | BLOCKED; ejecución no autorizada | — | — |

No hay pantalla construida, BUILDER_READY, READY_FOR_AUDIT ni aceptación.
El snapshot documental identifica el commit inicial del censo; el HEAD vigente figura en el PR.
El HEAD documental del PR no representa una pantalla auditada.
El índice se actualizará con ruta, diseño y HEAD de implementación cuando existan.

## Autoridades y precedencia

Repositorio de todas las autoridades: `csorianoai/nadakki-ai-suite`.
Versión consultada de archivos en main: `cfb5c3334c4a0002aacf1556bda50dd5713a1d36`.

| ID | Ruta exacta | Commit consultado | PR asociado | Estado y alcance |
|---|---|---|---|---|
| C-RE-KERNEL | docs/contracts/C-RE-KERNEL/schema.json | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | #1804; cierre API #1807 | 1.0.0 congelado en main; tipos y restricciones |
| C-RE-KERNEL | docs/contracts/C-RE-KERNEL/openapi.yaml | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | #1807 mergeado: cec7f79dc09b7f18717062f50ec6cd498198a19f | 1.0.0 congelado en main; API |
| C-RE-KERNEL | docs/contracts/C-RE-KERNEL/events.yaml | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | Paquete C-RE-KERNEL; asociación individual no verificada | 1.0.0 congelado en main; eventos |
| C-RE-ALTA | docs/contracts/C-RE-ALTA/schema.json | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | #1811 mergeado: db4f244cda06bbd5a51832bc48691c69b7616311 | Parte 1/4 en main; contrato completo todavía pendiente |
| C-RE-ALTA | docs/contracts/C-RE-ALTA/openapi.yaml | f2120c48d9095e5f9a604a94ef9134c9d81fd785 | #1826 abierto | Parte 2/4 provisional; 301 líneas; faltan components y rutas posteriores |
| C-RE-ALTA | docs/contracts/C-RE-ALTA/events.yaml | f2120c48d9095e5f9a604a94ef9134c9d81fd785 | #1826 abierto | 13 eventos provisionales; diff real leído |
| DR-CONTRATO | services/real_estate/intel/contrato_radar.py | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | #1821 mergeado en ese commit | Parte 1/2 en main; tipos y validaciones; OpenAPI/schema/migración de parte 2 pendientes |
| Propuesta ola 2 | docs/audits/REALTOR_OS_CONTRATOS_OLA2.md | cfb5c3334c4a0002aacf1556bda50dd5713a1d36 | #1814 mergeado: fa33f7ad1dc27f2a3f08cebededb8bd23686e4c0 | PROPUESTA publicada en main; no congela contratos |
| G1-AUTONOMIA | services/real_estate/kernel/autonomy/engine.py | 33a89059013e71f1269c02e751e88aa8984993f1 | #1819 abierto | Parte 1/2; motor puro; no es autorización HTTP ni permiso de acceso |

#1826 sustituye #1825; su descripción identifica las partes 3/4 y 4/4 pendientes.
La búsqueda de PRs C-RE-ALTA no localizó PRs independientes para esas dos partes.
No se declara que el contrato completo esté congelado.
Antes de construir se releerán main y los HEADs de los PRs; este censo es un snapshot.

### Datos, estados, permisos e invariantes aplicables

- KERNEL: ProfessionalLicense exige holder_person_id, jurisdiction_code, license_type y license_number (1–64).
  license_type procede del pack licensing. Registro deja pending_verification; no implica comprobación oficial.
- LicenseStatus: pending_verification, verified, rejected, suspended, expired, revoked.
  Verificación y estado son readOnly en ProfessionalLicense; la interfaz no concede verificación.
- API KERNEL: Bearer y X-Tenant-ID; discrepancia con JWT da TENANT_MISMATCH; cuerpos no fijan tenant.
  Escrituras exigen Idempotency-Key, salvo evaluateAutonomy, que no tiene efectos.
- ALTA: TenantKind agent/brokerage; OnboardingStepCode tenant_profile, brokerage_record,
  principal_license, agent_profile, agent_license, supervision, brand, activation.
  OnboardingStepStatus pending/done/blocked. Los cuatro pasos visuales no son estos códigos contractuales.
- AgentStatus draft/pending_approval/active/suspended/offboarded;
  BrokerageStatus draft/pending_verification/active/suspended/closed;
  BrandStatus draft/pending_approval/published/unpublished.
- AgentCreate exige person_id, display_name (1–128), jurisdiction_code, language;
  brokerage_id es opcional. BrandCreate exige owner_kind, owner_id, display_name (1–128),
  public_slug, languages; tagline hasta 160 y bio hasta 2000.
- ALTA provisional: /onboarding recalcula pasos desde entidades reales; tenant_member para lectura,
  tenant_owner para submit; rol e identidad desde JWT, nunca del body.
  API incompleta no demuestra rutas desplegadas ni autoriza persistencia.
- KERNEL y ALTA requieren X-Tenant-ID, mientras el encargo prohíbe tenant elegido/enviado por frontend.
  Hace falta un mecanismo servidor autorizado que derive contexto desde sesión y valide el tenant;
  no se resolverá con un selector ni localStorage como autoridad.
- Channel KERNEL enumera email, sms, whatsapp, voice_call, push, postal, in_app.
  Ese enum no concede integración. Meta/WhatsApp y cualquier canal sin autorización real: UNAVAILABLE.
- Autonomía: default-deny, alcance tenant/brokerage/rol/canal/propósito/plantilla/caducidad;
  kill switch ilegible deniega. No sustituye permisos de acceso al core.
- DR: rent/sale; relative_interest, absolute_volume, transactions, estimate independientes.
  LIVE/HISTORICAL/ESTIMATED/DEMO/UNAVAILABLE con procedencia. Sin señal CRM identificada
  en esta parte del contrato; se registrará petición antes de DR-PANEL, cuando se autorice.
- Ola 2 es propuesta: no concede permisos a Listing/Buyer Director ni equipos de IA.
  Fair Housing, consentimiento y acciones reservadas siguen sujetos a contratos y autorización.

## Seguridad y zonas

DECISION=BLOCKED
REASON=BLOCKED_SECURITY_DEPENDENCY

Evidencia frontend en la base citada:
- lib/auth/token-storage.ts: access token en memoria del navegador; refresh token en localStorage.
- lib/auth/auth-context.tsx: AuthProvider cliente; getMeV2 verifica sesión desde navegador.
- lib/api/auth-v2.ts: GET /api/v2/auth/me devuelve usuario, current_tenant y active_roles.
  TenantInfo documenta subscribed_cores e is_demo, no una autorización de preview Realtor.
- middleware.ts reconoce Authorization y cookie legacy nadakki_sic_token; se leyó, sin cambios.
  Esto no demuestra que el login actual entregue sesión verificable al layout servidor.
- Backend routers/auth_v2_router.py: /me resuelve current_tenant desde tenant_id del JWT.
  services/auth_v2_service.py: is_demo procede de tenant_feature_flags; subscribed_cores de cores_enabled
  (superadmin recibe todos los cores habilitados). is_demo no prueba permiso de piloto Realtor.

No se verificó una combinación existente de sesión servidor, permiso Realtor y autorización backend
de tenant de prueba que cumpla las cuatro condiciones del encargo dentro de app/realtor/layout.tsx.
La falta de evidencia no se convierte en permiso. No se inventan nombres de roles, flags ni endpoints.
No se creó layout, ruta, flag ni formulario. No se activó configuración de Vercel.
No hay capacidades nuevas expuestas ni datos DEMO.

CONTRACT_REQUEST=Identificar mecanismo existente verificable de sesión para layout servidor,
confirmación backend del tenant de prueba autorizado para Realtor y vocabulario de permisos/core;
definir puente servidor que derive tenant del JWT para contratos con X-Tenant-ID.
NEXT_ACTION=Responsables de Platform/Auth y contratos aportan rutas, implementación y evidencia
de ese mecanismo. El orquestador aporta Design Loop identificable. Repetir fase B antes de implementar.

ZONES.yaml backend (mismo snapshot) declara DASH-REALTOR, DASH-REALTOR-WEB y DASH-REALTOR-INTEL
con repo nadakki-dashboard y write vacío intencional. No se trasladan rutas backend al dashboard.
El encargo autoriza app/realtor/**, components/realtor/**, lib/realtor/**, tests/realtor/**,
e2e/realtor/** y docs/design/realtor/**. Esta entrega solo añade este índice.
Un cambio necesario en auth global, middleware o layout raíz requeriría otra zona y responsable:
DECISION=BLOCKED_OUT_OF_ZONE si esa solución fuera exigida. No se realiza tal cambio aquí.

## Diseño

No se recibió referencia visual, versión ni aceptación del Design Loop.
Búsqueda local sin coincidencias Realtor en app/lib y en _design/docs/_design_p11_audit.
docs/design/ no existía antes de esta entrega; búsqueda GitHub de Realtor en dashboard sin resultados.
DESIGN_IN_REVIEW significa aprobación pendiente, no que se haya revisado una imagen disponible.
No se inventan doce centros ni una identidad visual sin referencia.

## Evidencia de pruebas

No hay pantalla implementada. Las lecturas y comprobaciones documentales no son pruebas de navegador.
El ejecutor local tuvo fallos intermitentes helper_unknown_error; los comandos exitosos se distinguen.

| Comprobación | Resultado | Alcance / limitación |
|---|---|---|
| git fetch origin main | PASS | Referencia actualizada a la base frontend citada |
| git status --short inicial | PASS | Sin modificaciones iniciales |
| Rama desde origin/main; git rev-parse HEAD | PASS | HEAD inicial coincide con base completa |
| Lectura de contratos y PR #1826 | PASS | GitHub; snapshot y diff real; no runtime |
| git diff --cached --check final del censo inicial | PASS | Tras corregir línea vacía al final; control documental, no prueba UI |
| Render datos válidos, loading, empty, error, UNAVAILABLE | BLOCKED | Pantalla detenida por dependencia de seguridad |
| Flag apagado, tenant ajeno, usuario sin permiso, sesión expirada | BLOCKED | Falta mecanismo verificable; ninguna prueba runtime ejecutada |
| Ausencia DEMO en producción | NOT_EXECUTED | No entorno productivo consultado; entrega sin datos ni código |
| Navegación escritorio y móvil 390 px | NOT_EXECUTED | Sin pantalla ni capturas |
| Accesibilidad básica y teclado | NOT_EXECUTED | Sin pantalla |
| Validación de formularios y ES/EN | BLOCKED | Sin formulario; diseño y dependencias pendientes |
| Ausencia de acciones falsas | NOT_EXECUTED | No prueba UI; entrega documental sin botones |
| Progreso cuatro pasos, validación por etapa, bloqueo de avance | BLOCKED | Sin asistente |
| Estados de licencia y broker; canales no autorizados | BLOCKED | Sin interfaz ni integración |
| Persistencia confirmada; backend fallido sin éxito ficticio | BLOCKED | Ninguna operación backend ejecutada |
| Protección fail-closed | BLOCKED | No se acredita con un bloqueo cliente o flag público |
| Capturas escritorio / móvil | NOT_EXECUTED | No existen; no se adjuntan |
| Unitarias, E2E y CI de esta entrega | NOT_EXECUTED | No se declaran PASS por lecturas documentales |

No se solicitan VISUAL_ACCEPT ni TECH_ACCEPT. Sin merge y sin escrituras backend.
