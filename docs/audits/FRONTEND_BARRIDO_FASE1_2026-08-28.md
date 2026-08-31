# Barrido Frontend - Fase 1

Fecha: 2026-08-28  
Repositorio: `csorianoai/nadakki-dashboard`  
Base solicitada: `staging`  
Entorno observado: `https://staging-dashboard.nadakki.com`  
Backend observado: `https://nadakki-ai-suite-staging.onrender.com`

## Alcance y metodo

Esta entrega es solo el censo. No contiene cambios de codigo ni PR de
correccion. Se separa la evidencia del navegador de la inspeccion estatica.

La captura anonima de las rutas protegidas solo produjo el redirect a
`/login` y el `GET /health`. Un login de analista produjo `POST
/api/v2/auth/login` `200`, pero la inicializacion hizo `POST
/api/v2/auth/refresh` y la sesion termino nuevamente en `/login`; por eso no
se certifican como recorridos completos los caminos protegidos. El login de
dealer probado devolvio `401` `{"detail":"Credenciales inválidas."}`; no se
usa ese resultado como defecto de producto porque no se dispuso de su
contraseña. Se verificaron las rutas indicadas para `CREDS.env` en el entorno
compartido (`nadakki-ai-suite/CREDS.env`, `creds.env`, `scripts/uat/CREDS.env`
y equivalentes) y ninguna existe; por eso no se puede repetir C1/C4 con un
dealer sin inventar o exponer una credencial.

### Anexo de medicion de sesion (2026-08-28)

Se repitio el login con una sesion nueva y se consulto el refresh directamente
contra el backend, manteniendo los tokens solo en memoria:

| Operacion | Resultado |
|---|---|
| `POST /api/v2/auth/login` desde navegador | `200`; JSON con `access_token`, `refresh_token`, `expires_in=900`, `user_info`, `tenant_info`, `active_role` y `mfa_required`. |
| Persistencia del navegador | No se crearon cookies. El frontend guardo `nadakki_auth`, `nadakki_refresh_token_v2`, `nadakki_sic_token`, `nadakki_tenant_id` y `nadakki_role=banker` en `localStorage`. |
| `POST /api/v2/auth/refresh` desde navegador | Se emitio inmediatamente despues del login, pero el frontend navego a `/login?next=...` antes de observar una respuesta en la captura. |
| `POST /api/v2/auth/refresh` directo al backend con el refresh recien emitido | `200`; JSON con token nuevo, `token_type` y `expires_in=900`. |
| El mismo `POST` al proxy del dashboard | En la reprueba posterior: `200` y los mismos campos; en la captura inicial: `502` HTML. |

Esto discrimina un defecto real del entorno/backend de staging, no una perdida
de cookies entre navegaciones: el flujo no depende de cookies y los tokens si
persisten en `localStorage`. El access token tampoco estaba vencido: el login
declaro `expires_in=900` y el refresh se intento inmediatamente. La evidencia
actual incluye `refresh=502`, pero la llamada directa posterior al backend
respondio `200`. El handler local correspondiente es
`app/api/v2/[[...path]]/route.ts:18-67`: lee el body con `req.text()`, conserva
`Content-Type`, reenvia a `${BACKEND_URL}/api/v2/auth/refresh`, y convierte
errores de transporte en `502`. Queda como intermitencia o diferencia de
despliegue del BFF, no como defecto confirmado del backend.

El efecto observable es que `nadakki_auth` puede quedar almacenado mientras la
app vuelve a login; por eso ese flag no es prueba suficiente de sesion valida.
La intermitencia mantiene C3-C5 sin recorrido completo y bloquea la
certificacion del handoff a cola, ofertas y readiness.

La medicion permite descartar expiracion prematura (`expires_in=900`, refresh
inmediato) y perdida de cookies: el flujo usa `localStorage` y el contexto no
contiene cookies. La llamada directa al proxy devolvio `200` en la reprueba,
pero una captura posterior del dealer obtuvo `200` en refresh y `200` en
`GET /api/v2/auth/me`. El shell emitio despues `GET /api/v1/proyectos`, que
devolvio `500` con `UndefinedTableError: relation "proyectos" does not exist`;
la pantalla quedo bloqueada antes de completar el wizard. C3-C5 continuan sin
certificacion de extremo a extremo y C1/C4 tienen este bloqueo adicional.

