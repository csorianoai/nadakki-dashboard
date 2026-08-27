# LOOP B · FRONTEND · Codex

```text
REPO         csorianoai/nadakki-dashboard
PRESUPUESTO  6 interacciones con Cesar EN TOTAL, no por item
             agotado: paras y reportas lo cerrado y lo que falta
             NO pides mas · Cesar decide si abre otro turno
MODO         secuencial dentro del loop · B3 y B1 comparten carpeta
PARALELO     con LOOP A · repos distintos, cero colision
```

**Accion cero ya cumplida:** staging y la rama de integracion en `4b2456cc`,
`cola_visible_para` presente en el SHA desplegado, cero PRs abiertos en los dos
repos.

---

## TERRITORIO EXCLUSIVO

```text
lib/api/finance.ts
lib/autos-portal/**
app/(forge)/credit-hub/dealer/applications/new/**
app/(forge)/credit-hub/activacion/**
app/consent/**
components/credit-hub/**

PROHIBIDO
  app/(bank)/**       pantallas del banco
  app/credit/**       duplicado historico
  app/bank/**         muerta · 1 commit en 6 meses
  lib/auth/**         se toco hoy · CONGELADO
  cualquier fichero del backend

NO borrar pantallas en este loop
```

---

## ESTADOS TERMINALES

```text
CERRADO_CON_EVIDENCIA
PREMISA_REFUTADA      la medicion contradice el brief
                      paras, reportas la medicion, NO improvisas arreglo
                      devuelve el item a Cesar · no cuenta como cerrado
BLOQUEADO_CRUZADO     el item necesita el backend -> no se toca
BLOQUEADO_EXTERNO     no cuenta como cerrado
```

---

## GATE-0

```text
HUELLA POR TENANT · el total NO sirve
  el tenant 00000000-0000-0000-0000-000000000001 suma decenas al dia
  ORIGEN SIN MEDIR · no comparte tenant_id con c1a00001,
  asi que no altera su huella

  c1a00001-0000-4000-a000-000000000001    29 solicitudes
  0a91ee98 · 550e8400 · d3b00111          conteo propio de cada uno

STOP_GLOBAL   si cualquiera de los tres protegidos cambia de conteo,
              en cualquier momento: se detiene TODO el loop

DATO CONTAMINADO · declarado
  credit_consent_events tiene 1 fila SINTETICA · event 38e967ca
    initiate PRESENT sobre a9900004 · 27-ago
  a9900004 tiene ademas bank_claim activo de c1a0a001
  -> NO usar a9900004 como caso limpio de consentimiento
  -> la linea base para medir el wizard es 1, no 0

CRITERIO DE LIMPIEZA
  se borra: la fila 38e967ca · es de una prueba de contrato
  NO se borran: las filas que cree el VERDE de B1 · son evidencia del cierre
                se declaran en el reporte y Cesar decide
```

---

# B4 · datos fabricados · PRIMERO

```text
CARPETA   lib/api/finance.ts   exclusiva de este item
```

**Medido:**

```javascript
BANK_RATES = { credicefi: 0.135, piloto: 0.128, otro: 0.142 }
matchApproval  catch -> { score: 87 }
```

**Son dos problemas distintos, no uno:**

```text
las tasas    un banco nuevo no entra sin tocar codigo
             rompe la promesa de "onboarding sin codigo"
             y son legibles en el bundle del navegador

el score 87  numero INVENTADO en un catch, presentado como dato
             indistinguible de uno calculado
             misma familia que el ?? 0
             ES EL MAS GRAVE DE LOS DOS
```

**Medicion previa · no lo des por mecanico:**

```powershell
git grep -rn "tenant.*config\|rates\|useTenantConfig" -- lib app components hooks
```

El alcance es amplio a proposito. Buscar solo en `lib/api` produciria un vacio
que se leeria como "no existe endpoint" — y esa clase de busqueda mal apuntada
costo tres diagnosticos en el sprint.

