# LOOP DEFINITIVO · CONSENTIMIENTO REMOTO Y DESPACHO
## Codex · `nadakki-dashboard` · sin novena vuelta

```text
OBJETIVO   que el circuito cierre de punta a punta, las dos vias
AUTONOMIA  las decisiones estan tomadas abajo
           si aparece una que no esta, la tomas vos y la declaras
CIERRE     criterios objetivos, verificables sin opinion
```

---

# PARTE 1 · POR QUE FALLARON LAS OCHO VUELTAS

```text
V1 #419  agrego la llamada a getStatus
V2 #424  volvio a agregar la validacion contra el servidor
V3 #426  PR nuevo · el trabajo de V2 habia quedado local
V4 #430  fallback a location.pathname · useParams vacio
V5 #452  usePathname · el diff fueron 59 bytes
V6 #453  loading hasta conocer el segmento
V7 #455  AppGate no bloquea la ruta publica
V8 ???
```

**Las siete tocaron ficheros distintos. Ninguna toco el que pinta la pantalla.**

```text
MEDIDO POR COWORK, y es el dato que cierra el diagnostico

  el chunk 8676-d983d17a76c48eb6.js contiene el texto
    "Solicita uno nuevo al dealer que esta procesando tu solicitud"

  tras #455, con dpl fresco: BYTE-IDENTICO
  mismo content-hash · el arreglo no llego a ese fichero
```

---

# PARTE 2 · LA POSIBILIDAD QUE NADIE CONSIDERO

**Un `git grep` por el texto puede no llevar a un componente.**

```text
si el texto vive en un fichero de traducciones
  lib/i18n/es.json · translations.ts · messages/es.ts

entonces:
  el grep encuentra el i18n, no el componente
  el chunk 8676 seria el bundle de traducciones + compartidos
  y el componente que USA esa clave es otro fichero
```

**Eso explicaria las ocho vueltas de una vez:** cada intento busco el
comportamiento en el componente de la ruta, y la pantalla la decide otro que ni
siquiera contiene el texto — solo la clave.

```text
LA CADENA COMPLETA que hay que recorrer

  texto que ve el usuario
    -> clave de i18n que lo produce
      -> componente que usa esa clave
        -> quien renderiza ese componente
          -> chunk donde Next lo agrupa
```

**Ningun intento recorrio esa cadena.** Todos empezaron por el componente que el
nombre sugeria.

---

# PARTE 3 · ANTES DE TOCAR NADA · el entorno

**Tres veces esta semana trabajaste sobre un clon donde `origin/staging` no
existia y `app/` no estaba en la raiz.** Un arreglo en el repo equivocado es
indistinguible de uno que no existe.

```powershell
cd C:\Users\ramon\Projects\nadakki-dashboard
git remote -v
git fetch origin --prune
git log --oneline -1 origin/staging
Get-ChildItem -Directory | Select-Object -First 12
Test-Path "app"
Test-Path "app/(public)/consent/[token]/page.tsx"
```

```text
SI CUALQUIERA DE ESTAS FALLA, PARAS Y LO REPORTAS
  el remoto no dice nadakki-dashboard
  origin/staging no existe
  app/ no esta en la raiz
  la ruta del consentimiento no existe

NO SIGAS. Todo lo demas seria ruido.
```

---

# PARTE 4 · LOCALIZACION · el protocolo completo

**No abras un PR hasta terminar esta parte.**

## 4.1 · el texto

```powershell
git grep -rn "Solicita uno nuevo al dealer" -- app components lib
git grep -rn "no es válido o ha expirado" -- app components lib
git grep -rn "no es valido o ha expirado" -- app components lib
```

**Probá las tres formas.** Un grep negativo con una sola forma sintactica ya
produjo un falso vacio en este proyecto — se busco `["clave"]` y los lectores
usaban `.get("clave")`.

## 4.2 · si el texto esta en un fichero de i18n

```text
tomá la CLAVE, no el texto
y buscá quien la usa
```

```powershell
git grep -rn "<la clave que encontraste>" -- app components lib
```

**Ese es el componente. No el que tiene el fetch.**

## 4.3 · quien lo renderiza

```text
partiendo del componente que usa la clave, subir el arbol
  ¿quien lo importa?
  ¿esta en un error boundary, un layout, un provider?
  ¿lo monta la ruta /consent, o algo que la envuelve?
```

```powershell
git grep -rn "<NombreDelComponente>" -- app components lib
```

## 4.4 · el entregable de esta parte

```text
el fichero exacto que decide mostrar la pantalla de invalido
la linea exacta de la condicion
y por que esa condicion es verdadera con un token valido

SI NO PODES CONTESTAR LAS TRES, NO ARREGLES
  medi mas · el costo de una novena vuelta es mayor
  que el de otra hora de medicion
```

---

# PARTE 5 · LO QUE YA ESTA DESCARTADO

**No lo remidas. Esta medido con la red capturada, con sesion y sin sesion, en
contexto anonimo con SW desregistrado.**

```text
NO es el token
  location.pathname trae el JWT completo · 312-321 chars

NO es el backend
  GET /api/v2/credit/consent/{token}/status -> 200 {"status":"SENT"}
  con el mismo token, en el mismo momento

NO es la expiracion
  ~24h de vida restante
  y el cliente NO decodifica el JWT: atob = 0, Date.now = 0

NO es la sesion
  identico con sesion de dealer y en contexto anonimo

NO es cache
  SW desregistrado, caches borradas, dpl fresco verificado

NO es que el fetch falte
  "/status" aparece 1 vez en el chunk de la pagina
  el codigo esta · NUNCA se ejecuta

NO es AppGate
  #455 lo arreglo y el chunk 8676 quedo byte-identico
```

