# LOOP DE CIERRE · FRONTEND · uno solo
## 2026-08-28

```text
REPO         csorianoai/nadakki-dashboard
BASE         staging
PRESUPUESTO  10 interacciones con Cesar EN TOTAL
```

**Este documento reemplaza todo lo anterior.** No hay mas parches sueltos: lo que
no esta aca, no se toca.

---

# LO QUE FALTA · cuatro cosas, y las cuatro estan medidas

```text
D1   el handoff dealer -> banco     el despacho llama al endpoint equivocado
D2   el badge REAL                  sobre ofertas simuladas · dos fuentes
D3   el link del consentimiento     #426 mergeado, sin verificar en pantalla
D4   el censo de C1, C3, C4, C5     sin recorrer · la mitad que mas pesa
```

**D1, D2 y D3 no necesitan mas censo. Estan medidos.** D4 es lo unico que
requiere recorrido.

---

# D1 · EL HANDOFF · lo primero

**Medido en base:**

```text
0b20c4d2-f335-4325-bd39-61d0a9f2c3fb
  status:  COMPLETED
  ofertas: []
```

```text
el frontend llama   POST /applications/{id}/process
                    procesa con el adaptador y CIERRA la solicitud

el que reparte      POST /api/v2/credit/multi-lender/execute
                    es el fan-out · crea una oferta por lender
```

**Consecuencia medida por Cowork:** la solicitud carga bien del lado del dealer y
da `404` en cada endpoint del banco. No aparece en la cola. Las legacy
`a99000xx`, que si tienen ofertas, abren sin problema.

La cola del analista muestra `SUBMITTED`; la solicitud termino en `COMPLETED`.
**Quedo fuera por estado, no por permisos.**

**El contrato del fan-out, medido:**

```json
POST /api/v2/credit/multi-lender/execute
{
  "application_id": "...",
  "max_concurrent": 3,
  "timeout_seconds": 30,
  "dry_run": false,
  "application": {
    "mode": "BANK_ONLY",
    "applicant_data": { "applicant_name": "...", "national_id": "...", "requested_amount": 0 },
    "financial": { "requested_amount": 0, "term_months": 48, "apr_annual": 0.12, "currency": "DOP" }
  }
}
```

Los lenders **no van en el body**: salen de `tenant_lender_config` del tenant
autenticado.

```text
MEDI ANTES DE TOCAR
  ¿/process sigue haciendo falta, o el flujo es solo el fan-out,
   o los dos en orden?
  NO lo infieras del nombre · es lo que fallo tres veces en F13

VERDE   el despacho crea ofertas · application_offers con filas
        la solicitud NO queda en COMPLETED sin pasar por los bancos
        aparece en la cola del analista
        el analista abre el detalle sin 404
MUTACION  volver a llamar solo /process -> el test de "hay ofertas" rompe
```

**El test le pregunta al servidor por las ofertas**, no comprueba que el request
salio.

---

# D2 · EL BADGE `REAL` · dos fuentes independientes

**Medido en pantalla y en codigo:**

```text
la pantalla muestra
  "Exchange multi-banco  [REAL]"
  Mock 17.00%  ·  Pilot 12.00% [MEJOR]
  cero "DECISION SIMULADA"

sobre 1a302a03-3b58-4dc9-9725-ade6375e375f
que tiene dos ofertas con simulated: true

las fuentes
  components/credit-hub/dealer/DealerApplicationDetailView.tsx:310
    DataTruthBadge level="REAL"  · hardcoded para cualquier lista no vacia
  components/credit-hub/dealer/elite/OfferComparatorSpotlight.tsx:47
    deriva REAL de offers.length
```

**`offers.length` no prueba que un banco haya respondido.**

Y el censo encontro dos superficies mas donde `REAL` puede mentir:

```text
components/credit-hub/dealer/wizard/DealerWizardFrame.tsx:97
components/credit-hub/dealer/wizard/WizardCompletenessBar.tsx:18
```

```text
ALCANCE
  el badge deriva de datos del SERVIDOR, nunca de la cantidad de items
  si simulated: true -> la tarjeta dice DECISION SIMULADA
  el "ahorras RD$410,807" no se presenta como real si la oferta es simulada
  las cuatro superficies con el mismo criterio

VERDE     con simulated: true  -> la tarjeta lo declara y NO dice REAL
          con una oferta real  -> REAL, sin la marca de simulado
          nunca las dos etiquetas a la vez
MUTACION  derivar de offers.length -> el test rompe
```

**`#425` ya se mergeo y no cerro esto.** El badge `REAL` seguia saliendo de otro
lado — por eso el alcance ahora son las cuatro superficies, no una.

---

# D3 · EL LINK DEL CONSENTIMIENTO · verificar, no arreglar

`#426` esta mergeado. **Nadie lo probo en pantalla.**

