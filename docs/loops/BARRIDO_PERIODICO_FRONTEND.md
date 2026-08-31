# BARRIDO PERIODICO · FRONTEND
## Loop reutilizable · Codex · `nadakki-dashboard`

```text
CADENCIA     semanal, o antes de cualquier entrega
AUTONOMIA    NO pide aprobacion para medir ni para preparar PRs
             el unico punto humano es el merge (GR-11)
BASE         staging
ENTREGA      un informe + un PR por hallazgo confirmado
```

**Este loop no arregla lo que un reporte describe. Barre por clase de defecto y
encuentra lo que nadie reporto.**

---

# POR QUE ESTAS SEIS CLASES

Salen de cinco rondas de auditoria sobre este repo. **Cada una tiene casos reales
y, mas importante, el metodo que la dejo pasar.**

---

# BARRIDO 1 · EL DATO FABRICADO

**Un valor por defecto que se pinta como dato calculado.**

```powershell
git grep -n "= 720\|= 87\|?? 17\.5\|?? 36\|?? 48\|\?\? 0\b\|\|\| 0\b" -- components app lib
git grep -rn "REAL\|SIMULAD\|DEMO\|VERIFICADO\|APROBADO" -- components app lib
```

```text
QUE BUSCAR
  parametro con default numerico en un componente que pinta un dato
    function X({ score = 720 })
  operador ?? o || con literal en el camino de render
  badge cuyo valor deriva de .length en vez de un campo del servidor
  string de estado en JSX sin condicion sobre datos reales

HEURISTICA FUERTE
  un numero redondo en un default Y el mismo nombre de campo
  existiendo en la respuesta de la API
```

```text
EL TEST QUE LO CONFIRMA
  montar el componente con el campo en null Y en undefined
  afirmar que NO aparece ningun numero

  el test que lo dejo pasar montaba el componente CON el dato
  presente · nunca con el dato ausente, que es cuando el default dispara
```

**Casos historicos: `ScoreVisual` con 720, `matchApproval` con 87, el badge
`REAL` derivado de `offers.length`, y tres defaults 17.5/36/0 en el armado de
terminos.**

---

# BARRIDO 2 · EL FIXTURE CONTRA UNA FORMA QUE LA API NO PRODUCE

**La clase de mayor valor: ningun test unitario la encuentra porque el test esta
bien escrito.**

```powershell
$api = Invoke-RestMethod "https://nadakki-ai-suite-staging.onrender.com/openapi.json"
```

```text
POR CADA fixture de test que representa una respuesta de API
  1  identificar que endpoint representa
  2  obtener la forma REAL: del OpenAPI o de una llamada viva
  3  comparar el conjunto de claves

  claves en el fixture que la API NO produce   -> HALLAZGO
  claves que la API produce y el fixture no    -> cobertura parcial
```

```text
CASO HISTORICO
  el test del badge de simulado fabricaba offer({ simulated: true })
  y afirmaba que el badge aparece · el test MUERDE
  pero la API nunca devuelve ese campo

  "el verde es cierto en el componente y falso en el producto"
```

**Y la variante estructural:** el cliente lee `data.offers` y la API devuelve
`offers_detail`. Comparar **lo que el cliente lee** contra **lo que la API
manda**, no solo los fixtures.

```powershell
git grep -rn "\.data\?\.\|response\.\|resp\." -- lib/*/api components | Select-Object -First 40
```

---

# BARRIDO 3 · EL CAMINO QUE CORRE

**Cinco arreglos aterrizaron en componentes que la aplicacion no renderiza.**

```powershell
Get-ChildItem -Recurse -Path app -Filter "page.tsx" | ForEach-Object {
  $_.FullName.Replace("$PWD\app\", "").Replace("\page.tsx","")
} | Sort-Object
```

```text
POR CADA area con mas de una copia
  ¿cual esta enlazada desde la navegacion?
    revisar el sidebar, la paleta de comandos y el menu
  ¿cual responde 200 pero sin enlace?
  ¿cuando se toco cada una por ultima vez?

Y POR CADA COMPONENTE que parezca duplicado
  git grep <NombreDelComponente> -- app/ components/ lib/
  si solo devuelve documentos, es MUERTO
```

```text
EL METODO QUE FUNCIONA
  partir de app/<ruta>/page.tsx y seguir el arbol de imports
  no buscar por nombre de fichero

  el arreglo del auto-claim toco app/(bank)/, la ruta viva
  es app/(forge)/credit-hub/ · el verde describia una copia muerta
```

**Verificar que el guard `copy-intent` cubre paginas Y componentes.** Su primera
version solo vigilaba `app/`, y la mitad del problema vivia en `components/`.

---

# BARRIDO 4 · EL MENSAJE QUE DIAGNOSTICA MAL

```powershell
git grep -rn "Failed to fetch\|Error de red\|Intentalo de nuevo\|no respondio a tiempo\|Conflicto" -- components app lib
```

```text
POR CADA mensaje de error
  ¿que codigo HTTP lo dispara realmente?
  ¿el texto corresponde a ese codigo?

CASOS HISTORICOS
  "Error de red (Failed to fetch)"   ante un 401 con cuerpo
  "Intentalo de nuevo en un momento" ante un 404 de autorizacion
  "Conflicto 409"                    ante un 400
  el JSON crudo de un 422 en un toast

COSTO MEDIDO
  un mensaje que culpaba al token cuando la causa era un parametro
  de paginacion costo un dia entero
```