```text
si existe endpoint de config de tenant   -> el item va entero
si NO existe                             -> se parte:
  B4a  quitar el score inventado          MECANICO · cierra hoy
  B4b  las tasas desde backend            PREMISA_REFUTADA · necesita endpoint
```

```text
VERDE   el 87 desaparece
        backend caido -> la UI DECLARA la ausencia, no inventa numero
        patron que el propio sistema ya usa:
          "Ningun banco reviso esta solicitud"
        si B4b procede: grep credicefi|piloto en lib/ app/ components/ -> 0

MUTACION  restaurar el 87 -> el test rompe
```

---

# B5 · pantalla de credenciales · MEDIR ANTES DE ESCRIBIR

```text
CARPETA   app/(forge)/credit-hub/activacion/**   exclusiva
```

**Contradiccion sin resolver:**

```text
se afirma que activacion/{credenciales,readiness,configuracion} existen
y que CredentialVaultView aparece en imports de credit-hub

pero un git grep de "credential" en app/ devolvio SEIS ficheros
y ninguno era de institucion
```

**Primer paso · no escribas nada antes:**

```powershell
git grep -rln "institucion\|credencial\|CredentialVault" -- app components lib
```

```text
consume /api/v2/institucion/credenciales  -> cablear · item chico
no lo consume                             -> PREMISA_REFUTADA · para y reporta
                                             construir es otro tamano
```

**Backend medido:**

```text
POST /api/v2/institucion/credenciales      { provider, credentials }
POST .../credenciales/{credential_id}/probar
GET  .../readiness · .../production-gates · .../certificacion
```

```text
VERDE   guardar credencial de prueba -> el backend la recibe
        "probar conexion" -> estado real del endpoint, no mock
        readiness muestra los production-gates reales
        NO sembrar credenciales reales de ningun proveedor
```

---

# B2 · el embudo desde autos · DECIDIDO POR CESAR

```text
CARPETA   lib/autos-portal/**
```

**Medido:**

```text
el front llama POST /api/v1/autos/finance/applications  -> NO EXISTE
en staging existe        POST /api/v1/autos/credit/applications
createApplication SIEMPRE cae al catch · fromBackend false siempre
el puente NUNCA creo una solicitud
```

**La decision, en las palabras de Cesar:** *que llenen el mismo formulario que
tenemos en el core, asi se procesa con los mismos campos.*

```text
ALCANCE
  useFinancingBridge deja de llamar createApplication
  solo pasa el preset por URL y redirige a new/applicant
  la solicitud se crea UNA sola vez, en el formulario del core,
  con los campos que el contrato exige

RAZON  no es "quitar la creacion": es UN SOLO FORMULARIO en todo el producto
       una implementacion, un contrato, un lugar donde arreglar
       arreglar la ruta rota dejaria dos formularios y dos contratos

Y el comprador en la ficha del vehiculo no tiene cedula ni nombre completo:
crear ahi produciria solicitudes que despues dan 400 applicant_data_required
```

```text
VERDE   clic en financiamiento -> llega a new/applicant con los 4 params en la URL
        CERO llamadas a /finance/applications en la pestana de red
MUTACION  restaurar la llamada -> el test de "cero llamadas" rompe
```

---

# B3 · new/applicant lee el preset

```text
CARPETA   app/(forge)/credit-hub/dealer/applications/new/**
          COMPARTIDA con B1 -> van en serie, NUNCA en paralelo
```

```text
MEDIDO  grep de searchParams|vehicle_id|down_payment en new/ -> VACIO
        el comprador llega a un formulario en blanco

VERDE   vehicle_id, term_months, down_payment, requested_amount precargados
        sin preset -> formulario normal, sin romper
        editables por el usuario
```

**B2 y B3 son el mismo circuito:** B2 pasa los datos, B3 los recibe. Si B2 cierra
y B3 no, el embudo sigue roto — el preset viaja y nadie lo lee.

---

# B1 · el consentimiento en el wizard · ULTIMO