La evidencia previa entregada para este loop sí se incorpora, identificada
como evidencia de navegador ya medida: F1, F3, F4, F5, F9, F11, F12 y F13
cerrados; F6 y F10 abiertos; documentos, audit trail, notificaciones y el
fan-out completo sin verificar.

## Caminos completos

### D5 - Acoplamiento del shell a Projects Core

La llamada que bloquea el portal no sale de una pantalla de proyectos. El
origen medido es el shell compartido de la aplicacion: tras autenticar al
dealer y abrir `/credit-hub/dealer/applications/new/applicant`, el navegador
emitio `GET /api/v1/proyectos`; el BFF respondio `500` con el cuerpo
`{"error":"Upstream error 500","details":"...UndefinedTableError... relation
\"proyectos\" does not exist..."}`. El componente de proyectos que usa esa
ruta vive bajo `components/proyectos/` y `app/proyectos/`; no forma parte del
flujo de credito.

El efecto es bloqueante: el shell queda en `Verificando sesion...`/no llega a
renderizar el wizard aunque el login, `POST /api/v2/auth/refresh` y `GET
/api/v2/auth/me` hayan respondido `200`. Projects Core no es requisito de C1,
C3, C4 ni C5. D5 es un defecto propio del frontend: una falla `500` de un core
ajeno no debe abortar el shell del portal de credito.

| Donde se corta | Que ve el usuario | Que dice el server |
|---|---|---|
| Inicializacion del shell, en `GET /api/v1/proyectos`, antes del primer paso visible del wizard | Pantalla bloqueada o cargando; no se puede completar C1/C4 | BFF `500`, `UndefinedTableError` por tabla `proyectos` inexistente en staging |

El criterio de D5 queda definido para Fase 2: el wizard debe renderizar y
permitir avanzar aunque `/api/v1/proyectos` devuelva `500`, y el portal de
credito no debe emitir esa llamada si no usa Projects Core. La mutacion es
restaurar la llamada bloqueante y verificar que el wizard vuelva a fallar.

### C1 - Dealer origina y despacha

| Donde se corta | Que ve el usuario | Que dice el servidor |
|---|---|---|
| El recorrido se corta antes del primer paso por D5: `GET /api/v1/proyectos` responde `500`. El codigo de submit confirma que, una vez superada la UI, el wizard llama a `POST /api/v2/credit/applications/{id}/applicant`, `.../vehicle`, `PATCH .../fields` y luego `POST .../process`, no al fan-out. | El dealer queda bloqueado en el shell; no puede llegar a despachar. La evidencia previa de F13 muestra que el write corregido persiste applicant, vehicle y fields, pero el fan-out BANK_FLOW completo sigue sin certificarse. | `POST .../process` es el ultimo request del submit y deja `0b20c4d2-...` en `COMPLETED` con cero ofertas. No hay llamada del wizard a `/api/v2/credit/multi-lender/execute` ni a `/credit/dispatch-multi` en `DealerWizardProvider.tsx:940-966`; por tanto el despacho actual procesa la solicitud pero no inicia el fan-out multi-lender. |

Requests del cliente identificados estaticamente: `GET /api/credit-hub/client-metadata`, `POST /api/v2/credit/applications`, `POST /.../applicant`, `POST /.../vehicle`, `PATCH /.../fields`, `POST /.../documents` y `POST /.../process`. La implementacion real de cada paso esta concentrada en `components/forge/credit-hub/dealer/DealerWizardProvider.tsx:762-1004`.

### C2 - Consentimiento remoto

| Donde se corta | Que ve el usuario | Que dice el servidor |
|---|---|---|
| Evidencia de navegador ya medida: `POST /consent/{application_id}/initiate` devolvio `200` con `{"method":"EMAIL","status":"SENT",...}`; al abrir el link la pagina no emitia `GET /api/v2/credit/consent/{token}/status` y mostraba el rechazo. | `Este enlace no es válido o ha expirado`, aunque el token tenia unas 23.9 h restantes. El dealer posteriormente ya puede ver y copiar el link, segun la reverificacion entregada. | `GET /api/v2/credit/consent/{token}/status` devolvio `200 {"status":"SENT"}`. El servidor consideraba el token utilizable; la decision incorrecta era del cliente desplegado. |