---

# PARTE 6 · EL SEGUNDO ITEM · el despacho bloqueado

**Muro nuevo, medido hoy:**

```text
despachar una solicitud 100% completa -> pre-screening 422
toast: "falta Documentos del vehiculo"

y el upload de ese documento da 500
  InvalidAccessKeyId ... PutObject
  credenciales AWS invalidas en staging
```

**Antes el `500` no bloqueaba. Ahora si.** Ningun dealer despacha, ni por la via
presencial ni por la remota.

```text
DECISION DE CESAR
  mientras el upload este roto, el documento del vehiculo
  NO debe ser requisito duro para despachar

  un requisito que nadie puede cumplir no protege nada,
  solo impide operar

MEDI PRIMERO
  ¿de donde sale ese requisito? ¿frontend o backend?
  ¿es nuevo, o siempre estuvo y algo lo activo?
  ¿hay un flag que lo gobierne?

  si es BACKEND -> BLOQUEADO_CRUZADO, lo reportas y seguis
  si es FRONTEND -> lo arreglas acá
```

---

# PARTE 7 · CRITERIOS DE CIERRE · objetivos, no opinables

**Un item no se cierra por "los tests pasan".**

## Para el consentimiento remoto

```text
C1  el content-hash del chunk que contiene el texto CAMBIO
      antes: 8676-d983d17a76c48eb6.js
      medilo despues del deploy · si no cambio, no lo tocaste

C2  un e2e que monta la RUTA REAL, no el componente
      con token valido -> el formulario renderiza
                       -> statusRequests === 1
      con token invalido -> la pantalla de invalido
                         -> y NO se llama /public

C3  la mutacion: restaurar el guard -> el e2e rompe

C4  las rutas protegidas SIGUEN protegidas
      sin sesion, /credit-hub/dealer rebota a /login
      ESTO NO ES OPCIONAL · si el arreglo abre de mas,
      es peor que el defecto original
```

## Para el despacho

```text
D1  una solicitud completa SIN documento del vehiculo despacha
D2  el upload roto sigue mostrando su error, sin bloquear
D3  la mutacion: volver a exigirlo -> el test rompe
```

---

# PARTE 8 · LO QUE NO SE PUEDE ROMPER

**Verificado en pantalla hoy. Si algo de esto deja de funcionar, el arreglo esta
mal.**

```text
las rutas protegidas rebotan a /login sin sesion
el consentimiento PRESENCIAL dispara POST /present/accept -> 200
  con fila ACCEPTED, audit_hash y accepted_at
"Marca" se habilita en vehiculo usado y el paso avanza
los cinco selects del wizard funcionan
  Tipo de contrato · Marca · Concepto · Frecuencia · Institucion
el logout del sidebar desloguea y llama POST /auth/logout -> 204
```

```text
ANTES DE CADA PR
  npm test -- <las suites del credit-hub> --runInBand
  y declarar el numero de rojos CON y SIN el cambio
  si aparece un rojo nuevo, PARAS
```

---

# PARTE 9 · REGLAS DE ESTOS OCHO DIAS

```text
ANTES DE ABRIR EL PR, por escrito
  1  cual es el camino completo, del click al efecto final?
  2  donde EXACTAMENTE se corta, medido?
  3  que verifica que el camino ENTERO funciona?

ANTES DE CERRAR
  "si esto estuviera roto una capa mas adentro,
   ¿mi test lo detectaria?"
  "¿mi arreglo resuelve el caso que vi, o la CLASE?"

Y LA QUE COSTO OCHO VUELTAS
  antes de arreglar una pantalla, verificar QUE COMPONENTE LA PINTA
  no el que el nombre sugiere · el que contiene el TEXTO
```

```text
UN PR NUEVO VA EN RAMA NUEVA desde staging actualizado
  no encima de la anterior
  paso dos veces hoy: #453 y #457 arrastraron el commit previo
  y chocaron cuando ese se mergeo
```

```text
NO ES EVIDENCIA
  que el test pase · que el codigo tenga la linea
  que el PR diga MERGED · que el diff sea grande

SI ES EVIDENCIA
  el content-hash del chunk cambiado
  el e2e sobre la ruta real
  la peticion saliendo en la red
```

---

# PARTE 10 · SI LA LOCALIZACION NO DA CON EL FICHERO

**Es posible. Y entonces la respuesta correcta no es adivinar.**

```text
ENTREGAS
  los tres greps con su salida literal
  el arbol de imports que recorriste
  que descartaste y con que evidencia
  y la pregunta concreta que te falta contestar

ESO VALE MAS que un noveno arreglo a ciegas
```

**Ocho intentos fallaron por arreglar sin localizar. El noveno no se abre sin el
fichero identificado.**

---

# ESTADOS TERMINALES

```text
CERRADO_CON_EVIDENCIA   con los criterios de la Parte 7 cumplidos
PREMISA_REFUTADA        la medicion contradice el brief
                        lo declaras y seguis · no preguntas
BLOQUEADO_CRUZADO       el requisito del documento resulta ser backend
                        lo reportas con la medicion y seguis con el otro item
```

---

**Generado por IA. Las ocho vueltas y todas las mediciones estan documentadas
entre el 27 y el 31 de agosto de 2026. El chunk byte-identico se midio hoy, tras
el deploy de #455.**