```text
CARPETA   app/(forge)/credit-hub/dealer/applications/new/consent/**
          app/consent/**   la pantalla publica
          COMPARTE new/ con B3 -> despues de B3, nunca a la vez
```

**Por que ultimo:** tiene diseno de UI, no es refactor mecanico. Y B3 toca la
misma carpeta — hacerlo antes obliga a rehacer el merge.

**Backend verificado en runtime hoy:**

```text
POST /api/v2/credit/consent/{application_id}/initiate   { method }
     method: PRESENT | WHATSAPP | EMAIL | SMS_OTP | SELFIE    MAYUSCULAS
     phone/email opcionales segun el metodo
     -> { token, event_id, expires_at, status: "INITIATED" }
     PRESENT devuelve token NULL · correcto, presencial no lleva link

POST /api/v2/credit/consent/{token}/accept
GET  /api/v2/credit/consent/{token}/public       SIN JWT
GET  /api/v2/credit/consent/{token}/status
GET  /api/v2/credit/consent/application/{id}/history

credit_consent_events   23 columnas
  method · token · otp_hash · selfie_storage_key · consent_text_version
  full_name_signature · audit_hash · ip_address · user_agent
  sent_at / viewed_at / accepted_at / expired_at
```

```text
ALCANCE
  new/consent llama initiate con el metodo que el dealer elija
  /consent/{token} (pantalla publica, ya existe) consume public y accept
  el wizard no avanza sin consentimiento aceptado

CASO DE PRUEBA
  NO usar a9900004 · esta contaminada
  crear una solicitud nueva y DECLARARLA en el reporte
  eso mueve la huella de c1a00001 de 29 a 30 · se declara, no se oculta

VERDE  PRESENT -> fila nueva en credit_consent_events · token null · la UI no rompe
       EMAIL   -> token no nulo · la pantalla publica lo abre SIN login
       aceptar -> status accepted · audit_hash presente
       avanzar sin consentimiento -> bloqueado con mensaje

MUTACION  quitar la llamada a initiate -> el conteo no sube
```

**PRESENT y EMAIL son caminos distintos.** El VERDE cubre los dos o declara cual
mide — presencial no tiene link que abrir.

---

# CIERRE

```text
CONTRA STAGING, no con tests verdes
  el backend esta en 4b2456cc · verificar que la UI hable con ese SHA
  listas de ids, NUNCA conteos
  huella por tenant identica a GATE-0, salvo lo declarado

REGLA  contar casos VERDE declarados == tests que los cubren
       y por cada VERDE que dependa de "A habilita B":
       verificar que B LEA lo que A escribe ANTES de escribir el test

GR-11 Cesar mergea · GR-12 <=500 LOC y <=2 directorios
la base va a audit/cierre-32-integration, NUNCA a main
```

---

# QUE APORTA ESTE LOOP AL CORE

```text
B4  hoy la UI inventa un score de 87 cuando el backend falla
    y las tasas de los bancos estan escritas en el codigo
    APORTA: que ningun numero falso llegue a una pantalla
            y que un banco nuevo entre sin tocar codigo

B5  hoy el backend de credenciales existe y no hay donde usarlo
    APORTA: que un banco pueda conectarse solo, sin que Cesar toque nada

B2  hoy el puente llama a una ruta que no existe · nunca creo una solicitud
B3  hoy el comprador que viene de un vehiculo llega a un formulario vacio
    APORTAN: que el embudo desde autos llegue al credito con los datos,
             usando UN SOLO formulario en todo el producto

B1  hoy ninguna solicitud del sistema tiene consentimiento
    el backend esta completo: OTP, selfie, firma, hash de auditoria
    APORTA: lo unico que NO se puede probar despues de conectar el buro
            es lo que hace legalmente correcto el producto
```

**En una linea:** este loop hace que el core sea **vendible a un banco** — que se
conecte solo, que no invente datos, y que el consentimiento exista.

---

**Generado por IA. Estado medido contra staging el 26 y 27 de agosto de 2026.
Lo que no se midio esta marcado como SIN MEDIR.**