**Y el caso mudo, que es peor:** un campo invalido que no muestra nada y solo
marca la seccion como incompleta. El usuario no sabe cual campo.

---

# BARRIDO 5 · EL ESTADO LOCAL CONTRA EL SERVIDOR

```powershell
git grep -rn "localStorage\|sessionStorage" -- lib components app hooks
```

```text
POR CADA dato guardado en el navegador
  ¿existe tambien en el servidor?
  ¿que pasa si el usuario cierra la pestana?
  ¿el mismo dato se escribe en DOS lugares?

EL METODO QUE LO PRUEBA
  cargar el dato · DESCARTAR el estado local · preguntar al servidor

  contar requests no alcanza: el PATCH salia y siempre daba 422
```

```text
Y DOS COSAS QUE VIGILAR SIEMPRE
  PII en storage que sobreviva al logout · Ley 172-13
  identificadores de entidad que vivan SOLO en local
    si se borran, el registro del servidor queda huerfano
```

---

# BARRIDO 6 · LAS GUARDAS PROPIAS

**Toda guarda que este repo tenga se audita a si misma.**

```text
POR CADA guard de CI y por cada test parametrizado por zona o ruta
  1  ¿falla si su lista de ficheros resuelve VACIA?
     una guarda que pasa porque no encontro nada es una mentira
  2  ¿da falsos positivos sobre codigo sano?
     una guarda ruidosa se desactiva, y una desactivada sigue
     figurando en la lista de lo cubierto
  3  ¿su limite esta declarado en un TEST, no en un comentario?
     un comentario al margen se queda viejo en silencio
```

**Tres modos de fallo propios encontrados en una sola guarda de este repo:**
falso positivo por `**spread`, ceguera por BOM, y pasar por vacio.

---

# COMO SE CIERRA UN HALLAZGO

```text
ANTES DE ABRIR EL PR, por escrito
  1  cual es el camino completo, de la primera pantalla al efecto final?
  2  donde EXACTAMENTE se corta, medido?
  3  que verifica que el camino ENTERO funciona?

ANTES DE DECLARARLO CERRADO
  "si esto estuviera roto una capa mas adentro,
   ¿mi test lo detectaria?"

  "¿mi arreglo resuelve el caso que vi,
   o la CLASE a la que pertenece?"
  si es lo primero, volve a medir
```

```text
Y LA DOBLE COMPROBACION QUE FALTO CINCO VECES
  1  el codigo esta en ORIGIN, no solo local
       git fetch origin
       git log --oneline -1 origin/staging
       git grep <simbolo> origin/staging -- <ruta>
  2  el fichero esta en el arbol de imports de la RUTA VIVA
```

---

# LA JERARQUIA DE EVIDENCIA

**Todo hallazgo declara el nivel maximo alcanzado.**

```text
L0  el codigo existe
L1  el codigo dice lo correcto
L2  un test lo cubre Y la mutacion muerde
L3  corre · el request sale
L4  el efecto persiste
L5  sobrevive al descarte del estado local
L6  la pantalla lo muestra
```

```text
un PASS sin nivel declarado NO ES UN PASS
L2 sin mutacion ejecutada es L0
L3 no prueba L4 · L4 no prueba L5 · L5 no prueba L6
```

---

# TRAMPAS DEL PROPIO BARRIDO

**Errores de metodo que cometieron auditores humanos en este repo.**

```text
NO concluir de un grep vacio
  buscar '\["clave"\]' devolvio 0 y habia cinco lectores con .get()
  todo grep negativo prueba al menos dos formas sintacticas

NO medir sobre un bundle cacheado
  el service worker sirve el viejo hasta cerrar TODAS las pestanas
  leer el ?dpl= antes de cualquier medicion de UI

NO dar por buena una mutacion verde
  comprobar que la mutacion cambio comportamiento
  "una mutacion mal planteada que pasa es indistinguible
   de un hueco real hasta que alguien la mira dos veces"

NO aceptar un timestamp como prueba de contenido
  el simbolo, no la hora

NO ampliar una lista blanca sin medir por que existe
```

---

# LO QUE ESTE LOOP NO HACE

```text
NO mergea · GR-11, el merge es de Cesar
NO borra copias sin medir quien las llama
NO toca el backend
NO arregla lo que otro loop tiene asignado
NO investiga un item ya declarado abierto y conocido
```

---

# LA ENTREGA

```text
UN INFORME con
  por cada barrido: que se midio y con que comando
  los hallazgos, con nivel de evidencia y fichero:linea
  lo que se descarto y por que

UN PR POR HALLAZGO confirmado
  con las tres preguntas contestadas en el cuerpo
  con la mutacion ejecutada, no declarada de memoria

Y SI UN BARRIDO NO ENCUENTRA NADA
  decirlo · un barrido limpio es informacion
  pero declarar que se midio, no que se asumio
```

---

**Loop reutilizable. Derivado de las auditorias del 25-30 de agosto de 2026.
Cada barrido tiene al menos un caso real detras.**
