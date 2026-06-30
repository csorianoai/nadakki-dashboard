# HANDOFF — Nadakki Credit Hub (Forge) · Módulo de Monetización, Métricas y Reportes
### Especificación exhaustiva para Cursor — reconstruir el prototipo `Credit Hub Monetizacion.dc.html` 1:1

> **Fuente de verdad visual/interactiva:** `Credit Hub Monetizacion.dc.html`. Este documento describe TODO
> (tokens, layout, cada bloque, cada interacción, todos los datos de muestra, fórmulas y el contrato de API)
> para reimplementarlo idéntico en el stack real. Si algo no está aquí, mira el archivo; no improvises.
>
> **Alcance de esta entrega:** 3 pantallas que prueban el lazo de monetización completo — **1 Dashboard
> god-view**, **4 Configuración de cobro**, **7 Estado de cuenta / factura** — más la **firma del módulo:
> el drawer de trazabilidad cifra→eventos de origen**. La **2ª tanda** (2 Ingresos, 3 Costo & margen,
> 5 Métricas banco, 6 Métricas dealer, 8 Reconciliación) está descrita en §6BIS. Las 8 están construidas
> y el nav completo está activo.

---

## 0. Reglas no negociables
1. **Captura todo siempre, factura sobre un subconjunto.** Las métricas se registran sin importar el modelo activo; cambiar de modelo o re-facturar es mover el selector, no recopilar datos nuevos.
2. **Auditabilidad primero.** Ninguna cifra facturable sin camino a su evento de origen. Es el moat — hazlo visible, no escondido.
3. **Multi-tenant / white-label.** Ninguna marca hardcodeada: branding (logo, color, inicial) viene del tenant. Agregar una institución es configuración, no rediseño.
4. **Datos ficticios etiquetados.** Banner DEMO persistente + badge en la factura. Nunca presentar dato demo como real.
5. **Aislamiento por actor.** Banco no ve otro banco; dealer no ve otro dealer; solo la plataforma (Nadakki) ve todo.
6. **DR-aware.** ITBIS 18% en facturas, moneda RD$, separador de miles, fechas locales.
7. **Quality floor.** Responsive hasta móvil, foco de teclado visible, contraste AA sobre fondo oscuro, respeta `prefers-reduced-motion`.

---

## 1. Sistema de diseño — tokens EXACTOS

Estética: **trading desk / NOC financiero**. Oscuro, denso, dato-forward, audit-grade. Nada de SaaS claro genérico.

Definir como CSS custom properties en el contenedor raíz:

```
--bg:#0c1316        /* fondo tinta de la app */
--panel:#131d21     /* paneles, cards, KPIs */
--panel2:#0f181c    /* fondos hundidos: nav, barras de progreso, drawer, top bar, filas mono */
--line:#22323a      /* todos los bordes y divisores */
--ink:#e8f0f2       /* texto principal (AA sobre panel) */
--ink-soft:#aebcbf  /* texto secundario / labels de fila */
--sub:#74908f       /* metadatos, notas, ejes */
--green:#2bd073     /* MARCA Nadakki · aprobado/fundeado/positivo · acento primario */
--amber:#f4b740     /* pendiente / advertencia / cerca de límite */
--red:#f06150       /* error / margen negativo / SLA incumplido */
--blue:#54a8ec      /* en-vuelo / ofertas / documentos */
--violet:#a98bf0    /* decisiones IA / Legal / secundario */
--tenant:<color>    /* = color del tenant activo (white-label). Cambia con el switcher. */
```

- Texto sobre botones verdes/CTA: **`#06160f`** (tinta casi negra) — nunca blanco sobre verde.
- Sombra de CTA verde: `0 6px 16px -8px rgba(43,208,115,.6)`.
- Banner DEMO: fondo `repeating-linear-gradient(135deg, rgba(244,183,64,.08) 0 11px, transparent 11px 22px)`, borde inferior `--line`, texto `--amber`, strong `#f7cd7a`, punto `--amber` con glow.

### Tipografía
- **Space Grotesk** (400–700) — display: logo, títulos de panel/sección, nombres de plan, totales destacados.
- **JetBrains Mono** (400–700) — TODO dato numérico: montos, %, bps, tokens, latencias, IDs, hashes, timestamps. Siempre con `font-variant-numeric: tabular-nums`.
- **Inter** (400–600) — cuerpo y UI (labels, botones, descripciones).
- **Regla de oro:** todo monto/porcentaje/token/latencia va en JetBrains Mono tabular. RD$ con separador de miles y 2 decimales en facturas (`RD$ 235,500.00`); abreviado en KPIs (`RD$ 78.5M`).

### Movimiento
Deliberado y discreto: punto pulsante en la cinta en vivo (`@keyframes` opacidad .4↔1, 1.6s), hover que sube `border-color` a `--tenant`/verde. **No** uses animaciones de entrada que dejen contenido en `opacity:0` (fade/slide en wrappers) — pintan vacío en este runtime; el prototipo final no lleva ninguna animación de entrada en wrappers de pantalla ni en el drawer.

---

## 2. Layout global

```
┌──────────────────────────────────────────────────────────────────────┐
│ BANNER DEMO (full width, sticky top)                                   │
├──────────┬─────────────────────────────────────────────┬──────────────┤
│ NAV RAIL │ TOP BAR (título · tenant switcher · periodo · Generar factura)│
│ 222px    ├─────────────────────────────────────────────┤  DRAWER      │
│ (panel2) │ CONTENIDO (scroll-y)                         │  432px       │
│          │   pantalla 1 / 4 / 7                         │  (cifra→     │
│          │                                              │   eventos)   │
└──────────┴─────────────────────────────────────────────┴──────────────┘
```
- Altura = viewport; banner y nav y top bar fijos; **solo el contenido scrollea**. El drawer es hermano del contenido (no overlay): empuja, ancho fijo 432px, con su propio scroll interno.