La captura de un token controlado en staging reprodujo la ausencia de
`/status`. En el checkout local de esta rama, `app/(public)/consent/[token]/page.tsx:56-61`
si llama a `getStatus`; `lib/credit-hub/api/public-consent-client.ts:78-86`
tambien valida estado antes de cargar la vista. Eso demuestra una diferencia
entre el codigo local y el deploy observado, no el cierre del camino.

### C3 - Analista trabaja

| Donde se corta | Que ve el usuario | Que dice el servidor |
|---|---|---|
| En la medicion actual, despues del login `200`, el frontend hace refresh y vuelve a `/login`; no se alcanzo cola, detalle, claim ni decision. | La pantalla vuelve al formulario de login. No se observo el mensaje anterior de timeout durante esta captura. | `POST /api/v2/auth/login` respondio `200`; la sesion no quedo utilizable para la navegacion siguiente. El cuerpo del refresh no se incluye porque contenia token. |

Contratos de las etapas posteriores identificados en OpenAPI: `GET
/api/v2/credit/applications/queue`, `GET /api/v2/credit/applications/{id}`,
`POST /api/v2/credit/applications/{id}/claim` y `POST
/api/v2/credit/applications/{id}/decide`. Claim y decide no se ejecutaron para
no mutar la cola durante el censo.

### C4 - Dealer recibe y compara

| Donde se corta | Que ve el usuario | Que dice el servidor |
|---|---|---|
| No se pudo abrir la pantalla autenticada con la cuenta de dealer disponible. La inspeccion del cliente muestra dos caminos: el detalle usa el listado legacy `/credit/applications/{id}/offers`, y la tarjeta de detalle fuerza un badge `REAL`. | En la evidencia entregada, sobre `1a302a03-...`, la UI mostraba `Exchange multi-banco [REAL]` y ofertas `Mock 17.00%` y `Pilot 12.00%`, aunque ambas tenian `simulated: true`. | El expediente tenia dos ofertas persistidas; la respuesta de `/credit/applications/{id}/offers` contenia la procedencia simulada. No se ejecuto aceptar/rechazar. |

Referencias: `components/credit-hub/dealer/DealerApplicationDetailView.tsx:304-315`
renderiza `DataTruthBadge level="REAL"`; el comparador tambien deriva REAL
de `offers.length` en `components/credit-hub/dealer/elite/OfferComparatorSpotlight.tsx:47`.

### C5 - Institucion configura

| Donde se corta | Que ve el usuario | Que dice el servidor |
|---|---|---|
| No se alcanzo la pantalla autenticada de activacion porque la sesion de QA se perdio durante refresh. No se cargaron credenciales ni se ejecuto una prueba de conexion. | No medido en esta corrida. | OpenAPI publica `GET /api/v2/institucion/credenciales`, `POST /api/v2/institucion/credenciales`, `POST /api/v2/institucion/credenciales/{credential_id}/probar`, `GET /api/v2/institucion/readiness` y `GET /api/v2/institucion/production-gates`. |

El cliente usa `components/activation/CredentialVaultView.tsx:25-53` y
`components/activation/ReadinessView.tsx:23`; la ruta de prueba publica no
requiere cuerpo segun OpenAPI. La ausencia de ejecucion aqui no prueba que
el backend falle.

## Censo de contratos

La fuente es el OpenAPI vivo consultado el 2026-08-28. Como es JSON remoto y
no un archivo con numeracion estable, se cita `path + metodo + schema`.

