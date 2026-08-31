# LOOP 10 · IDENTIFICACIÓN (no arreglo)
## Consentimiento remoto · dashboard · staging

**Este loop está prohibido de abrir un PR.** Su único estado terminal aceptable es
un **nombre**: `fichero:línea` del componente que decide pintar
*"Este enlace no es válido o ha expirado"*, con la evidencia que lo prueba.

Nueve iteraciones intentaron arreglar sin haber identificado. Esta identifica.

---

# PARTE A · POR QUÉ FALLARON LAS NUEVE

Antes de medir nada, el agente debe entender los tres defectos del loop anterior.
No son opinión: salen del propio expediente.

## A1 · La evidencia y el sospechoso vivían en ficheros distintos

El expediente dice, en la misma sección:

```text
Grep sobre el chunk desplegado de la PÁGINA:
    atob      0 hits   -> "el cliente NO decodifica el JWT"
    Date.now  0 hits   -> "NO compara exp localmente"

El texto del error NO está en page-*.js
El texto del error ESTÁ en 8676-d983d17a76c48eb6.js
```

El grep que descartó T3 se corrió sobre un artefacto que **no contiene el código
que produce la pantalla observada**. Un grep negativo sólo descarta una teoría si
se corre sobre el artefacto donde ocurre el comportamiento.

**Consecuencia operativa: T3 no está descartada. Nunca se midió.**
Y con ella, cualquier conclusión derivada de ese mismo grep.

## A2 · La "contradicción" de la PARTE 6 no es una contradicción

```text
Codex lee el código que DEBERÍA correr.
Cowork mide el código que CORRE.
```

Las dos afirmaciones son verdaderas a la vez si **el componente que pinta la
pantalla no es `page.tsx`**. No hace falta ninguna excepción invisible.

El expediente eligió la explicación cara (un `fetch` que lanza sin emitir, sin
dejar rastro en consola) y descartó la barata (el árbol nunca llega a montar
`page.tsx`), teniendo en la mano la prueba que apunta a la barata: **la
ubicación del string**.

En Next.js App Router el reparto de código no es arbitrario:

```text
page-*.js            -> el componente de página de ESA ruta
chunk compartido     -> layouts, templates, providers, guards,
                        error.tsx, not-found.tsx, diccionarios i18n,
                        cualquier cosa usada por más de una ruta
```

El texto vive en un chunk compartido. **La ubicación del string ya te dice la
categoría del culpable**, y esa categoría no es "página".

Refuerzo: tras I7 (que tocó `AppGate`), `8676` quedó **byte-idéntico**. Si
`AppGate` estuviera en `8676`, el hash habría cambiado. Luego lo que decide en
`8676` es **otra cosa, que ninguno de los nueve intentos tocó**.

## A3 · El loop no tenía fase de identificación; su estado terminal era un PR

Nueve iteraciones, nueve arreglos, **cero instrumentos**. Ninguna iteración
escribió una predicción falsable antes de desplegar, así que ninguna pudo fallar
de forma informativa: todas terminaron en `sin cambio`, el resultado con menos
información posible.

Y I7 produjo un chunk byte-idéntico. Eso no es una nota al pie: es una
**condición de aborto**. Significa que el despliegue no contiene el cambio, o que
el fichero tocado no participa en esa pantalla. El loop lo anotó y siguió.

---

# PARTE B · HIPÓTESIS ORDENADAS POR LO QUE LA EVIDENCIA YA FAVORECE

Las cinco explican **todo el cuadro** (cero red + consola limpia + texto en chunk
compartido). Se ordenan por coste de refutación, no por gusto.

```text
H1  Un layout / template / provider / guard del grupo (public)
    valida el token en cliente y corta antes de montar page.tsx.
    NO es el AppGate que se tocó en I7 (ese no está en 8676).
    Explica: texto en chunk compartido, cero red, consola limpia,
             y que los nueve arreglos no movieran la conducta.

H2  not-found.tsx o error.tsx del grupo (public) renderizado por
    notFound() o por un throw durante el render.
    Next captura el throw -> consola limpia. Ambos ficheros se
    compilan a chunks compartidos.

H3  Validación local del token (longitud, regex, número de segmentos,
    exp) DENTRO del componente compartido.
    T3 REVIVE: el grep que la descartó fue sobre el chunk equivocado.

H4  El fichero que se edita no sirve esa ruta.
    Conflicto de route group, rewrite en next.config, catch-all,
    o pages/ que gana sobre app/.
    Explicaría por qué ocho ficheros distintos no cambiaron nada.

H5  El fetch lanza antes de emitir (hipótesis del expediente).
    Va última: exige una excepción, y la causa típica (CSP) habría
    dejado violación en consola. La consola está limpia EN ESA RUTA.
```