### 2.1 Nav rail (222px, fondo `--panel2`)
- Logo: cuadro 32px gradiente `150deg,#2bd073,#15966f`, ícono line-chart en `#06160f`; a la derecha "Forge" (Space Grotesk 15px) + "CREDIT HUB · NADAKKI" (9.5px, `--sub`, tracking .1em).
- Label de grupo "MONETIZACIÓN" (9.5px, `--sub`, tracking .11em).
- 8 ítems en orden: **Dashboard god-view**, Ingresos, Costo & margen, **Configuración de cobro**, Métricas del banco, Métricas del dealer, **Estado de cuenta**, Reconciliación.
  - **Las 8 están activas** (nav completo). Ítem seleccionado: fondo `rgba(43,208,115,.1)`, borde `--line`, texto `--ink`, peso 600, punto verde 6px a la derecha. No seleccionado: texto `--ink-soft`.
- Pie: card "OPERADOR" con avatar "N" verde + "Nadakki · god-view · todos los tenants".

### 2.2 Top bar (fondo `--panel2`, borde inferior `--line`)
- Izquierda: título de pantalla (Space Grotesk 16px) — "Dashboard · god-view" / "Configuración de cobro" / "Estado de cuenta". Divisor vertical. **Tenant switcher** (white-label): botón con cuadro inicial 20px en `--tenant`, nombre + sub (tipo·modelo), ícono swap. Click = cicla entre tenants (demo). Hover: borde `--tenant`.
- Derecha: chip "Periodo · mayo 2026" (ícono calendario). Botón **Generar factura** (CTA verde, texto `#06160f`): navega a pantalla 7 + toast "Factura generada · mayo 2026 · RD$ 462,442.00".

### Tenants demo (switcher)
1. **Banco del Cibao** — Banco · Híbrido (B2) — inicial BC — `#2bd073` (el tenant ancla; config y factura usan este).
2. **Banco Atlántico** — Banco · Comisión pura — BA — `#54a8ec`.
3. **Auto Crédito del Cibao** — Dealer · Pro — AC — `#a98bf0`.

---

## 3. PANTALLA 1 · Dashboard god-view

Padding 20px 22px. De arriba a abajo:

### 3.1 Tira de alertas (guardarraíl de rentabilidad — arriba del todo)
Fila flex que envuelve, 3 cards (cada una `flex:1; min-width:230px`):
- **MARGEN BAJO UMBRAL** (rojo): fondo `rgba(240,97,80,.07)`, borde `rgba(240,97,80,.28)`, punto rojo con glow. Texto: "Banco Atlántico · margen efectivo 9% < 15%".
- **CERCA DEL LÍMITE** (ámbar): "Auto Crédito del Cibao · 92% de solicitudes del plan".
- **COSTO LLM DISPARADO** (ámbar): "Banco Nacional RD · +38% vs. mes previo".
Cada card: kind (11px, 600, color del estado) + texto (12px `--ink-soft`).

### 3.2 KPIs de NEGOCIO (4 cards clicables)
Label de sección "NEGOCIO · clic en una cifra para ver su origen". Grid 4 columnas. Cada card (`--panel`, borde `--line`, cursor pointer, hover sube borde):
- Header: label (11.5px `--ink-soft`) + delta (10.5px mono; verde si `+`, rojo si `−`, `--sub` si neutro).
- Valor: JetBrains Mono 25px, 600, tabular.
- Pie: sub (10.5px `--sub`) + chip "ver origen ↗" (10px, `--tenant`).
Datos (cada uno abre su drawer):

| label | valor | delta | sub | drawer key |
|---|---|---|---|---|
| GMV financiado | RD$ 78.5M | +12.4% | 34 préstamos fundeados | `gmv` |
| Take rate | 2.8% | +0.3pp | ingreso / GMV | `takerate` |
| MRR | RD$ 1.84M | +6.1% | recurrente | `mrr` |
| Margen bruto | 61% | −2pp | ingreso − costo servir | `margen` |

### 3.3 KPIs OPERATIVOS (4 cards no clicables)
Grid 4 col, cards más bajas: label (11px `--sub`) + valor mono 18px + delta. Datos: Subastas activas `27` (+4) · Bancos en línea `18/20` (−1) · Aprobación `47%` (+1.5pp) · Tiempo a 1ª oferta `4.2s` (−0.6s).

### 3.4 Dos columnas (grid 1.55fr / 1fr)
**Ingreso por modelo de cobro** (card): header con título + total mono "RD$ 1,569,200.00". 5 barras (label con cuadrito de color + monto·% mono a la derecha; barra: track `--panel2` h7, fill al % con el color):
- Comisión (success fee) — RD$ 642,500 — 41% — `--green`
- Suscripción / base — RD$ 470,000 — 30% — `--blue`
- AI metered — RD$ 286,400 — 18% — `--violet`
- Seats — RD$ 92,000 — 6% — `--amber`
- Overage / otros — RD$ 78,300 — 5% — `--sub`

