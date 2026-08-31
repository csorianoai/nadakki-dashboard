# LOOP 10 · IDENTIFICAR Y CERRAR
## Consentimiento remoto · `nadakki-dashboard` · rama `staging`

```text
AGENTE     Claude Code
REPO       csorianoai/nadakki-dashboard   NO el backend
RAMA       staging                        NO main
RUTA       app/(public)/consent/[token]/page.tsx
SITIO      https://staging-dashboard.nadakki.com
BACKEND    https://nadakki-ai-suite-staging.onrender.com
```

**El defecto:** un token remoto valido abre `/consent/{token}` y la UI muestra
*"Este enlace no es valido o ha expirado"*. El navegador no emite ninguna
peticion a `/api/v2/credit/consent/{token}/status`.

**Nueve iteraciones intentaron arreglar sin identificar. Esta identifica
primero.**

---

# FASE 0 · EL ENTORNO · antes de todo

**Tres veces esta semana un agente trabajo sobre un clon donde `origin/staging`
no existia y `app/` no estaba en la raiz. Un "no encontre el fichero" desde ahi
es un falso negativo.**

```powershell
cd C:\Users\ramon\Projects\nadakki-dashboard
git remote -v
git fetch origin --prune
git log --oneline -1 origin/staging
Test-Path "app"
Test-Path "app/(public)/consent/[token]/page.tsx"
git branch -a | Select-String "diag|consent"
```

**Ese ultimo comando importa: puede haber trabajo de otro agente sin empujar.**

```text
SI CUALQUIERA FALLA, PARAS Y LO REPORTAS
  el remoto no dice nadakki-dashboard
  origin/staging no existe
  app/ no esta en la raiz
  la ruta del consentimiento no existe

NO SIGAS · todo lo demas seria ruido
```

---

# FASE 1 · ¿ESTO FUNCIONO ALGUNA VEZ?

**La medicion mas barata del loop, y nadie la hizo en nueve intentos. Cambia el
espacio de hipotesis entero.**

```powershell
git log --oneline --follow -- "app/(public)/consent/[token]/page.tsx" | Select-Object -First 20
git log --oneline --diff-filter=A -- "app/(public)/consent/**"
```

```text
si NUNCA funciono          no es una regresion: es cableado
                           y la hipotesis del arbol de render sube
si funciono y se rompio    hay un commit culpable · encontralo
```

**Registra la respuesta antes de seguir.**

---

# FASE 2 · BASELINE REPRODUCIBLE

```text
1  cerrar TODAS las pestanas del dominio
   el service worker sirve el bundle viejo hasta que se cierran todas
   desregistrarlo NO libera las ya abiertas · esto costo tres mediciones falsas

2  contexto anonimo · SW desregistrado · Cache Storage borrado
3  capturar Network ANTES de navegar
4  generar un token nuevo (procedimiento al final del documento)
5  reproducir UNA vez
```

**Guardar:**

```text
SHA de origin/staging y el deployment servido
el ?dpl= de LA RUTA /consent  (es por segmento, no global)
la lista de chunks cargados, con sus content-hashes
las cabeceras del documento, en especial Content-Security-Policy
la captura de red completa
el resultado de GET /status con el mismo token, fuera de la pagina
```

**Sin esta tabla no avanzas.**

---

# FASE 3 · IDENTIFICAR · el corazon del loop

**Estado terminal de esta fase: `fichero:linea`. Nada mas.**

## 3.1 · Lo que la ubicacion del texto ya dice

```text
el texto NO esta en page-*.js
ESTA en un chunk compartido (era 8676-d983d17a76c48eb6.js)
```

**En Next App Router el reparto no es arbitrario:**

```text
page-*.js          el componente de página de ESA ruta
chunk compartido   layouts, templates, providers, guards,
                   error.tsx, not-found.tsx, diccionarios i18n,
                   cualquier cosa usada por mas de una ruta
```

**La categoria del culpable ya esta acotada, y no es "pagina".**

**Refuerzo:** tras el intento que toco `AppGate`, ese chunk quedo
**byte-identico**. Si `AppGate` viviera ahi, el hash habria cambiado. Luego lo
que decide es otra cosa que ninguno de los nueve intentos toco.

## 3.2 · Trazabilidad bidireccional

```powershell
git grep -rn "Solicita uno nuevo al dealer" -- app components lib
git grep -rn "no es válido o ha expirado" -- app components lib
git grep -rn "no es valido o ha expirado" -- app components lib
```

**Tres formas.** Un grep negativo con una sola forma ya produjo un falso vacio en
este proyecto.