```text
antes
  el dealer ve y copia el link                    ✓
  el solicitante abre el link -> "no es valido"   ✗
  token vigente 23.9 h · backend GET /status -> 200 SENT
  la pagina desplegada NO emitia el GET /status
```

**Y el censo encontro algo que hay que confirmar:**

```text
en el checkout local, app/(public)/consent/[token]/page.tsx:56-61
SI llama a getStatus · public-consent-client.ts:78-86 tambien valida

o sea: el codigo local tenia el arreglo y el deploy no lo emitia
```

```text
VERIFICAR EN PANTALLA, no en codigo
  el dealer inicia consentimiento por EMAIL
  copia el link · abrilo en otra pestana
  ¿carga el formulario o dice "no es valido o ha expirado"?
  ¿sale el GET /consent/{token}/status en la red?
  aceptar -> ¿queda la fila con audit_hash?
```

**Tercera vez que este item se reporta cerrado. Abri el link.**

---

# D4 · COMPLETAR EL CENSO

C1, C3, C4 y C5 quedaron sin recorrer. **Es la mitad donde vive todo lo demas.**

```text
credenciales
  DEALER A     qa-dealer-a@qa-b1c.com          la clave esta en el CREDS.env
                                                de nadakki-ai-suite
  ANALISTA     qa-analyst-assigned@qa-b1c.com  QaBank2026Golden7x
  ADMIN        qa-bank-admin@qa-b1c.com        QaBank2026Golden7x
```

```text
C1  el dealer origina y despacha
    con D1 arreglado, ¿el despacho crea ofertas?

C3  el analista trabaja
    cola -> abrir -> reclamar -> expediente -> decidir
    NO ejecutes la decision si eso muta datos que otro necesita

C4  el dealer recibe y compara
    usa 1a302a03-… que tiene dos ofertas persistidas
    ahi esta el badge REAL de D2

C5  la institucion configura
    credenciales -> probar conexion -> readiness -> production gates
```

**Si el backend devuelve `502`, espera diez segundos y reintenta.** Es cold start
de Render, no un defecto — la reprueba con el mismo codigo dio `200`.

---

# EL ORDEN

```text
1  D1  el handoff        sin esto no hay ofertas y nada mas se puede verificar
2  D2  el badge REAL     ya medido, cuatro superficies
3  D4  el censo          con D1 arreglado, C1 se puede recorrer entero
4  D3  verificar el link
```

---

# LAS REGLAS · que salieron de tres fracasos

```text
F13   {"fields"} vs {"changes"} -> FIELD_UNKNOWN -> POST /applicant   3 capas
F10   el link no se ve -> valida en cliente -> no emite el status     3 capas
F6    falta la marca -> el badge sale de offers.length                2 capas
```

**En los tres casos se arreglo lo que el reporte describia, no lo que estaba
roto.**

```text
ANTES DE ABRIR CADA PR, contestar por escrito:
  1  cual es el camino completo, de la primera pantalla al efecto final?
  2  donde EXACTAMENTE se corta, medido?
  3  que verifica que el camino ENTERO funciona, no solo el punto que toque?

si no podes contestar las tres, no abras el PR

Y ANTES DE CERRAR:
  "si esto estuviera roto una capa mas adentro, mi test lo detectaria?"
  si la respuesta es no, el test prueba el cambio, no el arreglo
```

```text
NO ES EVIDENCIA
  que el test pase · que el request salga
  que el codigo tenga la linea nueva · que el PR diga MERGED

SI ES EVIDENCIA
  la pantalla del efecto final
  el servidor devolviendo el dato, con el estado local descartado
  el conteo antes y despues
```

---

# LO QUE YA ESTA CERRADO · no lo toques

```text
F1   sin score no se pinta un numero
F3   banker entra al portal de banco · credit_admin NO entra al de dealer
F4   credenciales abre · "Probar" devuelve resultado real
F5   abrir el detalle no reclama · hay boton explicito
F9   /new no crea DRAFT
F11  "Tu sesion expiro"
F12  el wizard arranca en Solicitante · cero idas y vueltas
F13  el despacho persiste · applicant, vehicle, fields los tres 200
el cartel: "Borrador guardado. Aun no se ha enviado a la institucion"
```

**Verificados en pantalla, uno por uno.**

---

# ANOTADO, FUERA DE ALCANCE

```text
el 502 del refresh          intermitente · cold start de Render, no codigo
el application_id del draft vive solo en localStorage
                            si se borra, el expediente queda huerfano
documentos                  0 de 9 adjuntos · no hay ruta que sirva bytes
audit trail                 vacio
notificaciones              cero en toda la sesion
```

Los cinco van a un packet propio cuando este cierre.

---

**Generado por IA. Todo medido contra staging el 27 y 28 de agosto de 2026, en
navegador o en base.**