**Cinta de eventos facturables** (card): header con punto verde pulsante + título. Filas (time mono 38px · tag de color · texto elipsado · monto mono):
- 16:40 · FUNDEADO(verde) · DEAL-7801 · Banco del Cibao · +15,600
- 16:38 · IA(violet) · scoring · solicitud SOL-9920 · +2.50
- 16:35 · OFERTA(blue) · Banco Atlántico → SOL-9918 · —
- 16:33 · DOC(blue) · OCR cédula · SOL-9917 · +6.00
- 16:30 · FUNDEADO · DEAL-7799 · Banco Nacional RD · +9,300
- 16:28 · IA · análisis SIC · SOL-9915 · +6.00

### 3.5 Tabla de tenants (card, full width)
Header: "Tenants · ingreso, costo y margen" + nota "margen efectivo = (ingreso − costo de servir) / ingreso".
Columnas (grid `1.6fr .8fr 1fr 1fr 1fr .9fr`): TENANT · MODELO · GMV/VOLUMEN(der) · INGRESO(der) · COSTO(der) · MARGEN(der). Montos en mono tabular. Hover de fila: `rgba(34,50,58,.28)`.
Badge de margen: verde si ok, ámbar si warn, rojo si bad (fondo/borde a juego, mono 12px). Filas:

| tenant | tipo | modelo | gmv | ingreso | costo | margen | estado |
|---|---|---|---|---|---|---|---|
| Banco del Cibao (BC, verde) | Banco | Híbrido | 78.5M | 391,900 | 152,800 | 61% | ok |
| Banco Atlántico (BA, blue) | Banco | Comisión pura | 54.2M | 271,000 | 246,600 | 9% | **bad** |
| Banco Nacional RD (BN, amber) | Banco | Ilimitado | 102.1M | 380,000 | 198,400 | 48% | ok |
| Auto Crédito del Cibao (AC, violet) | Dealer | Pro | 23.4M | 48,500 | 31,200 | 36% | **warn** |
| Motores Caribe (MC, blue) | Dealer | Start | 6.1M | 14,200 | 9,800 | 31% | ok |

---

## 4. PANTALLA 4 · Configuración de cobro

Header: título "Configuración de cobro · {tenant}" (Space Grotesk 17px) + bajada "Captura todo siempre, factura sobre un subconjunto. Cambiar el modelo no recopila datos nuevos — re-mide los ya capturados." A la derecha, segmented control **Modelos de banco / Planes de dealer**.

### 4.1 Pestaña "Modelos de banco" (grid 1.5fr / 1fr)

**Columna izquierda:**
- **MODELO BASE · elige uno** — grid 2×2 de cards seleccionables (radio). Seleccionada: fondo `rgba(43,208,115,.08)`, borde `--green`, `box-shadow:0 0 0 1px rgba(43,208,115,.3)`. Cada card: code (9.5px mono, color), flag opcional, nombre (Space Grotesk 13.5px), desc (11px).
  - **B1 · Comisión pura** (`--green`) — "bps sobre principal o flat por fundeado · con mínimo garantizado".
  - **B2 · Híbrido** (`--green`, flag **ANCLA** = badge verde texto `#06160f`) — "base mensual + comisión reducida por fundeado". **Resáltalo: es el modelo ancla.**
  - **B3 · Por volumen aprobado** (`--blue`) — "bandas de monto desembolsado · tarifa marginal decreciente".
  - **B4 · Ilimitado** (`--violet`) — "flat mensual · todo incluido · SLA dedicado".
- **COMPLEMENTOS · se apilan sobre el base** — 2 toggles (check 20px que se vuelve verde):
  - **Setup + mensualidad (B5)** — "fee inicial one-time, se apila".
  - **AI metered (add-on)** — "por decisión / documento / token". (on por defecto)
- **Tarifas · {modelo activo}** (card) — editor:
  - Si el base tiene comisión (B1/B2): **stepper de bps** — fila con label + control `− [NN bps] +` (mono 16px verde). Rango 5–150, paso 5. Default 50 para B1, 30 para B2.
  - Filas de tarifa según base/add-ons (label + nota + valor mono):
    - B2: "Base mensual" · suscripción híbrido · **RD$ 85,000**
    - B3: "Bandas de volumen" · ≤25M:40bps · 25–75M:28bps · >75M:18bps · "marginal"
    - B4: "Flat mensual" · todo incluido · SLA dedicado · **RD$ 380,000**
    - B1: "Mínimo mensual garantizado" · piso · **RD$ 150,000**
    - addAI: "AI metered" · decisión RD$2.50 · doc RD$6.00 · token passthrough · "variable"
    - addSeats: "Seat" · por analista activo/mes · **RD$ 1,500**
  - **Cores incluidos en la factura** — chips toggle: Marketing, Credit / Forge, Legal, SIC, Projects. Activos (default): Credit, Legal, SIC. On = fondo verde tenue, borde `rgba(43,208,115,.34)`, texto `--ink`.

**Columna derecha (stack):**
- **Simulador what-if** (card con leve gradiente verde, borde `rgba(43,208,115,.26)`): ícono trending + título. Bajada "Con este modelo, la factura de **mayo 2026** habría sido — sobre datos ya capturados:". Número gigante mono 30px verde (**total con ITBIS**) + "subtotal RD$ …". Lista de líneas que componen el subtotal (label + monto mono). Fila comparativa "vs. factura vigente (Híbrido)" con delta (verde si ≥0, rojo si <0). Botón verde "Aplicar modelo con vigencia" → toast "Modelo aplicado con vigencia 01 jun 2026 · histórico preservado".
- **Vigencia y versionado** (card): título + chip "desde 01 jun 2026". Nota "Cambiar una tarifa no reescribe el histórico: crea una versión nueva." Lista de versiones (punto + tarifa mono + rango + tag):
  - **30 bps** · vigente desde 01 may 2026 · **ACTUAL** (badge verde)
  - 35 bps · 01 ene – 30 abr 2026 · histórico
  - 40 bps · onboarding 12 sep – 31 dic 2025 · histórico
