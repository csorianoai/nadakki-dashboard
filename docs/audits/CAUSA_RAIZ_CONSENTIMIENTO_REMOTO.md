# CAUSA RAIZ · el consentimiento remoto · 31 agosto 2026

## El defecto, tras diez vueltas

    NEXT_PUBLIC_API_URL = "https://api.nadakki.com"
      resuelve a nadakki-api-east.onrender.com
      y devuelve HTTP 500 · password authentication failed

    el cliente publico pide a ese host ABSOLUTO
      el CSP no lo permite -> "Failed to fetch"
      el navegador NO emite la peticion

    el .catch sin discriminar lo convierte en
      "Este enlace no es valido o ha expirado"

Ese disfraz es el defecto de fondo: un fallo de red y de
configuracion presentado al usuario como un token vencido.

## Por que nueve intentos no lo encontraron

    atacaron: token, pathname, hidratacion, AppGate
    ninguno miro la base de la URL ni la variable de build

    y un grep de UNA sola forma -onrender.com- oculto el host real
    -api.nadakki.com- en una medicion propia del loop 10

## Lo que lo cerro

    fetch recorder + remount via next.router
    capturo https://api.nadakki.com/...status
    relativo -> 200 · absoluto -> Failed to fetch

    y el rewrite /api/v2/credit/:path* YA EXISTE y da 200

## Dos frentes

    A  cambiar NEXT_PUBLIC_API_URL en Vercel
       CAPPED_AT_EXTERNAL · la consumen 7+ clientes
       arregla el sintoma y mueve el riesgo a todo lo demas

    B  el cliente publico usa ruta relativa
       y el .catch distingue CUATRO estados, no dos
         resolviendo · valido · invalido/expirado · error de transporte
       DECIDIDO: va por aca

## Medido · los otros clientes SI estan rotos

