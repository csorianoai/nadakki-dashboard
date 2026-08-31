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

## VEREDICTO · ABIERTO

El loop NO esta cerrado. La matriz C1-C5 exige deploy y no la reemplaza
ningun test local.

    C1  el chunk que contiene el texto cambia de content-hash   PENDIENTE
    C2  GET /status visible en Network con 200                  PENDIENTE
    C3  con token valido, el formulario renderiza               PENDIENTE
    C4  con token manipulado, sigue rechazando desde el server  PENDIENTE
    C5  sin sesion, /credit-hub/dealer rebota a /login          PENDIENTE

    Regresiones a correr tras el deploy: presencial -> 200 con fila
    ACCEPTED, "Marca" en vehiculo usado, los cinco selects, logout 204,
    rutas protegidas, y el documento del vehiculo que NO debe bloquear
    el despacho (PR #458).

## CAPPED_AT_EXTERNAL

NEXT_PUBLIC_API_URL apunta al backend equivocado en el proyecto de Vercel de
staging, y ese backend ademas esta caido:

    api.nadakki.com -> nadakki-api-east.onrender.com
    HTTP 500 "password authentication failed for user nadakki_svc"

Se declara y se escala. El PR #459 hace que el consentimiento publico deje de
depender de esa variable, pero NO la corrige.