- **Contrato** (card horizontal): ícono doc azul + "Contrato CT-2026-0142" + "Responsable · M. Disla · firmado 28 mar 2026" + link "abrir →".

### 4.2 Fórmula del what-if (impleméntala EXACTA)
```
P = 78,500,000 (principal fundeado del periodo, dato capturado)
com = round(bps/10000 * P)
base:
  B1 → max(com, 150000)         líneas: "Comisión pura · {bps} bps" (+ "Ajuste a mínimo garantizado" si aplica)
  B2 → 85000 + com              líneas: "Base mensual (suscripción)" RD$85,000 + "Comisión reducida · {bps} bps"
  B3 → 210000                   línea: "Por volumen aprobado (bandas)"
  B4 → 380000                   línea: "Ilimitado · flat mensual"
+ addSetup → +25000  línea "Setup inicial (one-time)"
+ addAI    → +59400  línea "AI metered (add-on)"
+ addSeats → +12000  línea "Seats · 8 analistas"
subtotal = base + add-ons
itbis = round(subtotal * 0.18, 2)
total = subtotal + itbis
delta = total − 462442   (462,442 = factura vigente Híbrido con ITBIS)
```
Default (B2, 30 bps, addAI, addSeats): subtotal **391,900** → total **462,442** (coincide con la factura).

### 4.3 Pestaña "Planes de dealer" (display-only, grid 3 col)
Métrica de valor = solicitudes. 3 cards (la del medio destacada con gradiente verde):
- **Start** (pequeño) — **RD$ 4,900** /mes · o pay-as-you-go — 120 solicitudes incluidas · Overage RD$ 95/solicitud · 1 seat · Scoring básico.
- **Pro** (mediano, **ancla**) — **RD$ 18,000** /mes — 600 solicitudes incluidas · SIC + IA completa · Multi-seat (hasta 6) · Overage RD$ 48/solicitud.
- **Scale** (grande) — **RD$ 52,000** /mes · o bandas RD$ — Solicitudes ilimitadas · Todos los cores + API · Soporte dedicado · Bandas por volumen RD$.
Cada feature con check verde.

---

## 5. PANTALLA 7 · Estado de cuenta / factura

Centrada (max-width 840px), card `--panel`. El tenant es **Banco del Cibao**, modelo Híbrido (B2), mayo 2026.

- **Header:** cuadro inicial 42px en `--tenant` + nombre (Space Grotesk 16px) + "Estado de cuenta · mayo 2026 · modelo Híbrido (B2)". Derecha: "FACT-2026-05-0142" mono, "emitida 01 jun 2026 · RNC operador 1-31-00000-1", badge **DATOS FICTICIOS** ámbar.
- **Hint de auditoría** (fondo `--panel2`): ícono ojo `--tenant` + "Cada línea es auditable. Clic en cualquier renglón para descomponerlo en sus eventos de origen, con timestamp y hash."
- **Cabecera de columnas:** CONCEPTO · IMPORTE RD$ (der).
- **Líneas** (cada una es un botón que abre su drawer; hover `rgba(34,50,58,.28)`): label (13.5px) + chip "{N} eventos" (azul, ícono ›) + nota (11.5px `--sub`); importe mono 14px a la derecha:

| concepto | chip | nota | importe | drawer |
|---|---|---|---|---|
| Comisión sobre préstamos fundeados | 34 eventos | 30 bps · principal RD$ 78,500,000.00 | 235,500.00 | `comision` |
| Suscripción Híbrido · base mensual | 1 evento | plan híbrido · mayo 2026 | 85,000.00 | `base` |
| AI metered | 15,690 eventos | 12,480 decisiones · 3,210 documentos · 1.49M tokens | 59,400.00 | `ai` |
| Seats | 8 eventos | 8 analistas activos · RD$ 1,500 c/u | 12,000.00 | `seats` |

- **Línea info mínimo garantizado** (fondo verde tenue, check): "Mínimo mensual garantizado **RD$ 150,000.00** — cumplido por comisión + base, sin ajuste."
- **Línea info setup** (`--sub`): "Setup inicial (B5) RD$ 25,000.00 — facturado una vez en abr 2026, no se repite."
- **Totales:** Subtotal **RD$ 391,900.00** · ITBIS 18% **RD$ 70,542.00** · **Total a pagar RD$ 462,442.00** (mono 22px verde, sobre borde superior).
- **Acciones:** "Reconciliar contra eventos" (→ toast "Reconciliación: 4 líneas ↔ 49 eventos · 0 discrepancias") · "Exportar PDF" (→ toast "PDF en preparación · incluye anexo de eventos auditables").

---

## 6. FIRMA DEL MÓDULO · Drawer de trazabilidad (cifra → eventos de origen)

Hermano del contenido, 432px, fondo `--panel2`, borde izq `--line`, con scroll interno. Se abre al click en cualquier **KPI de negocio** (dashboard) o **línea de factura**. **Sin modal, sin salir de la pantalla.**