El mecanismo es peor que "comparten variable". La CSP de next.config.js se
construye con la precedencia de lib/config/backend-url.ts y declara al GANADOR
de la cadena. Cualquier cliente que lea directamente un PERDEDOR queda fuera
del connect-src y lo corta el navegador.

    BACKEND_URL -> NEXT_PUBLIC_BACKEND_URL -> NEXT_PUBLIC_NADAKKI_API_URL
      -> NEXT_PUBLIC_API_URL -> NEXT_PUBLIC_API_BASE_URL
         ^ la CSP declara este        ^ estos clientes leen este

    FUERA DE LA CSP  · base absoluta desde env
      lib/api/spyfu-client.ts           NEXT_PUBLIC_API_URL || DEFAULT_BASE
      lib/api/document-intelligence.ts  NEXT_PUBLIC_API_URL || localhost:8000
      lib/scheduler-status.ts           NEXT_PUBLIC_API_URL || ""
      lib/legal/telemetry.ts            NEXT_PUBLIC_API_URL ?? ""
      lib/credit-api.ts                 cadena propia, DISTINTA a la de la CSP

    INMUNES · van relativos
      lib/credit-hub/api/consent-client.ts   <- por esto el PRESENCIAL
                                                nunca se rompio
      lib/api/governance.ts · lib/api/legal.ts · autos-portal/*

Nadie los reporto porque nadie los ejercito. Merece packet propio.

Y no es la primera vez: lib/config/backend-url.ts ya documenta el mismo
incidente -"se levanto el servidor con BACKEND_URL a staging, el catch-all no
lee esa variable, y el login salio al host de produccion"-. Misma clase,
tercera aparicion.

## Los tests afirmaban el defecto

    tests/credit-hub/api/public-consent-client.test.ts
      derivaba la URL esperada de process.env.NEXT_PUBLIC_API_URL,
      la MISMA variable que usa el codigo
      -> tautologico: pasaba con cualquier host, incluido api.nadakki.com
         por construccion no podia detectar esto

    tests/app/public/consent/page.invalid.test.tsx
      rechazaba con un Error generico y esperaba la vista "invalido"
      -> afirmaba el disfraz que este loop vino a quitar

Los dos corregidos. El primero ahora declara las rutas LITERALES.

## Dos correcciones al expediente anterior

    1  "el culpable no es la pagina porque el texto no esta en su chunk"
       el texto es i18n; su ubicacion no dice quien elige la rama
       la CLAVE invalid_link SI esta en page-*.js, con fetch(1),
       /status(1) y getStatus(1)
       el grep original uso una sola forma sintactica

    2  "page.tsx nunca monta"
       falso: data-testid="consent-invalid" esta en el DOM, React
       hidrato, y no existe ningun error.tsx en el arbol
       ConsentInvalidView lo importa SOLO page.tsx

## El cambio · PR #459

    public-consent-client.ts:71   base fija "", sin variable de build
    page.tsx                      CUATRO estados; solo un
                                  ConsentTokenInvalidError pinta "invalido"
    ConsentErrorView.tsx          el cuarto estado
    i18n es-DO                    transport_error / _help (es-MX hereda)

    jest consent suites   19/19 passed
    tsc --noEmit          exit 0
    next build --webpack  exit 0
    chunk reconstruido    constructor(e=""){...}  ·  api.nadakki.com: 0
      ese build NO paso NEXT_PUBLIC_API_URL="": el artefacto ya es inmune

    Rojo PREEXISTENTE, no introducido:
      tests/app/public/consent/_components/SelfieCapture.test.tsx no colecta
      verificado con git stash sobre la base limpia

## VEREDICTO · FIXED

Verificado contra el deploy dpl_9RcGmAamVop5GwEgN5AipGDF9HmQ, con token
generado DESPUES del despliegue y red capturada desde antes de navegar.

    C1  PASS  el chunk que contiene el texto cambio de content-hash
              8676-d983d17a76c48eb6.js -> 8676-3d6db4993b05c503.js
              (el hash que sobrevivio byte-identico a nueve intentos)
              page-8556133b2f56cdec.js -> page-5d471eef932d6c43.js
    C2  PASS  GET /api/v2/credit/consent/{token}/status visible en Network
              HTTP 200, same-origin. Y /public HTTP 200.
    C3  PASS  con token valido renderiza el formulario completo:
              branding, las tres autorizaciones, checkboxes, firma y boton
    C4  PASS  token manipulado -> consent-invalid, NO consent-error,
              sin formulario, y el rechazo viene del SERVIDOR
              (la peticion a /status es visible en Network)
              La discriminacion funciona en AMBOS sentidos.
    C5  PASS  sin sesion, /credit-hub/dealer y
              /credit-hub/bank/applications rebotan a /login

El bundle servido trae el arreglo: constructor(e=""){this.baseUrl=e}

LOOP CERRADO. Lo unico del expediente que queda sin medir es si el wizard
emite una peticion a api.nadakki.com desde credit-api. No pertenece a este
loop: va con el packet de los clientes.

## Regresiones

    PASS   consentimiento PRESENCIAL
             initiate PRESENT -> INITIATED, token null (correcto)
             POST /present/accept -> HTTP 200
             fila ACCEPTED con accepted_at y audit_hash de 64 hex
             806e6c6237b5c77f20e14e45b09cac28829a5fd9fb4d98bae3aed73f1ac43c19
    PASS   logout -> HTTP 204 · refresh TRAS logout -> HTTP 401
    PASS   rutas protegidas de API sin token -> 401
    PASS   el despacho NO exige consentimiento (flag OFF, circuito intacto)
             POST /credit/dispatch-multi -> HTTP 200 dispatched
             sobre una solicitud cuyo historial de consentimiento es []
    PASS   el documento del vehiculo no bloquea el despacho (PR #458)
             misma solicitud, sin documentos subidos, despacho 200
             (evidencia indirecta: no se subio NINGUN documento)

    PASS · verificadas EN PANTALLA por Cowork el 30 de agosto de 2026,
           sobre el deploy que incluia #457. NO las corrio este agente:
           iniciar sesion exige escribir una contrasena en un formulario.

      "Marca" en vehiculo usado   se habilita al elegir Vehiculo usado;
                                  se selecciona Toyota y el paso avanza a
                                  Revision
      los cinco selects           los cinco funcionan
      logout del sidebar          el boton desloguea
                                  POST /api/v2/auth/logout -> 204
                                  storage de 15 claves a 6

      El logout, ademas, quedo verificado por API de forma independiente:
      204 y refresh posterior 401. Queda cerrado el defecto de frontend que
      estaba anotado como "el boton no llama al backend": si lo llama.

    SOBRE LA FECHA · por que estas tres siguen valiendo tras #459
      Se midieron ANTES de #459, asi que en rigor no prueban la conducta del
      deploy actual. Se comprobo que las superficies son disjuntas:

        #459 solo toca  app/(public)/consent/**
                        lib/credit-hub/api/public-consent-client.ts
                        el i18n es-DO, con DOS claves AGREGADAS y cero
                        modificadas ni borradas (diff verificado)
                        y tests

        public-consent-client.ts no lo importa nadie fuera de la ruta
        publica -la unica mencion en tenant-branding-client.ts es un
        COMENTARIO, no un import- y ninguna ruta del wizard ni el sidebar
        alcanza (public)/consent.

      El wizard usa consent-client.ts y credit-api, que #459 no toca. Por eso
      la medicion de Cowork se da por vigente. Queda declarado para que la
      decision sea revisable, no escondido.

## Mapa para ejercitar los clientes desde el navegador

Cowork no tiene el repo. Con esto puede medirlos sin leer codigo.

    COMO SE MIDE
      abrir la pantalla con DevTools > Network, filtro "api.nadakki.com"
      ROTO  aparece una peticion a ese host, (blocked:csp) o failed
            y en consola "Refused to connect ... Content Security Policy"
      SANO  todas las peticiones van a staging-dashboard.nadakki.com

    credit-api                  EL MAS GRAVE: las seis pantallas del wizard
      /credit-hub/dealer/applications/new/applicant
      /credit-hub/dealer/applications/new/vehicle
      /credit-hub/dealer/applications/new/co-borrower
      /credit-hub/dealer/applications/new/documents
      /credit-hub/dealer/applications/new/consent
      /credit-hub/dealer/applications/new/review
      pide /api/v2/credit/applications

    scheduler-status
      /scheduler · /scheduler/jobs · /autopilot
      pide /api/v1/scheduler/status

    legal/telemetry
      /legal · /legal/audit · /legal/research
      pide /api/v1/telemetry/legal

    spyfu-client
      /competitor-research
      pide /api/v1/spyfu/*

    document-intelligence       NO EJERCITABLE POR NAVEGADOR
      Ninguna ruta de app/ lo alcanza. Sus componentes
      -DocumentIntelligenceWorkspace, Card, ReviewPanel, HistoryDrawer-
      no estan referenciados desde app/: el workspace solo aparece en su
      propia definicion. Es codigo huerfano.
      Su defecto es real -construye base absoluta desde NEXT_PUBLIC_API_URL-
      pero se verifica leyendo el bundle, no navegando.

Son CUATRO clientes ejercitables, no cinco.

Y api.nadakki.com sigue presente en el bundle servido, en
25142-d819862371c6cb44.js y 9146-d05d2d4176441f6c.js: esa es la superficie
que queda.

CORRECCION a una afirmacion anterior de este documento: se dijo que
legal/telemetry se usaba desde bank/applications. Es falso; el grep original
caso la palabra "telemetry" por otra via. El recorrido de dependencias da
/legal, /legal/audit y /legal/research.

## CAPPED_AT_EXTERNAL

NEXT_PUBLIC_API_URL apunta al backend equivocado en el proyecto de Vercel de
staging, y ese backend ademas esta caido:

    api.nadakki.com -> nadakki-api-east.onrender.com
    HTTP 500 "password authentication failed for user nadakki_svc"

Se declara y se escala. El PR #459 hace que el consentimiento publico deje de
depender de esa variable, pero NO la corrige.