**Si el texto vive en i18n**, la clave es el hilo, no el texto:

```powershell
git grep -rn "<la clave>" -- app components lib
```

**Buscar todos los lectores**: acceso por punto, corchetes, `.get(...)`,
`t(...)`, imports y re-exports, y claves construidas por concatenacion.

**Desde cada lector, subir el arbol** hasta la ruta: `layout.tsx`, providers,
gates, `template.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

**Y desde la ruta hacia atras:** todas las ramas que pueden seleccionar ese
mensaje.

## 3.3 · Si no podes mapear chunk a fuente

**Es posible sin sourcemaps. La salida no es adivinar:**

```text
poner una marca unica y segura en cada candidato
  console.log("[CONSENT_DIAG] montado: <NombreDelComponente>")
desplegar
ver cual aparece en consola
```

**Un canario ausente en pantalla Y ausente del chunk servido significa que estas
editando un fichero que no sirve esa ruta.** Revisar entonces: la salida de
`next build`, duplicados de `/consent/[token]`, `pages/` contra `app/`, rewrites
en `next.config.js`, y el `matcher` de `middleware.ts`.

## 3.4 · La cadena que hay que poder escribir

```text
texto o clave -> componente exacto -> condicion exacta
              -> wrapper o ruta -> modulo y chunk servido
```

**Si no podes construirla, todavia no conoces el defecto y no podes
corregirlo.**

---

# FASE 4 · INSTRUMENTAR EL RUNTIME

**Nueve iteraciones, cero instrumentos.**

## YA EXISTE INSTRUMENTACION · no la rehagas sin mirarla

```text
Codex escribio una el 31 de agosto y la dejo en una rama
  diag/public-consent-status-request

  log antes del fetch, con la URL exacta construida
  log en el catch, con el error completo
  sin modificar la decision del catch

  4 suites, 15 tests · typecheck pasa
  quedo LOCAL en su maquina · puede que ya este empujada
```

```powershell
git fetch origin --prune
git branch -r | Select-String "diag"
```

**Si la rama existe, empeza por ahi.** Si cubre lo que necesitas, usala. Si no,
ampliala en vez de escribir otra desde cero.

**Si no existe**, pedila antes de escribir la tuya — perder ese trabajo cuesta
una vuelta entera.

Prefijo unico, sin tokens ni PII:

```text
[CONSENT_DIAG_V1] route_mounted
[CONSENT_DIAG_V1] token_resolved: bool, length, sufijo_8
[CONSENT_DIAG_V1] status_validation_entered
[CONSENT_DIAG_V1] request_url construida (token censurado)
[CONSENT_DIAG_V1] immediately_before_fetch
[CONSENT_DIAG_V1] fetch_resolved: HTTP status
[CONSENT_DIAG_V1] catch: error.name, error.message, stack, fase
[CONSENT_DIAG_V1] render_branch seleccionada + quien la selecciono
```

**Instrumentar tambien `getStatus` desde su entrada hasta la linea inmediatamente
anterior al `fetch`.** Si usa un cliente API, sus interceptors y su construccion
de URL.

**Desplegar y confirmar que el navegador carga el commit instrumentado** —una
marca visible en el bundle— antes de interpretar nada.

## Clasificacion por la PRIMERA marca ausente

```text
no aparece route_mounted        otro componente decide antes · volver a FASE 3
monta, no entra a validacion    una condicion impide ejecutar · inspeccionar
                                la rama y el ciclo de vida
entra, no llega a before_fetch  excepcion previa dentro de getStatus
llega a before_fetch, sin req   URL invalida, CSP, interceptor · capturar
                                la excepcion y las policies
el request sale y falla         respuesta, CORS, proxy, parsing
200 y aun pinta invalido        estado, race, o un segundo componente
                                sobrescribe la vista
```

---

# FASE 5 · UNA HIPOTESIS FALSABLE

```text
CAUSA PROPUESTA
  Cuando [condicion exacta], [fichero:simbolo] ejecuta [mecanismo],
  por lo que [evidencia observada] y la UI termina en [rama exacta].

PREDICCION FALSABLE
  Si esta causa es correcta, al cambiar UNICAMENTE [variable],
  debe ocurrir [resultado]. Si no ocurre, la hipotesis muere.
```

**Ejecutar la prediccion. Si falla, volver a FASE 4 con la evidencia nueva. No
parchear la hipotesis fallida.**

---

# FASE 6 · EL ARREGLO MINIMO

**Solo despues de confirmar la causa.**

```text
1  escribir primero un test que FALLE por la causa exacta
   y que monte la RUTA con sus wrappers, no solo page.tsx
