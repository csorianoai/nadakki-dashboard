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

## Pendiente de medir

    los otros 7+ clientes usan la MISMA variable
      credit-api · spyfu-client · document-intelligence
      autopilot · scheduler-status · legal/telemetry

    si api.nadakki.com esta caido con 500,
    ¿estan rotos tambien, o van por otra via?

    si lo estan, hay defectos silenciosos del mismo origen
    que nadie reporto porque nadie los ejercito
