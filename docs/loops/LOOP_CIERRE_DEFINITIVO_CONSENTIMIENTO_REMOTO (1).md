# LOOP AUTÓNOMO DE CIERRE DEFINITIVO

## Consentimiento remoto muestra “enlace no válido” sin emitir `GET /status`

Pega este documento completo como instrucción principal del agente que tenga acceso al repositorio, GitHub, staging, navegador y credenciales QA.

---

# 1. ROL Y MISIÓN ÚNICA

Actúa como **ingeniero principal de diagnóstico y cierre**, no como generador de hipótesis ni como revisor superficial.

Tu única meta es **encontrar la causa raíz demostrada, implementar la corrección mínima y cerrar definitivamente** este defecto en `csorianoai/nadakki-dashboard`, rama `staging`:

> Un token remoto válido abre `/consent/{token}`, pero la UI muestra “Este enlace no es válido o ha expirado” y el navegador no emite ninguna petición a `/api/v2/credit/consent/{token}/status`.

No declares éxito porque el código parece correcto, porque compila, porque pasan pruebas unitarias, porque abriste un PR o porque staging desplegó. **Terminar significa demostrar en el navegador desplegado los cinco criterios C1–C5 de la sección 6.**

El expediente aportado por Ramón es evidencia de entrada obligatoria. Léelo completo antes de tocar código. Trata como hechos las mediciones marcadas como tales; las inferencias siguen siendo hipótesis.

---

# 2. CONTEXTO OPERATIVO Y LÍMITES

```text
repo       csorianoai/nadakki-dashboard
rama       staging (NO main)
ruta       app/(public)/consent/[token]/page.tsx
frontend   https://staging-dashboard.nadakki.com
backend    https://nadakki-ai-suite-staging.onrender.com
```

Reglas:

1. Trabaja únicamente sobre `staging` o una rama creada desde el `staging` remoto vigente.
2. Antes de editar, verifica `git status`, SHA local, SHA remoto y cambios ajenos. No borres ni sobrescribas trabajo existente.
3. No extraigas ni imprimas secretos. Usa las credenciales QA ya configuradas.
4. No cambies contratos del backend salvo que la evidencia demuestre que la causa está allí. El mismo token ya responde `200 SENT` directamente y mediante el proxy.
5. No relajes autenticación global, middleware ni guards para “hacer que abra”. `/credit-hub/dealer` debe continuar protegido.
6. No aceptes tokens localmente ni elimines la validación del servidor.
7. Un PR por sí solo no es resultado. La medición debe hacerse sobre el deployment asociado al commit corregido.
8. No repitas sin nueva evidencia ninguna solución de los intentos I1–I8: `getStatus`, `useParams`, `usePathname`, `location.pathname`, hydration gate o `AppGate`.
9. Si aparece una causa distinta, síguela, pero demuéstrala con una observación que falsaría alternativas.

---

# 3. INVARIANTES Y HECHOS QUE NO DEBES REDESCUBRIR

Estos hechos ya están medidos:

- El JWT llega completo en `location.pathname`, conserva su cola y tiene aproximadamente 24 horas de vigencia.
- Con el mismo token y en el mismo momento, `GET /api/v2/credit/consent/{token}/status` devuelve `200` con `status: SENT`, tanto directo al backend como a través del proxy del dashboard.
- En la carga defectuosa se capturaron 73 requests y **ninguno** fue `/api/` o `/status`.
- No hubo error de JavaScript, excepción no capturada ni violación CSP visible en consola.
- El bundle de la página contiene `fetch` y `"/status"`; no contiene `atob` ni `Date.now`.
- El texto de error no vive en el chunk de la página; vive en el chunk compartido `8676-d983d17a76c48eb6.js` observado antes de la corrección.
- Los arreglos anteriores no cambiaron la conducta observable.
- Deben conservarse: consentimiento presencial, controles del wizard, “Marca” para vehículo usado, logout y protección de rutas autenticadas.

No conviertas estos hechos en conclusiones no demostradas. En particular, que el `fetch` esté en un bundle no prueba que esa función se ejecute.

---

# 4. LOOP OBLIGATORIO DE INVESTIGACIÓN Y CORRECCIÓN