2  el cambio minimo, en el punto que realmente decide
3  distinguir CUATRO estados, no dos:
     resolviendo · valido · invalido/expirado · error de transporte
   un fallo de red, CSP o excepcion interna NO puede disfrazarse
   de "token invalido" · ese disfraz es el defecto de fondo
4  la autoridad sobre la validez sigue siendo el SERVIDOR
5  quitar los logs temporales o convertirlos en telemetria sin PII
6  lint, typecheck, build y las suites relevantes
   registrar comandos, exit codes y resultados
7  revisar el diff completo: cambios accidentales, bypasses, secretos
```

---

# FASE 7 · VERIFICAR EN EL DESPLIEGUE

```text
1  subir la rama y abrir PR contra staging
   RAMA NUEVA desde staging actualizado, no encima de otra
   paso dos veces esta semana y los PRs chocaron
2  Cesar mergea (GR-11) y despliega
3  demostrar que el deployment corresponde al commit corregido
4  cerrar TODAS las pestanas · contexto anonimo limpio
5  generar un token NUEVO despues del deploy
6  capturar Network desde antes de abrir la URL
```

## Matriz de cierre · todo o nada

```text
C1  el chunk QUE CONTIENE EL TEXTO cambio de content-hash
    NO "8676 cambio" · el nombre del chunk puede rotar entre builds
    se localiza el texto en el build nuevo y se compara ESE

C2  GET /api/v2/credit/consent/{token}/status visible en Network
    con respuesta 200 SENT
    una llamada manual a /status NO reemplaza esto

C3  con token valido, el formulario renderiza

C4  con token manipulado, expirado o inexistente, sigue rechazando
    y el rechazo viene de la respuesta del SERVIDOR
    CONTROL NEGATIVO OBLIGATORIO

C5  sin sesion, /credit-hub/dealer sigue rebotando a /login
```

**Ningun test local reemplaza C2 a C5.**

## Regresiones · verificado el 31 de agosto, no se puede romper

```text
consentimiento PRESENCIAL -> POST /present/accept 200
  fila ACCEPTED con audit_hash y accepted_at
"Marca" se habilita en vehiculo usado
los cinco selects: Tipo de contrato, Marca, Concepto,
  Frecuencia, Institucion bancaria
logout del sidebar -> POST /auth/logout 204
las rutas protegidas rebotan sin sesion

y desde el 31 de agosto, PR #458
  el documento del vehiculo NO bloquea el despacho
  una solicitud completa sin ese documento debe poder despacharse
```

**Si una regresion falla, se revierte o se corrige antes de cerrar. No se
sacrifica seguridad para recuperar el consentimiento remoto.**

---

# LO QUE ESTA MEDIDO · con dos correcciones importantes

```text
MEDIDO Y FIRME
  el JWT llega completo en location.pathname · 312-321 chars
  GET /status con ese token -> 200 SENT, directo y por proxy
  73 requests capturados y NINGUNO fue /api/ ni /status
  cero errores de JS, cero violaciones CSP en consola
  el bundle de la pagina contiene fetch y "/status"
  el texto del error NO esta en el chunk de la pagina
  los nueve arreglos no cambiaron la conducta observable
```

```text
DOS CORRECCIONES AL EXPEDIENTE ANTERIOR

1  "el cliente no decodifica el JWT" (atob=0, Date.now=0)
   ESE GREP SE CORRIO SOBRE EL CHUNK DE LA PAGINA
   que no contiene el codigo que produce la pantalla
   -> esa teoria NO esta descartada · nunca se midio donde importa

2  la supuesta contradiccion entre "el fetch se ejecuta"
   y "no sale ninguna peticion" NO ES UNA CONTRADICCION
   las dos son verdaderas si page.tsx nunca monta
   -> no hace falta postular un fetch que lanza sin dejar rastro
```

**El expediente anterior eligio la explicacion cara y descarto la barata
teniendo la prueba en la mano: la ubicacion del string.**

---

# REGLAS DEL LOOP

```text
R1  el estado terminal de la FASE 3 es un NOMBRE, no un PR
    prohibido abrir PR antes de tener fichero:linea con evidencia

R2  una variable por iteracion
    un experimento, una prediccion, un resultado

R3  ABORTO INMEDIATO si tras un deploy el content-hash del chunk que
    contiene el texto no cambio
    no se mide conducta: se investiga el despliegue
    el intento 7 violo esto y el loop siguio cinco dias

R4  evidencia = comando + salida literal
    "verifique que..." no es evidencia

