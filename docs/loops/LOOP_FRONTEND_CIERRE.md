# LOOP FRONTEND · CIERRE DE LO QUE DEVIN ENCONTRO
## 2026-08-27

```text
REPO         csorianoai/nadakki-dashboard
BASE         main
PRESUPUESTO  8 interacciones con Cesar EN TOTAL
MODO         secuencial · un item por PR
```

**Por que existe:** dos dias de trabajo cerraron el backend. Devin recorrio la
pantalla por primera vez y encontro que **el ultimo tramo —el que ve la persona
que decide— tiene defectos que ningun reporte de agente habia visto.**

**Todo lo de aqui esta medido por Devin contra staging el 2026-08-27, con
comando y salida literal. No lo remidas: verificalo si dudas, pero no empieces
de cero.**

---

## F1 · EL SCORE 720 INVENTADO · lo primero

```text
CARPETA   components/credit-hub/primitives/ScoreVisual.tsx
          components/credit-hub/bank/BankDetailLayout.tsx
```

**Medido:**

```text
backend    /expediente/full  ->  "score": null
           /counter-offer    ->  422 score_not_computed
pantalla   gauge 720 · aria-label "Score 720, riesgo Medio" · badge "Riesgo bajo"

origen
  ScoreVisual.tsx:11        export function ScoreVisual({ score = 720,
  BankDetailLayout.tsx:277  <ScoreVisual score={analysis.score} size={132} />

analysis existe (trae pti, dti, ltv) · analysis.score NO existe
-> el parametro por defecto pinta 720
-> risk_level ausente pinta "Riesgo bajo"
```

**Por que es lo primero:** un analista que apruebe mirando ese 720 esta decidiendo
con un numero que **no existe en ninguna parte del sistema**. Y la cola de la
misma rama SI es honesta (`score_source: NOT_SCORED`, `score_is_absent: true`),
asi que las dos superficies se contradicen.

Es el `#38` del backend —"el motor ya no fabrica score"— movido de sitio: **el
backend dejo de fabricarlo y el frontend lo fabrica.**

```text
ALCANCE
  quitar el valor por defecto · la ausencia se muestra como ausencia
  el patron que el propio sistema ya usa en la cola: NOT_SCORED
  el badge de riesgo tampoco se inventa cuando risk_level falta

VERDE
  con score: null -> la pantalla dice que no hay score, NO pinta un numero
  con score real  -> lo pinta
  el badge de riesgo desaparece si risk_level es null
MUTACION
  restaurar score = 720 -> el test rompe
```

---

## F2 · LA BANDEJA DEL BANCO ESTA VACIA

```text
CARPETA   el fix es de BACKEND · services/credit/bank/bank_decision_engine.py
          zona DBK-BANK-WORKFLOW · NO es de este loop
```

**Medido:**

```text
el dashboard pide  queue?limit=20&offset=0  ->  total=0  ids=[]
el mismo token     queue?limit=50&offset=0  ->  total=1  ids=[a9900004]
                   queue (sin limit)        ->  total=1
                   queue?limit=20&offset=0  ->  total=0   (reproducible)

causa   cola_visible_para llama a list_bank_queue(limit, offset)
        y filtra por lender DESPUES de paginar
        la pagina 1 sale vacia aunque haya elementos visibles
        y el dashboard usa justo el limit que devuelve 0
```

```text
ESTE ITEM NO SE ARREGLA DESDE EL DASHBOARD
  el fix correcto es filtrar ANTES de paginar, en el backend
  BLOQUEADO_CRUZADO · va a un packet de DBK-BANK-WORKFLOW

LO QUE SI PODES HACER ACA, y decilo como paliativo:
  nada. Subir el limit en el cliente esconde el defecto sin arreglarlo
  y rompe con volumen. NO lo hagas.
```

---

## F3 · EL ROL `banker` NO ENTRA AL PORTAL DE BANCO

```text
CARPETA   lib/credit-hub/auth/portal-access.ts
```

**Medido:**

```text
login API de qa-analyst-assigned  ->  200, token valido
la pantalla                       ->  "Acceso no autorizado.
                                       Tu rol actual no tiene permiso
                                       para el portal banco."
localStorage                      ->  nadakki_role = banker

BANK_PORTAL_ROLES = new Set([
  "bank_analyst", "bank_admin", "compliance_officer",
  "credit_admin", "tenant_admin", "platform_superadmin", "admin",
])
```