Ejecuta las fases en orden. No edites código de producción antes de completar Fase A y Fase B con evidencia registrada.

## Fase A — Congelar el baseline reproducible

1. Sincroniza con `origin/staging` y registra SHA y deployment ID/hash servido.
2. Cierra todas las pestañas del dominio. Abre un contexto anónimo limpio, captura Network desde antes de navegar, desregistra el service worker y limpia Cache Storage.
3. Genera un token QA nuevo por el procedimiento del expediente.
4. Reproduce una vez el fallo y guarda:
   - URL censurada: conserva longitud y últimos 8 caracteres, no publiques el JWT completo;
   - screenshot de la pantalla;
   - HAR o listado de requests;
   - headers del documento `/consent/{token}`, especialmente `Content-Security-Policy`;
   - nombres y hashes de los chunks cargados;
   - resultado HTTP de `/status` con el mismo token fuera de la página.
5. Si no reproduce, genera otro token y repite una sola vez. Si sigue sin reproducir, no inventes una corrección: documenta que el baseline cambió y ejecuta C1–C5 sobre el SHA actual.

**Salida exigida de A:** tabla `BASELINE` con evidencia, timestamp UTC, SHA y resultado. Sin esta tabla no avances.

## Fase B — Localizar quién pinta realmente el mensaje

Haz trazabilidad bidireccional, no una búsqueda única:

1. Busca el texto visible completo y fragmentos normalizados en todo el repo, incluidos catálogos i18n, JSON, providers, layouts, error boundaries, guards y componentes compartidos.
2. Si el texto viene de i18n, identifica la clave y busca todos sus lectores con al menos estas formas: acceso por punto, corchetes, `.get(...)`, función `t(...)`, imports/re-exports y claves construidas.
3. Desde cada lector, sigue imports y árbol de render hasta la ruta real `app/(public)/consent/[token]`, incluyendo `layout.tsx`, providers, gates, templates, loading y error boundaries.
4. Desde la ruta, sigue en sentido contrario todas las ramas que pueden seleccionar ese mensaje.
5. Mapea source file → módulo webpack/chunk → chunk servido. Usa sourcemap si existe; si no, inserta una marca temporal única y segura para comprobar qué componente se monta.
6. Monta la **ruta completa con sus wrappers**, no solo `page.tsx`, en una prueba de integración.

**Salida exigida de B:** una cadena demostrable:

```text
texto/clave → componente exacto → condición exacta → wrapper/ruta → módulo/chunk servido
```

Si no puedes construir esa cadena, todavía no conoces el defecto y no puedes corregirlo.

## Fase C — Instrumentar el runtime antes de adivinar

Añade instrumentación temporal, sin tokens ni PII, con un prefijo único como `[CONSENT_DIAG_V1]`. Debe registrar como mínimo:

```text
route_mounted
token_resolved: boolean, token_length, token_suffix_8
status_validation_entered
request_url construida (token censurado)
immediately_before_fetch
fetch_resolved: HTTP status
catch: error.name, error.message, stack y fase
render_branch seleccionada
componente que seleccionó la rama
```

Instrumenta también la implementación real de `getStatus` desde la entrada hasta la línea inmediatamente anterior al `fetch`. Si usa un wrapper/API client, instrumenta sus interceptors, validaciones y construcción de URL.

Despliega esa instrumentación en staging. Confirma que el navegador carga el commit instrumentado mediante una marca/version visible en el bundle o endpoint de build. Reproduce con Network abierto desde el inicio.

Clasifica el resultado exclusivamente según la primera marca ausente:

| Última evidencia observada | Próxima investigación obligatoria |
|---|---|
| No aparece `route_mounted` | Otro componente/wrapper decide antes; volver a B y localizarlo |
| Monta, pero no entra a validación | Condición/effect/dependencia impide ejecutar; inspeccionar rama y ciclo de vida |
| Entra, pero no llega a `before_fetch` | Excepción previa dentro de `getStatus` o cliente API |
| Llega a `before_fetch`, sin request | URL/request inválido, CSP, interceptor o monkey patch; capturar excepción y policies |
| Request sale y falla | Analizar respuesta, CORS, proxy y parsing con evidencia |
| Request da 200 y aun pinta inválido | Estado/race/render equivocado o segundo componente sobrescribe la vista |