Estructura:
- **Header:** kicker "TRAZABILIDAD · EVENTOS DE ORIGEN" (ícono ojo, color `--tenant`) + título (Space Grotesk 15px) + sub. Botón cerrar ✕.
- **Agregado:** label + cifra grande mono 24px + badge "✓ verificado" verde.
- Label "{conteo}".
- **Lista de eventos** (cards `--panel`, hover borde azul): por cada evento —
  - fila 1: badge de tipo (color por tipo) + id mono + monto mono (der).
  - fila 2: detalle (`--ink-soft`, elipsado) + timestamp mono (der).
  - fila 3 (sobre borde): **hash** con ícono candado violeta (mono 10px) + link "registro completo ↗" (→ toast "Abriendo registro completo del evento · audit trail").
- Pie: texto foot (`--sub`).

### Tipos de evento (badge)
PRÉSTAMO (verde) · DECISIÓN IA (violet) · DOCUMENTO (blue) · TOKENS (amber) · SEAT (blue) · CONTRATO (violet). Badge: 9px, 700, color/fondo/borde a juego.

### Datasets de drilldown (todos)
**`gmv`** — "GMV · préstamos fundeados" · sub "Volumen financiado agregado · mayo 2026" · agg label "Volumen financiado" = **RD$ 78,500,000.00** · count "34 préstamos desembolsados" · foot "Mostrando 5 de 34 · ordenados por monto". Eventos (PRÉSTAMO):
- DEAL-7801 · Banco del Cibao · ganó subasta · RD$ 5,200,000.00 · 05 may 16:40 · 0x1c2f…a9
- DEAL-7829 · Banco Nacional RD · ganó subasta · RD$ 4,300,000.00 · 11 may 15:33 · 0xa15b…02
- DEAL-7782 · Banco del Cibao · ganó subasta · RD$ 3,450,000.00 · 02 may 14:22 · 0x9f3a…c1
- DEAL-7790 · Banco Atlántico · ganó subasta · RD$ 2,100,000.00 · 03 may 09:11 · 0x4b8e…7d
- DEAL-7815 · Banco del Cibao · ganó subasta · RD$ 1,850,000.00 · 08 may 11:05 · 0x77d0…3e

**`comision`** — "Comisión sobre préstamos fundeados" · "Banco del Cibao · 30 bps · mayo 2026" · "Total comisión" = **RD$ 235,500.00** · count "34 préstamos · 30 bps c/u" · foot "Mostrando 5 de 34 · +29 préstamos · RD$ 235,500.00". Eventos (PRÉSTAMO, detalle = "principal … · 30 bps", monto = comisión):
- DEAL-7801 · RD$ 15,600.00 · 05 may 16:40 · 0x1c2f…a9
- DEAL-7782 · RD$ 10,350.00 · 02 may 14:22 · 0x9f3a…c1
- DEAL-7790 · RD$ 6,300.00 · 03 may 09:11 · 0x4b8e…7d
- DEAL-7815 · RD$ 5,550.00 · 08 may 11:05 · 0x77d0…3e
- DEAL-7829 · RD$ 12,900.00 · 11 may 15:33 · 0xa15b…02

**`ai`** — "AI metered · consumo de IA" · "Banco del Cibao · passthrough + margen" · "Total AI metered" = **RD$ 59,400.00** · count "3 tipos de evento" · foot "Agregado por tipo · 15,690 eventos individuales trazables":
- SCORING (DECISIÓN IA) · 12,480 decisiones · RD$ 2.50 c/u · RD$ 31,200.00 · 0x3e91…4c
- SIC-OCR (DOCUMENTO) · 3,210 documentos · RD$ 6.00 c/u · RD$ 19,260.00 · 0x88a2…f0
- TOKENS (TOKENS) · 1.49M tokens · passthrough + margen · RD$ 8,940.00 · 0x0d77…b3

**`base`** — "Suscripción Híbrido · base mensual" · contrato CT-2026-0142 · agg = **RD$ 85,000.00** · 1 cargo recurrente · foot "Vigente desde 01 abr 2026 · versión v3":
- CT-2026-0142 (CONTRATO) · Plan Híbrido · base mensual mayo · RD$ 85,000.00 · 01 may 00:00 · 0xc4f1…9e

**`seats`** — "Seats · analistas activos" · RD$ 1,500/seat · agg = **RD$ 12,000.00** · 8 analistas activos · foot "Seat = analista con ≥1 sesión en el periodo":
- usr_ana.disla · última sesión 31 may 18:02 · RD$ 1,500.00 · 0xab10…22
- usr_l.fermin · 30 may 09:40 · RD$ 1,500.00 · 0xab10…23
- usr_j.peralta · 29 may 14:18 · RD$ 1,500.00 · 0xab10…24
- usr_m.santos · 28 may 11:55 · RD$ 1,500.00 · 0xab10…25

**`takerate`** — "Take rate · ingreso / GMV" · agg = **2.8%** · count "ingreso RD$ 1,569,200 sobre GMV RD$ 56.0M facturable" · foot "GMV facturable = volumen de tenants con comisión activa":
- Comisión (PRÉSTAMO) · success fee sobre fundeados · RD$ 642,500.00 · 41%
- Suscripción (CONTRATO) · bases mensuales + ilimitado · RD$ 470,000.00 · 30%
- AI metered (DECISIÓN IA) · decisiones + documentos + tokens · RD$ 286,400.00 · 18%

**`mrr`** — "MRR · ingreso recurrente" · agg = **RD$ 1,840,000.00** · foot "Excluye success fee y AI variable":
- Banco del Cibao (CONTRATO) · Híbrido · base + seats · RD$ 97,000.00
- Banco Nacional RD (CONTRATO) · Ilimitado · flat · RD$ 380,000.00
- Auto Crédito del Cibao (CONTRATO) · Dealer Pro · mensual · RD$ 18,000.00