R5  un grep negativo solo descarta una teoria si se corrio sobre el
    artefacto que produce el comportamiento observado
    y con al menos dos formas sintacticas

R6  leer codigo NO cierra nada · solo la ejecucion

R7  antes de otro deploy: intentar reproducir en local
    next build && next start contra el backend de staging
    si reproduce, el ciclo baja de un deploy a un reload
    si NO reproduce local y SI en staging, la diferencia es de
    entorno (una NEXT_PUBLIC_* ausente en el build de Vercel)
    y eso es una medicion, no un arreglo

R8  toda afirmacion se etiqueta MEDIDO, LEIDO EN CODIGO o INFERENCIA
    LEIDO EN CODIGO jamas sustituye una medicion de runtime

R9  si dos vueltas consecutivas no producen evidencia nueva, PARAS
    y revisas la instrumentacion o el arbol de render
    no hay una tercera
```

---

# LEDGER · acumulativo, no se borra

```text
| # | hipotesis unica | evidencia nueva | prediccion falsable | resultado | siguiente |
```

**Los resultados negativos se conservan.** Nueve intentos terminaron en "sin
cambio", el resultado con menos informacion posible, porque ninguno escribio una
prediccion antes de desplegar.

---

# INFORME FINAL

```text
VEREDICTO           FIXED | BLOCKED

CAUSA RAIZ DEMOSTRADA
  condicion exacta · fichero y simbolo
  por que no salia la peticion
  por que se mostraba exactamente ese mensaje
  por que los nueve intentos no lo tocaron

EVIDENCIA ANTES/DESPUES     tabla por señal

CAMBIO MINIMO
  ficheros · explicacion del diff
  la prueba que fallaba antes y pasa despues

MATRIZ C1-C5                PASS/FAIL con evidencia
REGRESIONES                 flujo, resultado, evidencia
TRAZABILIDAD                commit SHA, PR, deployment ID, timestamp UTC
RIESGO RESIDUAL
```

**Si es `BLOCKED`:**

```text
la accion que no pudo ejecutarse
el error literal
el acceso o decision puntual que hace falta
el comando exacto para continuar
```

**No son bloqueos:** "no tuve tiempo", "parece cache", "los tests pasan", "abri
un PR".

---

# SI ESTE LOOP TAMPOCO CIERRA

**No se abre un loop 11 igual. Se cambia de medio:**

```text
falta un DATO         las mediciones de las fases 1 a 4 no se corrieron
                      el problema no es tecnico: nadie las ejecuto

falta una DECISION    reescribir la ruta publica desde cero, fuera del
                      grupo (public), sin layout heredado, como pagina
                      aislada · cuesta ~1 dia · se pierde consistencia
                      visual con el shell · decide Cesar

CAPPED_AT_EXTERNAL    si el bloqueo resulta ser configuracion de Vercel
                      (rewrite, variable de build), se declara y se
                      escala · no se itera
```

---

# GENERAR UN TOKEN DE PRUEBA

```powershell
cd C:\Users\ramon\Projects\nadakki-ai-suite
Get-Content tmp\audit-runtime\CREDS.env | Where-Object { $_ -match "^\s*[A-Z_]+=" } | ForEach-Object {
  $k,$v = $_ -split '=',2; [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
}
$S = "https://nadakki-ai-suite-staging.onrender.com"
$b = @{ email = $env:QA_DEALER_A; password = $env:QA_DEALER_A_PASSWORD } | ConvertTo-Json
$h = @{ Authorization = "Bearer $((Invoke-RestMethod "$S/api/v2/auth/login" -Method Post -ContentType 'application/json' -Body $b).access_token)" }
$app = (Invoke-RestMethod "$S/api/v2/credit/applications" -Method Post -Headers $h -ContentType "application/json" -Body '{"application_payload":{}}').application_id
$c = Invoke-RestMethod "$S/api/v2/credit/consent/$app/initiate" -Method Post -Headers $h -ContentType "application/json" -Body '{"method":"EMAIL","email":"prueba@qa.test"}'
"https://staging-dashboard.nadakki.com/consent/$($c.token)"
```

---

# PRIMERA RESPUESTA ESPERADA

**Solo esto, nada mas:**

```text
el resultado de la FASE 0
el resultado de la FASE 1 · ¿funciono alguna vez?
el plan inmediato para producir la tabla BASELINE
```

**No propongas todavia una causa raiz.**

---

**Este documento no ha sido ejecutado. Ninguna de sus predicciones esta
verificada. Es un plan de medicion, no un resultado.**