No abras un PR correctivo todavía si la instrumentación no identifica la transición exacta entre “funciona” y “falla”.

## Fase D — Formular y falsar la causa raíz

Escribe una sola hipótesis en este formato:

```text
CAUSA PROPUESTA:
Cuando [condición exacta], [archivo:símbolo/línea lógica] ejecuta [mecanismo],
por lo que [evidencia observada] y la UI termina en [rama exacta].

PREDICCIÓN FALSABLE:
Si esta causa es correcta, al cambiar únicamente [variable/control], debe ocurrir [resultado].
Si no ocurre, la hipótesis queda descartada.
```

Ejecuta la predicción. Si falla, vuelve a Fase C con la nueva evidencia. No parches la hipótesis fallida.

## Fase E — Implementar la corrección mínima

Solo después de confirmar la causa:

1. Escribe primero una prueba que falle por la causa exacta y monte la ruta/wrappers relevantes.
2. Implementa el cambio mínimo en el punto que realmente decide.
3. Distingue estados explícitos: `resolving/loading`, `valid`, `invalid/expired` y `transport/internal error`. Un error de configuración, CSP, red o excepción interna no puede disfrazarse automáticamente como “token inválido”.
4. La autoridad sobre validez debe seguir siendo el servidor.
5. Elimina logs temporales o conviértelos en telemetría segura y estructurada sin token/PII.
6. Ejecuta lint, typecheck, build y las pruebas relevantes. Registra comandos, exit codes y resultados.
7. Revisa el diff completo buscando cambios accidentales, bypasses y secretos.

## Fase F — Desplegar y verificar como usuario real

1. Sube la rama/PR según el flujo del repo y despliega en staging.
2. Demuestra que el deployment corresponde al commit corregido.
3. Cierra todas las pestañas del dominio y comienza con navegador anónimo limpio.
4. Genera **un token nuevo** después del deployment.
5. Captura Network desde antes de abrir la URL.
6. Ejecuta todos los criterios C1–C5, incluidos controles negativos y regresiones.
7. Si cualquiera falla, el loop continúa desde la fase asociada. No declares “parcialmente arreglado”.

## Fase G — Cierre o bloqueo honesto

Solo hay dos salidas válidas:

- `FIXED`: C1–C5 pasan con evidencia en el deployment del commit corregido.
- `BLOCKED`: existe una dependencia externa o permiso imposible de obtener, identificado con precisión. “No tuve tiempo”, “parece cache”, “los tests pasan” o “abrí PR” no son bloqueos.

Antes de `BLOCKED`, agota todos los pasos seguros y deja el experimento exacto que falta, por qué no puede ejecutarse y qué acceso puntual lo desbloquea.

---

# 5. CONTROL DEL LOOP

Mantén un ledger acumulativo; no borres iteraciones anteriores:

| Iteración | Hipótesis única | Evidencia nueva | Prueba falsable | Resultado | Decisión siguiente |
|---:|---|---|---|---|---|

Reglas de iteración:

1. Cada vuelta debe producir al menos una evidencia nueva que reduzca el espacio causal.
2. Si dos vueltas consecutivas no producen evidencia nueva, detente y revisa la instrumentación o el árbol de render; no hagas un tercer parche.
3. Máximo una causa propuesta y un cambio correctivo por iteración.
4. Toda afirmación debe etiquetarse `MEDIDO`, `LEÍDO EN CÓDIGO` o `INFERENCIA`.
5. `LEÍDO EN CÓDIGO` jamás sustituye una medición de runtime.
6. Los resultados negativos también se conservan para evitar repetir I1–I8.
7. No uses el hash histórico `8676-...` como requisito literal si el build legítimamente recompone chunks; usa el mapeo source→módulo→chunk y prueba que el deployment contiene el cambio correcto.

---

# 6. CONTRATO DE TERMINACIÓN — TODO O NADA

No puedes escribir `FIXED`, `DONE`, `RESOLVED`, “corregido” ni equivalente hasta presentar esta matriz completa:

| ID | Prueba en staging desplegado | PASS requerido |
|---|---|---|
| C1 | El artefacto/chunk que contiene el componente decisor corresponde al commit corregido y su hash o contenido cambió respecto al baseline | Sí |
| C2 | Con token válido nuevo, Network muestra `GET /api/v2/credit/consent/{token}/status` y respuesta `200 SENT` | Sí |
| C3 | Con ese token, renderiza el formulario remoto y no el mensaje de inválido | Sí |
| C4 | Token manipulado, expirado o inexistente es rechazado por respuesta del servidor y la UI conserva el rechazo correcto | Sí |
| C5 | Sin sesión, `/credit-hub/dealer` redirige a `/login`; además pasan las regresiones de la sección 7 | Sí |

La prueba debe identificar:

```text
commit SHA
deployment/build ID
fecha/hora UTC
navegador/contexto
token válido censurado por longitud + sufijo
request y status observados
screenshot o artefacto de cada estado
```

Un test local no reemplaza C2–C5. Una llamada manual a `/status` no reemplaza C2. Ver el formulario sin observar la validación no reemplaza C2 ni C4.

---

# 7. REGRESIONES OBLIGATORIAS

Además de C1–C5, verifica y registra:

- consentimiento presencial: `POST /present/accept → 200`, fila `ACCEPTED`, `audit_hash`, `accepted_at`;
- “Marca” se habilita para vehículo usado;
- funcionan los cinco selects: Tipo de contrato, Marca, Concepto, Frecuencia e Institución bancaria;
- logout del sidebar ejecuta `POST /auth/logout → 204` y termina la sesión;
- los cuatro métodos remotos (`EMAIL`, `WHATSAPP`, `SMS_OTP`, `SELFIE`) ya no caen por la misma causa de entrada. Si alguno requiere un proveedor externo no disponible, valida al menos que la ruta y `/status` funcionan con un token de ese método y documenta el límite externo.

Si una regresión falla, revierte o corrige antes de cerrar. No sacrifiques seguridad para recuperar consentimiento remoto.

---

# 8. FORMATO ÚNICO DEL INFORME FINAL

```markdown
# VEREDICTO
FIXED | BLOCKED

# CAUSA RAÍZ DEMOSTRADA
- condición exacta
- archivo y símbolo responsables
- por qué no salía la petición
- por qué se mostraba exactamente ese mensaje

# EVIDENCIA ANTES/DESPUÉS
| Señal | Baseline | Corregido |
|---|---|---|

# CAMBIO MÍNIMO
- archivos
- explicación del diff
- prueba que fallaba antes y pasa después

# MATRIZ DE CIERRE
| Criterio | Resultado | Evidencia |
|---|---|---|
| C1 | PASS/FAIL | ... |
| C2 | PASS/FAIL | ... |
| C3 | PASS/FAIL | ... |
| C4 | PASS/FAIL | ... |
| C5 | PASS/FAIL | ... |

# REGRESIONES
| Flujo | Resultado | Evidencia |
|---|---|---|

# TRAZABILIDAD
- commit SHA
- PR
- deployment/build ID
- timestamp UTC

# RIESGO RESIDUAL
- ninguno conocido, o lista concreta
```

Si el veredicto es `BLOCKED`, la matriz debe conservar los resultados reales y añadir:

```markdown
# BLOQUEO EXACTO
- acción que no pudo ejecutarse
- error literal
- acceso o decisión puntual requerida
- comando/paso exacto para continuar
```

---

# 9. ORDEN FINAL DE EJECUCIÓN

```text
READ expediente completo
→ BASELINE reproducible
→ TRACE texto hasta decisor real
→ INSTRUMENT runtime desplegado
→ ISOLATE primera transición fallida
→ FALSIFY hipótesis única
→ TEST que reproduce causa
→ PATCH mínimo
→ VERIFY local
→ DEPLOY commit identificado
→ PROVE C1–C5 y regresiones
→ REPORT FIXED o BLOCKED
```

Empieza ahora. Tu primera respuesta de trabajo debe contener únicamente: SHA base, estado del workspace, evidencia de lectura del expediente y el plan inmediato para producir la tabla `BASELINE`. No propongas todavía una causa raíz.