**`margen`** — "Margen bruto · ingreso − costo de servir" · agg = **61%** · foot "Costo de servir = LLM por core + infra prorrateada":
- Credit / Forge (DECISIÓN IA) · ingreso 980K · costo 392K · 60%
- SIC (DOCUMENTO) · ingreso 286K · costo 120K · 58%
- Legal (CONTRATO) · ingreso 168K · costo 41K · 76%

---

## 6BIS · 2ª TANDA — pantallas 2, 3, 5, 6, 8 (mismo shell, tokens y drawer)

Todas heredan el marco (banner DEMO, nav, top bar, tenant switcher) y reusan el **drawer de trazabilidad** (§6). Padding de contenido `20px 22px 32px`. Mismas reglas mono-tabular.

---

### PANTALLA 2 · Ingresos (revenue analytics)
Bajada: "Ingreso operado por la plataforma · mayo 2026 · clic en una cifra para ver su origen".

**a) 4 KPIs (grid 4 col):**
- **Ingreso total** RD$ 1.57M · +9.2% vs. abr (clic → drawer `takerate`).
- **GMV financiado** RD$ 264.3M · +12.4% (clic → drawer `gmv`).
- **Take rate efectivo** 2.8% (verde) · "ingreso / GMV facturable" (clic → drawer `takerate`).
- **Ticket medio / tenant** RD$ 78.4K · "20 tenants activos" (no clicable).

**b) Dos columnas (1fr / 1fr):**
- **Ingreso por modelo de cobro** — mismas 5 barras del dashboard (Comisión 642,500·41% verde · Suscripción 470,000·30% azul · AI metered 286,400·18% violeta · Seats 92,000·6% ámbar · Overage 78,300·5% gris).
- **GMV vs. take rate · 6 meses** — gráfico de barras: barra azul (GMV, gradiente `180deg,--blue,rgba(84,168,236,.3)`) con línea verde superpuesta (take rate). Leyenda arriba (GMV azul / take rate verde). 6 meses con alturas: dic 48%/40% · ene 56%/46% · feb 52%/52% · mar 68%/58% · abr 82%/62% · may 94%/70% (gmvH / takeH). Eje X mono `--sub`.

**c) Tabla "Ingreso por tenant"** (grid `1.6fr 1fr 1fr 1fr 1.1fr`): TENANT · GMV(der) · INGRESO(der) · % DEL TOTAL(der) · MODELO(der). Cada fila clicable → drawer. Filas:
| tenant | gmv | ingreso | % | modelo | → drawer |
|---|---|---|---|---|---|
| Banco Nacional RD (BN, ámbar) | 102.1M | 380,000 | 24.2% | Ilimitado | `mrr` |
| Banco del Cibao (BC, verde) | 78.5M | 391,900 | 25.0% | Híbrido | `comision` |
| Banco Atlántico (BA, azul) | 54.2M | 271,000 | 17.3% | Comisión pura | `comision` |
| Auto Crédito del Cibao (AC, violeta) | 23.4M | 48,500 | 3.1% | Dealer Pro | `mrr` |
| Motores Caribe (MC, azul) | 6.1M | 14,200 | 0.9% | Dealer Start | `mrr` |

---

### PANTALLA 3 · Costo & margen
Bajada: "Costo de servir y margen bruto · costo LLM por core + infra · mayo 2026".

**a) 4 KPIs:** **Margen bruto agregado** 61% (verde) · −2pp (clic → drawer `margen`) · **Costo de servir** RD$ 612K · +14% (ámbar) · **Costo LLM** RD$ 421K (violeta) · "69% del costo de servir" · **Tenants margen < umbral** 2 (rojo) · "umbral 15%".

**b) Dos columnas (1fr / 1.1fr):**
- **Costo LLM por core** — total RD$ 421,000. 5 barras: Credit/Forge 198,000·47% verde · SIC 104,000·25% azul · Legal 58,000·14% violeta · Marketing 38,000·9% ámbar · Projects 23,000·5% gris.
- **Margen por tenant · semáforo** — tabla (grid `1.6fr 1fr 1fr .8fr`): TENANT (punto de color) · INGRESO(der) · COSTO(der) · MARGEN(der, badge semáforo). Reusa las 5 filas de tenants del dashboard (61% verde · 9% rojo · 48% verde · 36% ámbar · 31% verde).

**c) Callout guardarraíl** (rojo, fondo `rgba(240,97,80,.07)`, ícono triángulo): "Banco Atlántico opera al 9% de margen — bajo el umbral del 15%" + sub "El costo LLM del core Credit creció +38%. Revisa el modelo de cobro o el passthrough de IA." + botón **"Ajustar cobro →"** que navega a Configuración (pantalla 4).

---

### PANTALLA 5 · Métricas del banco (white-label)
**Header white-label** (gradiente `110deg,rgba(43,208,115,.08),--panel`): avatar BC verde + "Banco del Cibao · panel del banco" + "Vista white-label · solo datos de este banco · mayo 2026". Chip derecha "🔒 aislado por actor" (ícono candado verde).

**a) Funnel de subasta** (card, 4 cajas en fila sobre `--panel2`): label + número mono + conversión:
- Solicitudes recibidas **1,842** · 100% (`--ink`)
- Ofertas emitidas **1,401** · 76% emisión (`--blue`)
- Ofertas ganadas **212** · 15% win rate (`--violet`)
- Préstamos fundeados **34** · 16% cierre (`--green`)