| Request emitido o previsto | OpenAPI | Contrato observado |
|---|---|---|
| `POST /api/v2/credit/applications` | Si, schema `CreditApplicationCreate` | Requiere `application_payload`; permite `initial_state=DRAFT`. Coincide con `createDraftApplication`. |
| `POST /api/v2/credit/applications/{id}/applicant` | Si, `ApplicantDataRDV2` | Campos planos; `name`, `national_id`, `fecha_nacimiento`, `estado_civil`, entre otros. |
| `POST /api/v2/credit/applications/{id}/vehicle` | Si, `VehicleDataRDV2` | Campos planos; `vin`, `make`, `model`, `year`, etc. |
| `PATCH /api/v2/credit/applications/{id}/fields` | Si, `EditFieldsRequest` | Requiere envoltorio `{"changes": object}`. El cliente local ya lo construye en `lib/credit-hub/api/operationalClient.ts:26-46`. |
| `POST /api/v2/credit/applications/{id}/process` | Si, `CreditApplicationProcess` | Requiere `mode`; `dry_run` opcional por default `true`. |
| `POST /api/v2/credit/applications/{id}/documents` | Si, `DocumentUpload` | Requiere `document_type` y `filename`; `content_base64` o `url` opcionales. |
| `POST /api/v2/credit/consent/{id}/initiate` | Si, `ConsentInitiateRequest` | Requiere `method` en `PRESENT`, `WHATSAPP`, `EMAIL`, `SMS_OTP` o `SELFIE`; email/phone opcionales. |
| `GET /api/v2/credit/consent/{token}/status` | Si | Sin cuerpo. La página desplegada no lo emitia en la evidencia C2. |
| `POST /api/v2/credit/consent/{token}/accept` | Si, `ConsentAcceptRequest` | Requiere `consents_accepted` no vacio y `full_name`; OTP/selfie opcionales. |
| `GET /credit/applications/{id}/offers` | Si | Ruta legacy sin prefijo `/api/v2`; el cliente la usa deliberadamente en `lib/credit-hub/api/offersClient.ts:110-111`. |
| `POST /api/v2/credit/applications/{id}/offers/{offer_id}/accept` | Si | Sin cuerpo requerido. |
| `GET /api/v2/credit/applications/queue` | Si | Sin cuerpo. |
| `POST /api/v2/credit/applications/{id}/claim` | Si, `ClaimRequest` | Requiere `analyst_id`; `lender_code` opcional. |
| `POST /api/v2/credit/applications/{id}/decide` | Si, `DecideRequest` | Requiere `decision_type` (`APPROVE`, `REJECT`, `COUNTER`) y `reason_codes` no vacio. |
| `POST /api/v2/institucion/credenciales/{id}/probar` | Si | Sin cuerpo requerido. |

Nota: OpenAPI tambien publica `/credit/dispatch-multi` y
`/api/v2/credit/multi-lender/execute`, pero el frontend censado no los emite
desde el wizard en las referencias revisadas. La existencia del path no es
evidencia de que el despacho completo se haya ejecutado.

## Datos fabricados o con riesgo de parecer reales

| Item | Fuente | Riesgo |
|---|---|---|
| Badge `REAL` en ofertas | `components/credit-hub/dealer/DealerApplicationDetailView.tsx:310`; hardcoded para cualquier lista no vacia | MIENTE: se observa sobre ofertas `simulated: true`. |
| Badge derivado de cantidad de ofertas | `components/credit-hub/dealer/elite/OfferComparatorSpotlight.tsx:47` | MIENTE: `offers.length` no prueba que un banco haya respondido. |
| `REAL` en superficies genericas del wizard | `components/credit-hub/dealer/wizard/DealerWizardFrame.tsx:97`; `WizardCompletenessBar.tsx:18` | Riesgo de presentar como real el estado del proceso, no solo la procedencia de una oferta. Debe decidirse por dato de servidor. |
| Score numerico por defecto | F1 ya cerrado y verificado en pantalla | No reabierto en esta fase; mantener como regresion a vigilar. |

Los valores `87` encontrados en `lib/vehicles.ts` son datos de catalogo/demo,
no se clasifican aqui como score crediticio sin evidencia de que lleguen a una
decision.

## Mensajes que diagnostican mal