**El backend emite `banker`. La lista no lo incluye.** Los dos analistas de banco
del sistema no pueden entrar al portal de banco.

Y eso tiene una consecuencia que Devin nombra bien: **todo el aislamiento por
lender esta detras de una puerta que solo abre para roles de acceso total.** Quien
trabaja es el rol que no esta acotado.

```text
ALCANCE
  agregar "banker" a BANK_PORTAL_ROLES
  y revisar DEALER_PORTAL_ROLES con el mismo criterio:
  hoy incluye "credit_admin", que NO es un dealer

VERDE
  qa-analyst-assigned entra al portal de banco
  qa-analyst-unassigned entra
  un dealer NO entra al portal de banco
MUTACION
  quitar "banker" de la lista -> el test rompe
```

**Medi los role_key que el backend emite de verdad** antes de escribir la lista.
No la escribas de memoria: `/api/v2/auth/me` devuelve `active_roles` con
`role_key` en minuscula.

---

## F4 · LA BOVEDA DE CREDENCIALES REVIENTA

```text
CARPETA   components/activation/CredentialVaultView.tsx
```

**Medido:**

```text
Runtime TypeError: Cannot read properties of undefined (reading 'length')
CredentialVaultView.tsx (369:31)
> 369 |   {data.credentials.length} credencial(es) configurada(s)

la API devuelve un ARRAY:
GET /api/v2/institucion/credenciales
200 [{"id":"c47ebd6e-…","provider":"onb-g6-provider-…","environment":"LIVE", …}]

el componente espera { credentials: [...] }
```

**La pantalla completa se cae.** Y es la pantalla a la que el propio mensaje del
pre-screening manda al usuario para cargar la credencial del buro.

```text
ALCANCE
  alinear el contrato · la UI consume el array que la API devuelve
  no cambies el backend: el array es la forma correcta

VERDE
  la pagina pinta la lista de credenciales
  el boton "probar conexion" llama a .../credenciales/{id}/probar
  y muestra el resultado real, no un mock
MUTACION
  volver a data.credentials -> el test rompe
```

---

## F5 · ABRIR EL DETALLE RECLAMA LA SOLICITUD

```text
CARPETA   hooks del detalle de banco · useBankApplication
```

**Medido:** la pagina dispara el claim al montarse. **No hay boton de reclamar.**

```text
POR QUE IMPORTA
  un supervisor que mira un caso se lo queda
  con credit_admin basta abrir la URL
  y Devin midio que credit_admin reclama incluso lo que su cola
  NO le muestra (a9900002 -> claim 200, detalle para el analista 404)

ALCANCE
  reclamar es un acto explicito del analista: un boton
  abrir el detalle NO reclama

VERDE
  abrir el detalle de una solicitud sin reclamar -> no crea claim
  el boton "Reclamar" existe y al pulsarlo crea el claim
  tras reclamar, el detalle sigue accesible
MUTACION
  restaurar el claim automatico -> el test rompe
```

---

## F6 · NINGUNA PANTALLA DICE QUE LA DECISION ES SIMULADA

```text
CARPETA   la tarjeta de oferta del dealer · comparador
```

**Medido:** la API lo declara y la pantalla no lo muestra.

```text
la API devuelve, sobre 1a302a03:
  "note": "Ningun banco reviso esta solicitud. La decision la produjo un
           adaptador simulado en el propio servicio, sin peticion saliente."
  "simulated": true
  "source_system": "PILOT_BANK_MOCK"
  "adapter_operation_mode": "MOCK-SANDBOX"
  reason_codes: ["PILOT_MOCK_SANDBOX", "NO_BANK_PILOT_URL"]

la pantalla del dealer muestra:
  "★ MEJOR · Pilot · 12.0% APR · ahorras RD$410,807"
  los lenders se llaman literalmente "Mock" y "Pilot"
  ninguna marca de simulacion
```

**El detalle del banco SI avisa** (`DEMO · KYC: DATOS SIMULADOS · OCR: DATOS
SIMULADOS`) — eso ya funciona y es lo mejor de esa pantalla. **El del dealer, que
es el que habla con el cliente, no.**

```text
ALCANCE
  llevar la declaracion a la tarjeta de oferta del dealer
  si simulated: true -> la tarjeta lo dice, visible, no en un tooltip
  el "ahorras RD$410,807" no se presenta como real si la oferta es simulada

VERDE
  con simulated: true -> la tarjeta lo declara
  con una oferta real -> no aparece la marca
MUTACION
  quitar la comprobacion -> el test rompe
```