**b) Tres columnas (1fr/1fr/1fr):**
- **SLA · tiempo a respuesta**: p50 3.1s · p95 8.7s · dentro de SLA 96.2% (verde) + barra 96% · tasa de rechazo 12% (ámbar).
- **Consumo de IA** (card clicable → drawer `ai`): Decisiones scoring 12,480 · Documentos SIC/OCR 3,210 · Tokens in/out 1.49M · (sobre borde) Costo IA RD$ 59,400 (violeta). Chip "ver origen ↗".
- **Factura del periodo**: RD$ 462,442 (mono 26px) · "total con ITBIS · modelo Híbrido" · (sobre borde) proyectada cierre mes RD$ 511,800 (verde) · botón "Ver estado de cuenta →" (navega a pantalla 7).

---

### PANTALLA 6 · Métricas del dealer (white-label)
**Header white-label** (gradiente violeta `110deg,rgba(169,139,240,.08),--panel`): avatar AC violeta + "Auto Crédito del Cibao · panel del dealer" + "Vista white-label · solo datos de este dealer · plan Pro · mayo 2026" + chip "🔒 aislado por actor".

**a) Dos columnas (2fr / 1fr):**
- **Funnel · originadas → desembolsadas** (4 cajas): Solicitudes originadas **552** · 100% · Enviadas a bancos **538** · 97% ruteo (azul) · Ofertas recibidas **441** · 82% respuesta (violeta) · Deals desembolsados **212** · 38% L2B (verde).
- **Look-to-book** (card destacada gradiente verde, centrada): **38%** (mono 38px verde) · "solicitudes → deals cerrados" · "+5pp vs. abr".

**b) Dos columnas (1.3fr / 1fr):**
- **Mix de bancos ganadores** (barras con avatar): Banco del Cibao (BC verde) 92·43% · Banco Nacional RD (BN ámbar) 66·31% · Banco Atlántico (BA azul) 38·18% · Otros (3) (+3 gris) 16·8%.
- **KPIs 2×2 + fees**: Volumen financiado RD$ 23.4M · APR promedio obtenido 16.2% (verde) · Tiempo a 1ª oferta 3.8s · Seats activos 4. Debajo, card **Fees del dealer · plan Pro**: chip "92% del límite" (violeta) + RD$ 18,000 + "base mensual · 552/600 solicitudes usadas · overage RD$ 48 c/u".

---

### PANTALLA 8 · Reconciliación & audit trail
Bajada: "Cada evento facturable, trazable contra su origen. Banco del Cibao · mayo 2026." Derecha: chip "✓ 0 discrepancias" (verde) + botón "Exportar libro".

**a) 4 KPIs de cuadre:** Líneas de factura **4** · Eventos vinculados **15,732** · Suma reconciliada **RD$ 391,900** (verde) · Discrepancia **RD$ 0.00** (verde).

**b) Tabla "Factura ↔ eventos de origen"** (grid `1.8fr .8fr 1fr 1fr .6fr`): LÍNEA · EVENTOS(der) · FACTURADO(der) · Σ EVENTOS(der) · OK(centro, check verde). Cada fila clicable → su drawer:
| línea | eventos | facturado | Σ eventos | drawer |
|---|---|---|---|---|
| Comisión sobre préstamos fundeados | 34 | 235,500.00 | 235,500.00 | `comision` |
| Suscripción Híbrido · base mensual | 1 | 85,000.00 | 85,000.00 | `base` |
| AI metered | 15,690 | 59,400.00 | 59,400.00 | `ai` |
| Seats | 8 | 12,000.00 | 12,000.00 | `seats` |

**c) Libro de eventos · audit trail** (cada evento sellado con hash; grid `auto 1fr auto auto`): badge tipo · id mono + detalle · hash (candado violeta) · monto(der). Filas de muestra:
- PRÉSTAMO · DEAL-7801 · fundeado 05 may 16:40 · 0x1c2f…a9 · RD$ 15,600.00
- DECISIÓN IA · SCO-44128 · scoring SOL-9920 · 0x3e91…4c · RD$ 2.50
- DOCUMENTO · DOC-22107 · OCR cédula SOL-9917 · 0x88a2…f0 · RD$ 6.00
- PRÉSTAMO · DEAL-7790 · fundeado 03 may 09:11 · 0x4b8e…7d · RD$ 6,300.00
- CONTRATO · CT-2026-0142 · base mensual mayo · 0xc4f1…9e · RD$ 85,000.00
- SEAT · usr_ana.disla · seat activo 31 may · 0xab10…22 · RD$ 1,500.00

---