---

# PARTE C · LOS EXPERIMENTOS, EN ORDEN DE COSTE

Cada uno lleva **predicción antes de ejecutar**. Si el resultado no coincide con
ninguna rama prevista, se para y se reporta: eso es información, no fracaso.

---

## E0 · Grep sobre el chunk correcto — 2 minutos, sin navegador, sin deploy

Es el experimento que el loop anterior tenía a un comando de distancia durante
cinco días.

```powershell
$U = "https://staging-dashboard.nadakki.com/_next/static/chunks/8676-d983d17a76c48eb6.js"
Invoke-WebRequest $U -OutFile "$env:TEMP\8676.js"
"len=$((Get-Item "$env:TEMP\8676.js").Length)"
$c = Get-Content "$env:TEMP\8676.js" -Raw
foreach ($p in @('atob','Date.now','\.exp','split\(','"/status"','fetch\(','no es v','uno nuevo al dealer','notFound','useParams','usePathname')) {
  "{0,-24} {1}" -f $p, ([regex]::Matches($c, $p)).Count
}
```

**Predicciones:**

```text
atob > 0  o  Date.now > 0  en 8676
  -> H3 confirmada como línea principal. Hay validación local del JWT
     en el componente compartido. El fetch nunca se alcanza porque
     alguien decidió antes con el propio token.

"/status" > 0 en 8676
  -> existen DOS implementaciones del chequeo. La que corre es la
     compartida, no la de page.tsx.

todos 0 salvo el texto
  -> el string vive en un diccionario i18n y el que decide es otro
     fichero. Pasa a E1 y E2. (Es el punto 4 de la PARTE 7 del
     expediente, la hipótesis que nadie probó.)
```

**Este experimento no requiere permiso, ni deploy, ni coordinación.**

---

## E1 · Quién renderiza el texto — 10 minutos, navegador, sin deploy

Contexto anónimo, service worker desregistrado, **todas** las pestañas del
dominio cerradas antes de empezar (el propio expediente advierte que esto costó
tres mediciones falsas).

**E1.a — React DevTools**
1. Abrir la URL fallida.
2. Pestaña *Components* → seleccionar el nodo de texto del mensaje.
3. Leer el **camino de componentes padres** en el panel derecho.

**E1.b — Call stack (el decisivo)**
1. DevTools → *Sources* → `Ctrl+Shift+F` (buscar en todos los ficheros cargados).
2. Buscar `uno nuevo al dealer`.
3. Click en el hit → abre el chunk → `{}` (pretty print) → breakpoint en esa línea.
4. Recargar.
5. **Leer el Call Stack completo.**

**Predicciones:**

```text
el stack incluye page.tsx (o su símbolo minificado)
  -> H5 sobrevive. El fallo está dentro de la página, en el catch.
     Pasa a E3 con instrumentación dentro del try.

el stack NO incluye page.tsx
  -> page.tsx NUNCA SE MONTÓ. Los nueve intentos tocaron ficheros
     irrelevantes. El nombre del componente en el stack ES la
     respuesta del loop. FIN.

el breakpoint dispara en evaluación de módulo, no en render
  -> el string es una constante de un diccionario. Ir a E2.
```

---

## E2 · Mapear chunk → fichero fuente

Dos caminos; el primero que dé el nombre gana.

**E2.a — Sourcemaps**

```text
next.config.js  ->  productionBrowserSourceMaps: true
build local o de staging
buscar el string en los *.map -> devuelve fichero + línea de fuente
```

**E2.b — Grep en el repo, con ≥3 formas sintácticas**

El expediente ya aprendió esta lección (PARTE 10) y luego no la aplicó aquí.
Buscar en `nadakki-dashboard`, rama `staging`:

```text
"uno nuevo al dealer"        forma literal
"enlace no es"               fragmento, esquiva el acento
"lido o ha expirado"         esquiva "válido" partido o escapado
\u00e1lido                   forma escapada en unicode
invalid_token / consent.     posibles claves de i18n
```

Y en estos sitios, que no son código de página:

```text
messages/  locales/  i18n/  dictionaries/  *.json
app/(public)/layout.tsx    template.tsx
app/(public)/error.tsx     not-found.tsx    loading.tsx
components/**/*Gate*  *Guard*  *Provider*  *Boundary*
middleware.ts
```

---

## E3 · Canario de identidad fichero → ruta — 1 deploy

Sólo si E0–E2 no dieron el nombre. Cambio de **una línea**, sin lógica:

```tsx
// primera línea del return de app/(public)/consent/[token]/page.tsx
// fuera de todo condicional, antes de cualquier hook que pueda lanzar
<span data-canary="K7F3Q9" style={{position:'fixed',top:0,left:0,fontSize:8}}>K7F3Q9</span>
```

Deploy. Abrir la URL fallida. Grep `K7F3Q9` en el chunk servido.

**Predicciones — tres mundos que nueve PRs no distinguieron:**

```text
canario VISIBLE en pantalla
  -> page.tsx se monta. El fallo está dentro. H5.

canario AUSENTE en pantalla, PRESENTE en el chunk servido
  -> el fichero se despliega pero el árbol no llega a renderizarlo.
     H1 o H2. El culpable está por encima de la página.

canario AUSENTE en pantalla y AUSENTE del chunk servido
  -> ESTÁS EDITANDO UN FICHERO QUE NO SIRVE ESA RUTA. H4.
     Revisar: salida de `next build` (lista de rutas), duplicados de
     /consent/[token], pages/ vs app/, rewrites en next.config,
     matcher de middleware.ts.
```

---

# PARTE D · REGLAS DEL LOOP

```text
R1  El estado terminal de esta iteración es un NOMBRE, no un PR.
    Prohibido abrir PR antes de que exista fichero:línea con evidencia.

R2  Una variable por iteración. Un experimento, una predicción,
    un resultado.

R3  ABORTO INMEDIATO si tras un deploy el content-hash del chunk que
    contiene el texto no cambió. No se mide conducta: se investiga
    el despliegue. (I7 violó esto y el loop siguió cinco días.)

R4  Evidencia = comando + salida literal. Nunca descripción.
    "verifiqué que..." no es evidencia.

R5  Un grep negativo sólo descarta una teoría si se corrió sobre el
    artefacto que produce el comportamiento observado, y con al menos
    dos formas sintácticas.

R6  Leer código NO reabre ni cierra nada. Sólo la ejecución.
    (Contrato de Hallazgo, ya vigente en el proyecto.)

R7  Antes de cualquier deploy adicional: intentar reproducción local
    (`next build && next start` contra el backend de staging).
    Si reproduce, el coste de iteración baja de un deploy a un reload.
    Si NO reproduce local y SÍ en staging, la diferencia es de entorno
    (variable NEXT_PUBLIC_* ausente en el build de Vercel) y eso es
    una medición, no un arreglo.

R8  Pregunta no formulada en nueve intentos: ¿ESTO FUNCIONÓ ALGUNA VEZ?
    git log del fichero + un despliegue donde el formulario se pintara.
    Si nunca funcionó, no es una regresión: es cableado, y H4 sube.
```

---

# PARTE E · CRITERIOS DE CIERRE

## Cierre de ESTE loop (identificación)

```text
D1  fichero:línea del componente que decide, nombrado
D2  el mecanismo de la decisión, citado del fuente
D3  la razón por la que las nueve iteraciones no lo tocaron,
    explicada con el reparto de chunks
D4  cuál de H1..H5 quedó en pie y cuáles murieron, con qué medición
```

## Cierre del ARREGLO (loop siguiente, otro paquete)

Se conservan los criterios del expediente. Son correctos:

```text
C1  el content-hash del chunk que contiene el texto CAMBIÓ
C2  GET /consent/{token}/status visible en Network,
    capturado desde antes de cargar
C3  con token válido, el formulario renderiza
C4  con token realmente inválido, sigue rechazando   (control negativo)
C5  sin sesión, /credit-hub/dealer sigue rebotando a /login
```

Y lo que no se puede romper (verificado el 31 de agosto):

```text
consentimiento PRESENCIAL -> POST /present/accept 200,
  fila ACCEPTED con audit_hash y accepted_at
"Marca" habilitado en vehículo usado
los cinco selects del wizard
logout -> POST /auth/logout 204
```

---

# PARTE F · SI ESTE LOOP TAMPOCO CIERRA

No se abre un loop 11 igual. Cambia el medio:

```text
falta un DATO           -> E0/E1/E2 son mediciones, no herramientas.
                           Si no se ejecutaron, el problema no es
                           técnico: es que nadie las corrió.

falta una DECISIÓN      -> reescribir la ruta pública desde cero,
                           fuera del grupo (public), sin layout
                           heredado, como página aislada.
                           Cuesta ~1 día. Se pierde la consistencia
                           visual con el resto del shell.
                           Decide César.

CAPPED_AT_EXTERNAL      -> si el bloqueo resulta ser configuración de
                           Vercel (rewrite, variable de entorno de
                           build), se declara y se escala, no se
                           itera.
```

---

**Este documento no ha sido ejecutado. Ninguna de sus predicciones está
verificada. Es un plan de medición, no un resultado.**