---

## F7 · EL FORMULARIO DIAGNOSTICA MAL

```text
CARPETA   la pantalla de login
```

**Medido hoy por Cesar:**

```text
email inexistente  ->  el backend responde  401 {"detail":"Invalid credentials"}
la pantalla dice   ->  "Error de red (TypeError: Failed to fetch)"
```

Y el mismo mensaje aparece cuando la CSP bloquea la llamada, que es un problema
completamente distinto.

```text
ALCANCE
  distinguir: respuesta del servidor con codigo vs fallo de red real
  401 -> "credenciales invalidas"
  fallo de red -> el mensaje de red, con la URL

VERDE
  con credencial mala -> mensaje de credencial
  con backend inalcanzable -> mensaje de red
MUTACION
  colapsar los dos casos -> el test rompe
```

**Un mensaje que diagnostica mal cuesta mas que el bug.** Paso hoy con el gate de
Dependabot: el `except` culpaba al token y la causa era un parametro de
paginacion. Costo un dia.

---

## F8 · LA CSP BLOQUEA EL BACKEND DE STAGING

```text
CARPETA   next.config.js:143
```

**Medido:**

```text
connect-src 'self' https://api.nadakki.com wss://api.nadakki.com
            https://*.sentry.io https://vitals.vercel-insights.com

desde staging-dashboard.nadakki.com el navegador BLOQUEA la llamada a
nadakki-ai-suite-staging.onrender.com antes de emitirla
-> "Failed to fetch" sin codigo HTTP

el backend esta bien:
  el mismo login desde PowerShell -> token de 577 chars
  preflight OPTIONS -> 200 con access-control-allow-origin correcto
```

**Y esto explica el `BLOCKED_BROWSER_NETWORK` de `#408`:** se descartaron cinco
hipotesis —backend, handler, CORS, preflight, construccion de la peticion— y
ninguna miro la CSP.

```text
ALCANCE
  connect-src deriva del mismo origen que resolveBackendUrl()
  NO una lista escrita a mano
  es el mismo defecto del P0 —lista fija apuntando a produccion—
  en otro fichero

VERDE
  desde staging-dashboard.nadakki.com el login devuelve token
  desde dashboard.nadakki.com sigue funcionando contra produccion
MUTACION
  volver a la lista fija -> el test rompe
```

---

# ORDEN

```text
1  F1  el score 720          decisiones de credito sobre un numero inexistente
2  F3  el rol banker         el usuario real no puede entrar
3  F8  la CSP                sin esto no se puede probar nada en staging
4  F4  la boveda             sin esto el buro no se conecta nunca
5  F7  el mensaje del login  barato y evita perder dias
6  F5  el claim automatico   la cola de un equipo se ensucia sola
7  F6  la marca de simulado  bloquea la venta, no el uso
```

**F2 no entra: es de backend, zona `DBK-BANK-WORKFLOW`.**

---

# REGLAS

```text
un item por PR · base main
contar casos VERDE declarados == tests que los cubren
mutacion EJECUTADA, no declarada de memoria

CERRAR CONTRA LA PANTALLA, no con tests verdes
  el defecto del score paso todos los tests del sprint
  y solo aparecio mirando la pantalla con datos reales detras

si la premisa del brief no se sostiene: PARAS y reportas
  no improvisas el arreglo

GR-11 Cesar mergea · GR-12 <=500 LOC y <=2 directorios
```

---

# LO QUE DEVIN NO PUDO VERIFICAR · y por que importa

```text
ningun login de dealer funciona
  qa-dealer-a y qa-dealer-b dan 401 con la contrasena del packet
  -> TODO el recorrido del portal del dealer se hizo con credit_admin,
     que tiene acceso total al tenant
  -> "un dealer no ve lo de otro dealer" NO ESTA MEDIDO

Eso es lo mas caro del informe. El pie del cockpit lo AFIRMA
—"las solicitudes de otros dealers permanecen ocultas por diseno"—
y una afirmacion en el footer no es una medicion.
```

**Antes de cerrar este loop, hay que crear una credencial de dealer que
funcione.** Es de Cesar, no del agente.

---

**Generado por IA. Todo medido por Devin contra staging el 2026-08-27, con
comando y salida literal.**