| Texto literal | Condicion / fuente | Clasificacion |
|---|---|---|
| `Este enlace no es válido o ha expirado` | Se mostro para un token cuyo servidor respondia `status=SENT` y expiracion de unas 23.9 h; UI desplegada no consultaba `/status` | CONFUNDE y bloquea C2. |
| `Error de red (Failed to fetch)` | Evidencia previa: respuesta HTTP `401 Invalid credentials` del backend se presentaba como error de red | CONFUNDE C3/login. |
| `Inténtalo de nuevo en un momento.` | Evidencia previa: 404 de autorizacion mostrado como falla pasajera | CONFUNDE; requiere conservar distincion permanente/transitoria. |
| JSON crudo con `code=FIELD_UNKNOWN` | Evidencia F13: el toast mostraba el objeto de error del servidor | CONFUNDE C1; el codigo debe convertirse a copy accionable. |
| `El servidor no respondió a tiempo` | Evidencia previa: sesion expirada `401` se reportaba como timeout; F11 ya fue corregido y verificado | Regresion a vigilar, no nuevo hallazgo medido en esta corrida. |

## Estado local contra servidor

| Dato | Donde vive | Resultado medido |
|---|---|---|
| Borrador del wizard | `components/forge/credit-hub/dealer/DealerWizardProvider.tsx:430-458,762-797`; `lib/credit-hub/dealer/wizard-draft-storage.ts` | Se conserva en `localStorage` y tambien se intenta persistir al servidor. La evidencia F9 anterior comprobo que antes del arreglo los datos quedaban solo localmente; el estado corregido necesita una nueva prueba de cerrar/descartar storage para certificarse en este censo. |
| ID del borrador | `DealerWizardProvider.tsx:430-438,762-785` | Se guarda en `localStorage`; si se borra el estado local, la UI pierde la referencia aunque el servidor pueda conservar el DRAFT. Riesgo de expedientes huérfanos. |
| Archivos seleccionados | `DealerWizardProvider.tsx:412` | Los `File` no son serializables a `localStorage`; quedan solo en memoria hasta upload. Cerrar pestaña pierde el adjunto local. |
| Consentimiento y metadatos de firma | `DealerWizardProvider.tsx:258-287,797-877` | El formulario se serializa localmente y el backend recibe el consentimiento solo por el camino de la API. No se verifico en esta corrida el expediente server-side despues de descartar storage. |
| Notificaciones, audit trail y documentos | Rutas OpenAPI: audit trail, documents y notifications | La evidencia entregada dice audit trail vacio, 0/9 adjuntos servibles y cero notificaciones. No se repitio mutando staging. |

## Priorizacion

### BLOQUEA EL CAMINO

1. C2: el link EMAIL valido es rechazado por el cliente desplegado porque no
   consulta el estado del servidor.
2. C1: el fan-out BANK_FLOW completo no tiene evidencia de ofertas nuevas para
   `0b20c4d2-...`; falta determinar si el despacho no corrio o si no debe crear
   ofertas en ese estado.
3. C5: el censo en navegador no pudo superar login/refresh, por lo que la
   operacion de credenciales y readiness no esta certificada.

### MIENTE

1. C4: `REAL` sobre ofertas simuladas, por dos fuentes independientes:
   detalle y comparador.
2. El estado local del wizard puede hacer parecer completado un expediente
   que el servidor no recibió; F13 fue la evidencia de esta familia.
3. C1: cualquier cartel de despacho debe depender de estado server-side; el
   censo previo ya encontro el texto estatico de notificacion, corregido para
   DRAFT pero sin prueba del efecto final del despacho.

### CONFUNDE

1. Rechazo de consentimiento valido como link expirado.
2. `401` presentado como `Failed to fetch`.
3. `404` de autorizacion presentado como reintento temporal.
4. JSON crudo del `FIELD_UNKNOWN` en toast.

### MEJORA

1. Servir y verificar los nueve adjuntos con bytes y estado persistido.
2. Auditar el audit trail y notificaciones desde el servidor.
3. Eliminar o acotar estados locales que sobreviven a una sesion sin respaldo
   confirmado en backend.

## Limites y siguiente fase

La Fase 1 queda parcialmente medida en los segmentos protegidos: el problema
de sesion impidio completar C3, C4 y C5 con navegador. No se inventan cuerpos
de error para requests no emitidos ni se ejecutaron acciones mutantes de
claim, decision, accept, upload o test de credenciales.

No se abrio PR de codigo. La Fase 2 requiere aprobacion de la lista y debera
abrir un PR por camino; cada PR debe probar el efecto final en servidor y
repetir el recorrido completo, incluyendo los caminos no tocados.