## 7. Contrato de datos (lo que el backend entrega — ajustar a la API real)
```ts
interface Tenant { id; name; kind:"banco"|"dealer"; model; color; initial; }   // white-label
interface DashboardKPIs {
  gmv; take_rate; mrr; margen_bruto;                  // negocio (clicables → drilldown)
  subastas_activas; bancos_en_linea; aprobacion; tiempo_primera_oferta; // operativos
  revenue_by_model: {label; amount; pct; color}[];
  tape: {time; type; text; amount}[];                 // cinta en vivo
  tenants: {name; kind; model; gmv; revenue; cost; margin_pct; status}[];
  alerts: {kind; text; severity:"bad"|"warn"}[];      // guardarraíl
}
interface BillingConfig {                              // pantalla 4
  base_model:"B1"|"B2"|"B3"|"B4"; bps; add_setup; add_ai; add_seats;
  cores: Record<string,boolean>;                      // Marketing/Credit/Legal/SIC/Projects
  versions: {tariff; range; current}[];               // versionado por fecha de vigencia
  contract: {id; owner; signed_at};
}
interface Invoice {                                    // pantalla 7
  number; tenant_id; period; model; issued_at; rnc;
  lines: {label; count; note; amount; drilldown_key}[];
  min_guarantee; setup_note; subtotal; itbis; total;  // itbis = subtotal*0.18
}
interface Drilldown {                                  // firma
  title; sub; agg_label; agg; count; foot;
  events: {type; id; detail; amount; time; hash; record_url}[];
}
interface RevenueAnalytics {                            // pantalla 2
  total; gmv; take_rate; ticket_medio;
  by_model: {label; amount; pct; color}[];
  gmv_vs_take: {month; gmv_h; take_h}[];               // 6 meses
  by_tenant: {name; gmv; revenue; pct; model; drilldown_key}[];
}
interface CostMargin {                                  // pantalla 3
  margen_bruto; costo_servir; costo_llm; tenants_bajo_umbral; umbral;
  llm_by_core: {label; amount; pct; color}[];
  margin_by_tenant: {name; revenue; cost; margin_pct; status}[];
  guardrail: {tenant; margin; reason};                 // callout → config
}
interface ActorMetrics {                                // pantallas 5 (banco) y 6 (dealer)
  tenant; funnel: {label; value; conv}[];              // aislado por actor
  sla?: {p50; p95; within_pct; reject_pct};            // banco
  ai_usage?: {decisions; documents; tokens; cost};     // banco → drilldown ai
  invoice_current?; invoice_projected?;                // banco
  look_to_book?; bank_mix?: {name; deals; pct}[];      // dealer
  kpis?; dealer_fees?;                                 // dealer
}
interface Reconciliation {                              // pantalla 8
  lines_count; events_count; reconciled_sum; discrepancy;
  matches: {label; events; billed; sum; drilldown_key; ok}[];
  ledger: {type; id; detail; hash; amount}[];          // audit trail sellado
}
```
- **Principio:** las métricas se capturan SIEMPRE (todos los `events`); la factura y el what-if solo re-agregan el subconjunto del modelo activo. El versionado de tarifas se hace por `effective_date`, sin reescribir histórico.
- **Auditabilidad:** cada `event` lleva `hash` + `record_url` al registro completo. Toda línea de factura y todo KPI de negocio mapea a un `drilldown_key`.

---

## 8. Estados vacío / error / carga (voz del producto — español, directo, sin disculpas vagas)
- **Vacío (sin datos del periodo):** "Sin eventos facturables en mayo 2026. Cuando se fundee el primer préstamo, aparecerá aquí." + CTA "Ver periodo anterior".
- **Error de carga:** "No se pudieron leer los eventos de origen. Reintentar." (botón reintentar; nunca "algo salió mal").
- **Carga:** skeletons en las cards (barras `--panel2`), nunca spinner a pantalla completa. Cifras placeholder en mono atenuado.
- **What-if sin base seleccionado:** "Elige un modelo base para simular la factura del periodo."

---

## 9. Reutilizable como componentes (para cualquier institución)
- `KpiCard` (label, value, delta, sub, onDrill) · `AlertChip` (kind, text, severity).
- `RevenueBar` (label, amount, pct, color) · `EventTapeRow` (time, type, text, amount).
- `TenantRow` (con `MarginBadge` semáforo) · `ModelCard` (code, name, desc, selected, flag).
- `AddonToggle` · `BpsStepper` · `CoreChip` · `WhatIfPanel` (recibe config → calcula) · `VersionRow`.
- `InvoiceLine` (label, count, note, amount, onDrill) · `InvoiceTotals`.
- **`TraceDrawer`** (recibe `Drilldown` → render genérico de tabla de eventos) — el componente estrella, único para todas las cifras.
- `TenantSwitcher` (white-label) · `DemoBanner`.

---

## 10. Checklist "construido igual"
- [ ] Tokens trading-desk exactos; Space Grotesk / JetBrains Mono (tabular) / Inter; CTA verde texto `#06160f`.
- [ ] Banner DEMO persistente; tenant switcher white-label; nav con las 8 pantallas activas.
- [ ] Dashboard: alertas (guardarraíl) → 4 KPIs negocio clicables → 4 operativos → ingreso por modelo + cinta → tabla de tenants con semáforo de margen.
- [ ] Config: B1–B4 (B2 ancla) + B5/AI add-ons + stepper bps + tarifas + cores; what-if recalcula en vivo con la fórmula §4.2; versionado por vigencia.
- [ ] Factura: 4 líneas + mínimo garantizado + setup; subtotal 391,900 · ITBIS 70,542 · total 462,442.
- [ ] Drawer de trazabilidad abre desde KPI y desde línea; muestra agg + eventos con tipo, monto, timestamp, **hash** y "registro completo"; sin modal.
- [ ] **2ª tanda:** Ingresos (KPIs clicables + GMV vs take rate + tabla por tenant) · Costo & margen (LLM por core + semáforo + guardarraíl → config) · Métricas banco (funnel + SLA + IA → drawer + factura) · Métricas dealer (funnel + look-to-book + mix + fees) · Reconciliación (cuadre 0 discrepancias + tabla factura↔eventos → drawer + libro con hash).
- [ ] Vistas de banco/dealer son **white-label** y **aisladas por actor** (solo datos del propio tenant).
- [ ] Sin animaciones de entrada que dejen wrappers en opacity:0.
- [ ] Datos ficticios etiquetados; RD$ + ITBIS 18%; multi-tenant; aislamiento por actor.
