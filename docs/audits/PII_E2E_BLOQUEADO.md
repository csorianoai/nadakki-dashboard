# #14 parte 2 · el E2E de PII en navegador, bloqueado

Traspaso. El recorrido **nunca corrió**: no hay resultado de ningún paso.
Lo que sigue es lo medido, no lo supuesto.

---

## Estado

```
#14 parte 1   CERRADA    autos_admin_dealers_ en PII_PREFIXES (#406)
                         pii-registry-guard verde · tests/auth 7 suites, 67 passed
#14 parte 2   BLOCKED    el login del navegador no completa
```

El gate de la parte 2 era: dealer A siembra PII, hace logout, los tres
almacenes quedan sin residuo, y dealer B entra en el mismo navegador sin ver
nada de A. Cero pasos ejecutados.

---

## Dónde se corta

El formulario de login **renderiza** y el submit **sí emite la petición**. La
petición sale al destino correcto y falla en red:

```
Error de red (TypeError: Failed to fetch)
  → https://nadakki-ai-suite-staging.onrender.com/api/v2/auth/login
```

Que la URL sea staging y no `api.nadakki.com` es, de paso, la verificación en
runtime de que el resolutor único del P0 (#404, #407) funciona.

### Lo que ya está descartado por medición

**No es el backend.** Los cinco actores de QA obtienen token contra ese mismo
endpoint por HTTP directo: 577, 577, 588, 601 y 604 caracteres.

**No es que el handler no corra.** La UI reacciona a los 3 segundos del clic y
muestra el error. Lo que no se veía era la petición en el listener de
Playwright, porque un `fetch` que revienta antes de salir no siempre emite el
evento `request`.

**No es CORS de origen.** `main.py:295-302` del backend trae:

```python
allow_origin_regex=(
    r"https?://localhost(:\d+)?"      # localhost, cualquier puerto
    ...
)
```

`http://localhost:3111` ya está permitido. **Esto se dio por sentado antes de
medirlo** y se declaró CORS como causa sin verificar el regex. Corregido acá.

### Hipótesis viva, sin medir

El **preflight**. `main.py:305-310` lleva un comentario que describe
exactamente este síntoma:

> *preflight was failing 400 because the frontend sends headers
> (X-Actor-Role, X-Requested-With) not listed here. Browsers strict-match the
> Access-Control-Request-Headers list against allow_headers; any unlisted
> custom header => preflight 400.*

`Failed to fetch` es lo que el navegador muestra para varias causas distintas,
y un preflight rechazado es una de ellas. La medición que lo decide: capturar
la respuesta al `OPTIONS` de esa ruta y comparar los
`Access-Control-Request-Headers` que manda el cliente de auth contra la lista
`allow_headers` del backend.

---

## La deuda que hay detrás: dos estrategias de URL conviviendo

```
lib/credit-hub/api/client.ts:51   return "" en el navegador  -> relativa, vía proxy
lib/api/auth-v2.ts                URL absoluta               -> directa al backend
```

Una afirmación previa de esta auditoría decía que el navegador **siempre** pasa
por el proxy porque `client.ts` devuelve `""` incondicionalmente. Es cierto
**sólo para el cliente de credit-hub**. El del login arma URL absoluta, y por
eso no atraviesa el proxy del dashboard ni sus rewrites.

Mientras las dos convivan, cualquier razonamiento sobre *contra qué host mide
el navegador* depende de qué cliente atienda la ruta. Esa ambigüedad costó tres
diagnósticos equivocados en una sola sesión.

**Unificar el cliente de auth con base relativa** —la misma unificación que
persigue el P0— cerraría esto. Cambia el comportamiento del login en
producción, así que va como packet propio y medido, no como efecto lateral.

---

## Defecto abierto, aparte: el DoD#3 de F1

`pii-registry-guard` no mide lo que dice medir:

- la aserción que estaba roja compara un array **escrito a mano**
  (`UNREGISTERED_PII_KEYS`) contra vacío. No escanea nada.
- `SAFE_KEYS` contiene `'    '` y `''` documentados como *"whitespace artifacts
  from regex parsing"*.

Puede ponerse verde registrando basura de su propio escáner. El requisito
—*"una clave nueva de PII sin registrar hace fallar el test"*— sigue **abierto**:
con una lista manual, agregar una clave no rompe nada salvo que alguien además
la escriba en el array. Necesita leer el `sessionStorage` real o el AST.

---

## Para quien retome

```
1  medir el preflight OPTIONS de /api/v2/auth/login desde el navegador
2  si es allow_headers, el arreglo es del backend y es una lista
3  con el login funcionando, el recorrido de la parte 2 está escrito y
   documentado en el historial de esta sesión: sembrar las claves de
   PII_PREFIXES, logout real por la app, inspección de los tres almacenes
   y CacheStorage, y cruce por cadena exacta con dealer B
```

Los pasos 2.9 y 2.10 del Golden Path son estos mismos: el resto del recorrido
se puede certificar por API sin navegador.
