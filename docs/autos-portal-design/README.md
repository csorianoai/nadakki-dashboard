# Handoff: Nadakki Auto — Marketplace P0 (Landing · Búsqueda AI · VDP · Concierge)

> Runbook de implementación. Un desarrollador que **no** estuvo en la conversación debe poder construir todo esto solo con este documento + el archivo de referencia `Nadakki Auto.dc.html`.

---

## 1. Overview

Nadakki Auto es un marketplace de vehículos **B2B2C, multi-tenant y white-label** para bancos dominicanos (Credicefi, Banco Piloto RD, expansión LATAM). Este paquete cubre las **4 pantallas P0** más las secciones de marketing añadidas:

- **Pantalla 1 — Landing pública** (hero de búsqueda AI, contador, tipos de vehículo, value props, destacados, bancos aliados, comparador de aprobaciones, trust, testimonios, búsquedas populares, footer).
- **Pantalla 2 — Búsqueda con AI** (filtros multi-select + "Buscar por cuota" en tiempo real + vistas Grid/Lista/Mapa).
- **Pantalla 3 — AI Sales Concierge** (panel lateral de chat con recomendaciones inline).
- **Pantalla 4 — Vehicle Detail Page (VDP)** (galería, match score, calculadora de cuota sticky, tabs, similares, trust).

Sistemas transversales: **light/dark mode**, **tenant switcher white-label**, **toggle Desktop/Móvil**, toasts, wishlist, búsqueda por voz (overlay).

---

## 2. Sobre los archivos de diseño

`Nadakki Auto.dc.html` es una **referencia de diseño creada en HTML** — un prototipo funcional que muestra el look y el comportamiento previstos. **No es código de producción para copiar tal cual.**

La tarea es **recrear este diseño en el entorno destino** — el brief pide **Next.js 16 + Tailwind CSS + shadcn/ui + Lucide Icons** — siguiendo los patrones establecidos de ese stack. El HTML usa estilos inline y una micro-runtime propia solo por ser un prototipo; en producción se traduce a componentes React con Tailwind y tokens de tema.

## 3. Fidelidad

**Alta (hi-fi).** Colores, tipografía, spacing, radios, sombras e interacciones son finales. Recrear la UI de forma fiel usando los componentes de shadcn/ui y los design tokens de la sección 5.

---

## 4. Arquitectura & Rutas sugeridas (Next.js App Router)

El prototipo enruta por estado (`screen`); en Next.js son rutas reales. Cada sección lleva un `id` semántico ya presente en el HTML:

| Prototipo (`id` / estado) | Ruta Next.js | Descripción |
|---|---|---|
| `#hero` / `screen:'landing'` | `/` | Landing pública |
| `#tipos` | `/` (ancla) | Explora por tipo → linkea a `/vehiculos?tipo=` |
| `#catalogo` / `screen:'search'` | `/vehiculos` | Resultados de búsqueda (querystring = filtros) |
| `#vdp` / `screen:'vdp'` | `/vehiculo/[id]` | Vehicle Detail Page |
| Panel chat (`chatOpen`) | Overlay global (Sheet) | Concierge AI, disponible en toda ruta |
| `#bancos` | `/` (sección) | Aliados bancarios |
| `#comparador` | `/` (sección) | Comparador de aprobaciones |
| `#populares` | `/` (sección) | Búsquedas populares (SEO → links a `/vehiculos?...`) |

**Data attributes ya emitidos** para hidratación/analytics: `data-vehicle-id`, `data-price-status`, `data-tenant`, `data-theme`, `data-tenant-logo`.

Estructura de componentes recomendada:
```
app/
  layout.tsx                 // ThemeProvider + TenantProvider + <ConciergeSheet/>
  page.tsx                   // Landing (compone las secciones)
  vehiculos/page.tsx         // Búsqueda (Server Component + filtros en URL)
  vehiculo/[id]/page.tsx     // VDP
components/
  nav/TopNav.tsx
  marketing/Hero.tsx, ResultCounter.tsx, BodyTypeGrid.tsx, PathCards.tsx,
            ValueProps.tsx, BankPartners.tsx, ApprovalComparator.tsx,
            TrustBar.tsx, Testimonials.tsx, PopularSearches.tsx, SiteFooter.tsx
  vehicle/VehicleCard.tsx, VehicleCardSkeleton.tsx, QualityBadge.tsx, SaveButton.tsx
  search/FilterPanel.tsx, PaymentSearch.tsx, FacetGroup.tsx, ViewToggle.tsx,
         ResultsGrid.tsx, ResultsList.tsx, ResultsMap.tsx, EmptyState.tsx
  vdp/Gallery.tsx, MatchScore.tsx, PaymentCalculator.tsx, SpecTabs.tsx, SimilarVehicles.tsx
  concierge/ConciergeSheet.tsx, ChatMessage.tsx, InlineVehicleRec.tsx
  voice/VoiceOverlay.tsx
  system/ThemeToggle.tsx, TenantSwitcher.tsx, DeviceToggle.tsx, Toast.tsx
lib/
  finance.ts                 // cálculo de cuota
  format.ts                  // RD$ / US$
  vehicles.ts                // data + tipos
  tenants.ts                 // config white-label
```

---

## 5. Design Tokens (valores EXACTOS)

Definidos como CSS custom properties, conmutados por `[data-theme]` y `[data-tenant]`. En Tailwind: mapear a `theme.extend.colors` vía `hsl(var(--...))` o exponer las custom properties en `globals.css` y usar `bg-[var(--surface)]`.

### 5.1 Colores — LIGHT (`:root`)
```
--brand:        #1E40AF   (azul profundo — primario)
--brand-2:      #3B82F6   (azul claro — acento/gradientes)
--brand-strong: #1E3A8A
--brand-soft:   #EEF3FF   (fondo tinte brand)
--on-brand:     #FFFFFF

--bg:           #F5F8FC   (fondo app)
--surface:      #FFFFFF   (cards)
--surface-2:    #F1F5F9
--surface-3:    #E9EEF6
--border:       #E4EAF2
--border-2:     #D2DBE8

--fg:           #0D1626   (texto principal)
--fg-muted:     #586A82
--fg-subtle:    #8A99AD

--success:      #0F9F6E   --success-2: #10B981   --success-soft: #E5F6EF
--warning:      #D97706   --warning-2: #F59E0B   --warning-soft: #FCF2E1
--danger:       #DC2626   --danger-soft: #FDECEC
```

### 5.2 Colores — DARK (`[data-theme="dark"]`)
```
--brand-soft:   rgba(59,130,246,.14)
--bg:           #070C16
--surface:      #0F1725
--surface-2:    #161F30
--surface-3:    #1E2839
--border:       #1F293A
--border-2:     #2A374C
--fg:           #EAF0F8
--fg-muted:     #93A3B9
--fg-subtle:    #63748C
--success-soft: rgba(16,185,129,.15)
--warning-soft: rgba(245,158,11,.15)
--danger-soft:  rgba(220,38,38,.18)
```
(`--brand`, `--brand-2`, `--fg` etc. se heredan salvo override.)

### 5.3 Tenants white-label (override de `--brand*`)
```
[data-tenant="nadakki"]  (default):  --brand:#1E40AF  --brand-2:#3B82F6  --brand-soft:#EEF3FF   nombre:"Nadakki Auto"      sub:"Marketplace inteligente"
[data-tenant="credicefi"]:            --brand:#0E7C66  --brand-2:#13B98A  --brand-strong:#0B5F4E  --brand-soft:#E3F6EF   nombre:"Credicefi Autos"   sub:"Powered by Nadakki"
[data-tenant="piloto"]:               --brand:#6D28D9  --brand-2:#8B5CF6  --brand-strong:#5B21B6  --brand-soft:#F0EBFE   nombre:"Banco Piloto"      sub:"Powered by Nadakki"
```
Dark + tenant también ajusta `--brand-soft` (Credicefi `rgba(19,185,138,.14)`, Piloto `rgba(139,92,246,.18)`).
El logo/nombre y el texto "Powered by" del sub-hero se derivan del tenant activo.

### 5.4 Tipografía
- **Display/Headings:** `Manrope` — pesos 500/600/700/800. `letter-spacing:-.02em` (títulos), `-.03em` (H1). H1 usa `800`.
- **Body/UI/Números:** `Inter` — 400/450/500/600/700.
- **Números:** `font-variant-numeric: tabular-nums` global (precios/cuotas alineados).
- Escala usada (px): H1 `clamp(34,5.4vw,60)` · H2 `clamp(22,3vw,30)` · H3 card `15.5` · precio card `18` · precio VDP `26` · cuota grande VDP `34` · contador hero `clamp(30,4vw,42)` · body `14–15.5` · meta `11.5–13` · micro/badges `10.5–12`.
- Google Fonts: `Manrope:500,600,700,800` + `Inter:400,450,500,600,700`.

### 5.5 Spacing, radios, sombras
```
--r:    16px   (cards, inputs grandes)
--r-sm: 11px   (botones, chips-cuadrados)
--r-lg: 22px
radios sueltos usados: 999px (chips/pills), 12px (mini-cards), 8–10px (badges)

--shadow-sm: 0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)
--shadow-md: 0 6px 16px -4px rgba(15,23,42,.10), 0 2px 6px -2px rgba(15,23,42,.06)
--shadow-lg: 0 24px 56px -18px rgba(15,23,42,.26), 0 8px 20px -12px rgba(15,23,42,.14)
--ring:      0 0 0 3px rgba(59,130,246,.35)   (focus)

Padding contenedor: max-width 1440px, padding lateral 22px. Gaps de grid: 12–22px.
```

### 5.6 Animaciones (keyframes)
```
nkShimmer  — skeleton loading (background-position -460px → 460px)
nkUp       — entrada de pantalla/panel: opacity 0→1, translateY 14px→0, .28–.4s ease
nkPop      — corazón guardar: scale 1→1.32→1, .4s
nkWave     — barras de voz: scaleY .35→1
nkPulse    — botón concierge + mic voz: box-shadow ring expansivo, 2–3s infinite
nkDot      — typing indicator (3 puntos), 1s infinite, delays .15s/.3s
nkToast    — toast: opacity 0→1 + translateY 12px→0, .25s
```
Transiciones estándar: cards hover `transform .2s ease, box-shadow .2s ease`; chips/botones `.15s`; tema/tenant instantáneo (custom props); frame device `max-width .35s ease`.

---

## 6. Lógica de negocio (portar a `lib/`)

### 6.1 Finanzas — `finance.ts`
```
RATE = 0.135        // 13.5% APR anual RD
DOP  = 58.5         // tasa RD$→US$ (US$ = round(RD$ / 58.5))

cuota(price, downPct, term):
  const principal = price * (1 - downPct/100)
  const r = RATE / 12
  return principal * r / (1 - (1 + r) ** -term)
```
Default de cards: `downPct=20`, `term=60`. Calculadora VDP: `downPct` 0–60 (step 5), `term` ∈ {48,60,72,84}.

### 6.2 Formato — `format.ts`
```
fmtRD(n) = "RD$ " + Math.round(n).toLocaleString('en-US')   // RD$ 1,180,000
fmtUS(n) = "US$ " + Math.round(n/58.5).toLocaleString('en-US')
```
RD$ es la moneda principal; US$ secundario en gris más pequeño.

### 6.3 Estado de precio (badge de calidad) — regla derivada
```
status = badge.includes('Excelente') ? 'excelente'
       : match < 80                  ? 'sobre'
       :                               'justo'
```
| status | label | fondo | texto | icono estrella |
|---|---|---|---|---|
| `excelente` | "Excelente oportunidad" | `#0F9F6E` | `#fff` | `#0F9F6E`/blanco |
| `justo` | "Precio justo" | `rgba(255,255,255,.94)` | `#0D1626` | `#0F9F6E` |
| `sobre` | "Sobre el mercado" | `#F59E0B` (--warning-2) | `#fff` | `#fff` |

### 6.4 Elegibilidad "Buscar por cuota"
```
down = clamp(5, initial/price*100, 90)
elegible = cuota(price, down, 60) <= maxMonthly  &&  initial <= price*0.9
```
Cards elegibles: badge verde "Compatible con tu presupuesto" (bottom-left sobre la foto) + borde `--success-2`.

### 6.5 Match score
Valor fijo por vehículo (`match`, 0–100). En producción: score real perfil↔vehículo (aprobación bancaria + preferencias).

---

## 7. Datos semilla — `vehicles.ts`

10 vehículos (mercado RD). Cada uno: `{ id, make, model, year, price, loc, type, km, trans, fuel, badge, match, grad, verified, rating, reviews }`.

| id | make | model | año | precio RD$ | provincia | tipo | km | match | verificado |
|--|--|--|--|--|--|--|--|--|--|
|1|Toyota|Corolla|2022|1,180,000|Distrito Nacional|Sedán|38,400|94|sí|
|2|Honda|CR-V|2021|1,650,000|Santiago|SUV|52,100|88|sí|
|3|Hyundai|Tucson|2023|1,890,000|La Vega|SUV|19,800|82|sí|
|4|Kia|Sportage|2022|1,450,000|Santo Domingo Este|SUV|41,300|91|sí|
|5|Suzuki|Grand Vitara|2019|780,000|San Pedro de Macorís|SUV|78,600|76|no|
|6|Ford|Escape|2020|1,050,000|Puerto Plata|SUV|61,200|79|sí|
|7|Mitsubishi|Outlander|2023|1,580,000|Santiago|SUV|22,400|85|sí|
|8|Chevrolet|Blazer|2021|1,750,000|Distrito Nacional|SUV|44,900|80|sí|
|9|Mercedes-Benz|GLC 300|2022|2,890,000|Santo Domingo|SUV Premium|28,700|87|sí|
|10|BMW|X3|2021|2,450,000|Santo Domingo|SUV Premium|35,200|83|sí|

Todos `trans: Automática`, `fuel: Gasolina` en la semilla (los filtros soportan Diésel/Híbrido).
`grad`: gradiente placeholder por vehículo (sustituir por foto real 4:3). En producción usar `next/image` con ratio 4:3.
Provincias activas: Distrito Nacional, Santo Domingo, Santo Domingo Este, Santiago, La Vega, San Pedro de Macorís, Puerto Plata.

---

## 8. Especificación por pantalla

### 8.1 TopNav (global, sticky)
- `position:sticky; top:0; z-index:40`, fondo `color-mix(in srgb, var(--surface) 88%, transparent)` + `backdrop-filter:blur(14px)`, borde inferior `--border`. Contenido `max-width:1440px`, padding `12px 22px`, `flex` con `flex-wrap`.
- **Izquierda:** logo (cuadrado 38px, `border-radius:11px`, gradiente `135deg brand→brand-2`, icono carro SVG) + nombre tenant (Manrope 800, 17px) y sub-línea "Powered by…" (10px, `--fg-subtle`).
- **Nav links:** Inicio · Buscar · Vender · Dealers. Activo = fondo `--surface-2`, peso 700, `--fg`; inactivo = `--fg-muted`.
- **Derecha (cluster con `flex-wrap:wrap; justify-content:flex-end`):**
  - **Tenant switcher**: `<select>` con icono banco (en shadcn → `Select`). Opciones: Nadakki Auto / Credicefi Autos / Banco Piloto.
  - **Device toggle** (segmented 2 botones): Escritorio / Móvil.
  - **Theme toggle** (botón 38×38, icono sol/luna).
  - **"Match My Approval"** pill (fondo `--brand-soft`, texto `--brand`, icono estrella). **En móvil el label se oculta** (solo icono) — regla `showApprovalLabel = device!=='mobile'`.
  - **Avatar** "JR" (círculo 38px, gradiente slate).
- Touch targets ≥ 38–44px.

### 8.2 Pantalla 1 — Landing
Orden de secciones (top→bottom):
1. **Hero** (`#hero`): badge de estado ("Aprobación bancaria integrada · [sub-tenant]"), H1 "El vehículo perfecto para ti, **financiado en tu banco**" (la 2ª parte con gradiente `120deg brand→brand-2` en el texto), párrafo de apoyo. Fondo `radial-gradient(120% 120% at 85% -10%, var(--brand-soft), transparent 55%)`.
   - **Search bar** (max-width 720px): input grande (búsqueda natural) + botón mic (voz) + botón "Buscar con AI" (gradiente brand, icono estrella). `box-shadow:--shadow-lg`, radio 16px.
     - **Placeholder rotativo** cada 3s entre: `jeepeta hasta 1.5M`, `Honda CR-V bajo 1.5M`, `algo pa Uber`, `carrito automático pa mi mamá`, `yipeta pa la playa`, `tengo 300 mil de inicial`. Formato: `Ej: "<frase>"…`.
     - **Chips** debajo (hover → fondo brand, texto blanco).
   - **Contador** (`ResultCounter`): número `clamp(30,4vw,42)` Manrope 800 con **count-up 0→1,247** (paso ~37, intervalo 26ms) + "vehículos disponibles" + sub "en 32 dealers verificados de RD".
2. **Explora por tipo** (`#tipos`): grid `auto-fill minmax(110px,1fr)`, 8 botones con **silueta outline** (SVG stroke 1.7) + label: Yipeta, Sedán, Guagua, Camioneta, Deportivo, Compacto, Convertible, Lujo. Click → `/vehiculos?tipo=` (SUV/Sedán/Premium según mapping). Hover: borde brand, `translateY(-3px)`, sombra.
3. **3 columnas de ruta** (`PathCards`): "Compra con financiamiento" / "Vende tu vehículo" / "Aplicar como Dealer" — card con icono en cuadro `--brand-soft`, título Manrope 700 17px, desc, CTA con flecha. Hover: `translateY(-4px)` + `--shadow-lg`.
4. **Value props**: 3 items icono+texto — "Aprobación bancaria en 24h" (verde), "AI Concierge 24/7" (brand), "Precio Justo verificado" (warning).
5. **Vehículos destacados**: header + botón "Ver todo el inventario" + grid `auto-fill minmax(255px,1fr)` de **8 VehicleCard** (ver 8.6).
6. **Aliados bancarios** (`#bancos`): fondo `--brand-soft`, H2 "Aliados bancarios verificados", sub "Aplica una vez, recibe ofertas de todos". Grid `auto-fit minmax(210px,1fr)` de 4 cards (Credicefi, Banco Piloto RD, 2× "Próximamente"). Cards a `opacity:.72` → hover `1` + `translateY(-3px)`. Badge "Aprobación en 24h" verde con escudo.
7. **Comparador de aprobaciones** (`#comparador`): pill "Exclusivo de Nadakki", H2 "Un solo formulario, múltiples ofertas". **Diagrama de flujo**: "1 aplicación" → (logos C/P/R) → "Ofertas comparadas". **Tabla** (`grid 1.3fr 1fr 1fr 1fr`, `min-width:620px`, scroll horizontal en móvil) columnas: Banco · Monto máx. (+plazo) · Cuota/tasa · Respuesta. Fila destacada con badge "Mejor oferta" (`--success-2`). Datos:
   - Credicefi — RD$1,450,000 / 72m — RD$26,180/mes · 12.9% — 18 horas — **Mejor oferta**
   - Banco Piloto RD — RD$1,380,000 / 60m — RD$27,340/mes · 13.5% — 24 horas
   - Banco Reservas — RD$1,300,000 / 60m — RD$29,050/mes · 14.2% — 48 horas
8. **Trust bar**: fondo `--surface-2`, logos de bancos (Credicefi, Banco Piloto, BHD, Reservas, APAP) + chips de certificación (Verificación de cédula JCE, VIN validado, Cumplimiento LOPD 172-13, Dealers verificados).
9. **Testimonios**: 3 cards con estrellas (warning), quote, avatar+nombre+rol.
10. **Búsquedas populares** (`#populares`): H2 "Búsquedas populares en RD", 3 columnas de chips (Por marca / Por ciudad / Por presupuesto), cada chip aplica un filtro pre-cargado. **SEO**: en Next.js renderizar como `<Link>` reales a `/vehiculos?...`.
11. **Footer**: logo + tagline "Hecho en RD 🇩🇴", 4 columnas de links (Comprar/Vender/Empresa/Soporte), barra legal "© 2026 Nadakki Auto SRL · RNC … · Cumplimiento LOPD (Ley 172-13)" + Privacidad/Términos/Protección de datos.

### 8.3 Pantalla 2 — Búsqueda con AI (`#catalogo`, `/vehiculos`)
Layout `flex` con `flex-wrap` (colapsa a 1 columna en móvil):
- **Panel de filtros** (aside, `flex:1 1 270px; max-width:300px; sticky top:82px`):
  - **Buscar por cuota** (card con borde brand, fondo `--brand-soft`): slider "Puedo pagar hasta" `RD$ /mes` (min 12,000 · max 80,000 · step 1,000, default 30,000) + slider "Inicial disponible" (0–1,500,000 · step 25,000, default 300,000) + botón toggle "Filtrar por presupuesto". Al mover → **resultados y contador se recalculan en vivo** (sección 6.4).
  - **Facetas** (multi-select por chips que togglean): Marca (10), Tipo (Sedán/SUV/Premium), Provincia (7), Año (2019–2023), Combustible (Gasolina/Diésel/Híbrido). Chip activo: borde+texto brand, fondo `--brand-soft`. Botón "Limpiar".
- **Resultados** (`flex:999 1 520px`):
  - **Top bar**: input refinar (+mic) · segmented **Grid/Lista/Mapa** · `<select>` orden (Más relevantes / Precio ↑ / Precio ↓ / Cuota más baja / Mejor match).
  - Encabezado "N vehículos" (+ "· compatibles con tu presupuesto" si el toggle está activo) + label de filtros activos.
  - **Grid**: `auto-fill minmax(250px,1fr)` de VehicleCard.
  - **Lista**: filas horizontales (foto 170px + info + badges + precio/cuota).
  - **Mapa**: placeholder con grid overlay + **pins = cuota** posicionados por provincia (en prod: Mapbox/Google Maps con marcadores de cuota).
  - **Empty state**: ilustración lupa, "No encontramos vehículos con esos criterios", CTA "Limpiar filtros" + "Preguntar al Concierge".
- **Parser de query** (búsqueda natural): extrae techo de precio (`"1.5M"→1,500,000`), y keywords → `uber|econ|barat`→Sedán/precio<1.2M, `yipet|jeepet|suv|playa|famil`→SUV, `premium|lujo|bmw|merc`→Premium; resto match texto make/model/type.

### 8.4 Pantalla 3 — AI Sales Concierge (Sheet global)
- Trigger: **botón flotante** "Concierge AI" (`position:fixed; bottom:24px; right:24px; z-index:55`, gradiente brand, `animation:nkPulse 3s infinite`).
- Panel: `fixed` derecha, `width:min(430px,100%)`, overlay oscuro detrás (`rgba(8,12,22,.42)` + blur), entrada `nkUp .28s`.
- **Header**: avatar concierge (gradiente + dot verde "en línea"), "Concierge Nadakki", "Chat en español dominicano · en línea", botón cerrar.
- **Mensajes**: burbujas — usuario (gradiente brand, texto blanco, `border-radius:15px 15px 4px 15px`, alineado derecha) / bot (surface, borde, `15px 15px 15px 4px`, izquierda).
  - **Recomendación inline**: cuando el bot sugiere un vehículo → mini-card (thumbnail gradiente 58×46 + nombre + provincia + cuota/mes + chevron) clickable → abre VDP y cierra el chat.
  - **Typing indicator**: 3 puntos `nkDot` mientras "responde" (setTimeout ~1100ms).
- **Quick actions** (chips scroll horizontal): "Agendar visita", "Calcular cuota", "Aplicar financiamiento".
- **Input**: campo + botón enviar (Enter también envía). Respuesta canned por keywords → rec de vehículo (uber→Corolla, premium→GLC, familia/suv→Sportage, default→Tucson).
- Seed inicial: saludo + pregunta usuario "jeepeta familiar, no más de 28 mil/mes" + respuesta con rec Kia Sportage.

### 8.5 Pantalla 4 — VDP (`#vdp`, `/vehiculo/[id]`)
Breadcrumb "Volver a resultados · tipo · provincia". Layout `flex` 2 columnas (`flex-wrap`, colapsa):
- **Columna izquierda** (`flex:999 1 540px`):
  - **Galería**: imagen principal `aspect-ratio:16/10`, `border-radius:16px`, overlay inferior. Badge estado (top-left), botones **"Ver 360°"** y **"Video AI"** (top-right, fondo blanco translúcido), contador "n/N" (bottom-left). Tira de **5 thumbnails** (`aspect-ratio:4/3`) con `filter` para diferenciar; seleccionada = borde brand. (En prod: fotos reales; los filtros son placeholder.)
  - **Header**: título Manrope 800 `clamp(24,3.4vw,32)`, meta (provincia · km · transmisión), precio RD$ 26px + US$.
  - **Match card**: anillo SVG (r=16, `stroke-dasharray` = match% de 100.53) con % al centro + "Match con tu perfil".
  - **Trust chips**: "Dealer Verificado", "VIN validado", "15 usuarios: precio justo".
  - **Tabs**: Especificaciones (grid de specs) · Historial (timeline: VIN sin accidentes, 1 dueño, servicio completo, matrícula al día) · Ubicación (mapa placeholder + dirección dealer) · Dealer (card con rating, reseñas, botón Contactar). Tab activo: borde inferior brand.
  - **Vehículos similares**: mismo tipo, 3 cards compactas.
- **Sidebar derecha sticky** (`flex:1 1 320px; max-width:370px; sticky top:82px`):
  - **Calculadora de cuota**: cuota grande Manrope 800 34px `--brand`, "a N meses · 13.5% anual". Slider Inicial (0–60%, step 5) mostrando monto. Selector de plazo (48/60/72/84m, segmented). Desglose: monto a financiar + precio. **Recálculo en vivo**.
  - CTAs: **"Aplicar financiamiento"** (primary, gradiente brand, full-width) · "Chat" (abre Concierge) · botón guardar (corazón).
  - Card verde "Precio Justo verificado — reportado por 15 usuarios · 4% bajo el promedio".

### 8.6 VehicleCard (componente clave — reusado en destacados, búsqueda, similares)
`article` clickable, `border-radius:16px`, `--shadow-sm`. Hover: `transform:translateY(-5px) scale(1.02)` + `--shadow-lg`, `transition .2s ease`. `data-vehicle-id` + `data-price-status`.
1. **Foto** `aspect-ratio:4/3` (gradiente/next-image) + overlay inferior.
2. **Badge de calidad** (top-left) — Excelente/Precio justo/Sobre el mercado (sección 6.3).
3. **Botón guardar** (top-right, corazón, `nkPop` al activar; lleno `#EF4444`).
4. Indicador de fotos (4 dots) — en destacados.
5. **Título** `2022 Toyota Corolla` estilo `make model year` (Manrope 700, 15.5px).
6. **Ubicación** con pin (12px) + **meta line** `38,400 km · Automática · Gasolina`.
7. **Precio** RD$ 18px Manrope 800 + US$ 11px subtle · **Cuota** 15px `--brand` "estimado /mes".
8. **Fila de badges**: `94% match` (brand-soft), `✓ Dealer Verified` (success-soft, si verificado), `✓ VIN validado` (surface-2).
9. **Botones**: "Aplicar financiamiento" (primary full-width, hover `brightness(1.1)`) + "Ver" (outline).
- **Skeleton**: mismo layout con shimmer `nkShimmer` (usar mientras carga; **no spinners**).

---

## 9. Estados obligatorios (por pantalla)
- **Loading**: skeletons con `nkShimmer` (cards, filas, VDP). Chat: typing dots. Aplicación: progress bar. **Nunca spinners genéricos.**
- **Empty**: búsqueda sin resultados (ver 8.3) con ilustración minimal + 2 CTAs.
- **Error**: card gris + icono warning + "Algo no salió bien. Intenta de nuevo." + botón "Reintentar". (Copy español dominicano correcto, sin Spanglish.)
- **Success/feedback**: **Toast** discreto (`fixed` bottom-center, fondo `--fg`, texto `--bg`, icono check verde, auto-dismiss ~2.4s, `nkToast`). Usado en guardar, aplicar, agendar, etc.

---

## 10. State management (mapear a React/URL)
Estado global (Context/Zustand): `theme` ('light'|'dark'), `tenant` ('nadakki'|'credicefi'|'piloto'), `device` (preview desktop/móvil — solo demo), `chatOpen`, `saved` (set de ids en wishlist → persistir), `toast`.
Estado de búsqueda → **URL querystring** en Next.js: `query`, `brands[]`, `types[]`, `provinces[]`, `years[]`, `fuels[]`, `maxMonthly`, `initial`, `usePayment`, `sort`, `view`.
Estado VDP: `selectedId` (=route param), `tab`, `galleryIdx`, `vdpDown`, `vdpTerm`.
Chat: `messages[] {role,text,recId?}`, `chatInput`, `typing`.
Efectos on-mount: count-up del contador + rotación de placeholder (limpiar en unmount).

---

## 11. Responsive (mobile-first — 60–70% del tráfico RD es móvil)
El prototipo es **fluido** (grids `auto-fill/auto-fit minmax()`, `clamp()`, `flex-wrap`) y trae un toggle de preview móvil (frame 430px + status bar). En Next.js + Tailwind aplicar breakpoints reales:
- **≤767 (mobile):** 1 columna de vehículos; H1 ~48px; filtros en **bottom sheet** con botón "Filtros"; VDP en stack (galería → info → **calculadora sticky bottom**); Concierge como bottom sheet full-width; nav condensado (label "Match My Approval" oculto, considerar menú hamburguesa); tabla comparador con scroll-x.
- **768–1023 (tablet):** 2 columnas; VDP en stack; padding contenedor 40px.
- **1024–1279 (desktop):** layout completo (VDP `1fr 400px`).
- **≥1280 (wide):** contenedor hasta 1440px.
Targets táctiles ≥44px; focus visible con `--ring`; contraste WCAG 2.1 AA; `alt` en todas las fotos.

---

## 12. Componentes shadcn/ui ↔ custom
| Elemento | shadcn/ui | Custom |
|---|---|---|
| Botones/CTAs | `Button` (variants: default/outline/ghost) | gradiente brand en primary |
| Tenant/orden | `Select` | — |
| Chips facetas | `Toggle` / `Badge` clickable | `FacetChip` multi-select |
| Sliders cuota | `Slider` | track gradiente brand |
| Tabs VDP | `Tabs` | — |
| Chat panel | `Sheet` (side=right) | `ChatMessage`, `InlineVehicleRec`, typing dots |
| Toast | `Sonner`/`Toast` | estilo `--fg`/`--bg` |
| Empty/skeleton | `Skeleton` | `VehicleCardSkeleton`, `EmptyState` |
| Voz | — | `VoiceOverlay` (waveform) |
| Match ring | — | SVG `MatchScore` |
| Card vehículo | `Card` base | `VehicleCard`, `QualityBadge`, `SaveButton` |
| Iconos | **Lucide** | siluetas de tipo (car, truck, etc. custom outline) |

---

## 13. Assets necesarios
- **Fotos de vehículos** 4:3 (galería VDP 16:10) — hoy son gradientes placeholder por vehículo. Reemplazar por `next/image`.
- **Logo lockups** de Nadakki + por tenant (Credicefi, Banco Piloto) — hoy: marca SVG (carro) en cuadro con gradiente + inicial de banco.
- **Iconos**: Lucide (search, mic, heart, sun/moon, message, shield, sparkles/star, map-pin, sliders, grid/list/map, calculator, arrow-right, building, check). **Custom**: 8 siluetas de tipo de vehículo (outline), "Match My Approval" (estrella), "Precio Justo" (estrella/escudo), "Voice Search" (mic).
- **Ilustraciones minimal** para empty states.
- **Mapa**: integrar proveedor real (Mapbox/Google) para vista Mapa y tab Ubicación.
- **Voz**: Web Speech API (`SpeechRecognition`) es-DO para la búsqueda por voz real.

---

## 14. Copy (español dominicano — usar textual)
- H1: "El vehículo perfecto para ti, financiado en tu banco"
- Sub-hero tenant: "Powered by Nadakki" (tenants) / "Marketplace inteligente" (Nadakki).
- Value props: "Aprobación bancaria en 24h" · "AI Concierge 24/7" · "Precio Justo verificado".
- Placeholders de voz/búsqueda: "yipeta pa la playa", "algo pa Uber", "carrito automático pa mi mamá", "tengo 300 mil de inicial", "no puedo pagar más de 28 mil al mes", "Honda CR-V bajo 1.5".
- Badges: "Excelente oportunidad", "Precio justo", "Sobre el mercado", "Compatible con tu presupuesto", "Dealer Verified", "VIN validado".
- Toasts ejemplo: "Guardado en tu wishlist", "Iniciando aplicación de financiamiento…", "Visita agendada".
- Error: "Algo no salió bien. Intenta de nuevo." · Empty: "No encontramos vehículos con esos criterios".
- Legal footer: LOPD (Ley 172-13), RNC. **Sin Spanglish, sin emojis en UI** (salvo el 🇩🇴 del footer).

---

## 15. NO hacer (del brief)
Nada de template Bootstrap genérico · sin gradients de moda excesivos · sin emojis en la interfaz · sin skeuomorfismo/glossy · **skeletons, no spinners** · sin modals que interrumpan · sin densidad baja · español correcto siempre.

---

## 17. Adiciones iteraciones 2–3 (completitud tipo AutoTrader + señales AI)

Todo esto ya está en el prototipo y es aditivo sobre lo anterior.

### 17.1 Explora por tipo (landing)
Grid `auto-fill minmax(150px,1fr)` de 8 tiles: imagen (hoy gradiente + silueta outline) + **label combinada dominicana/internacional** + contador. Click → `/vehiculos?tipo=`. Hover: borde brand + `translateY(-3px)` + sombra.
`Yipeta / SUV` (342) · `Sedán` (128) · `Camioneta / Pickup` (96) · `Guagua / Minivan` (54) · `Deportivo` (23) · `Compacto` (87) · `Convertible` (12) · `Lujo` (41). Mapeo interno de tipo: SUV / Sedán / Premium.

### 17.2 Sidebar de filtros exhaustivo (búsqueda)
Facetas multi-select (chips que togglean): **Marca** (10) · **Tipo** (Sedán/SUV/Premium) · **Provincia** (7) · **Año** (2019–2023) · **Combustible** (Gasolina/Diésel/Híbrido/Eléctrico) · **Transmisión** (Automática/Manual) · **Condición** (Certificado Nadakki/Usado) · **Vendedor** (Dealer verificado/Nadakki Particular Verificado) · **Features** (Cuero/Cámara 360°/Sunroof/Bluetooth/CarPlay/Navegación).
- **Buscar por cuota** (card destacada) — sliders mensualidad + inicial, toggle "Filtrar por presupuesto".
- **Nadakki AI Signals** (sección con borde brand) — 4 toggles tipo switch: `precio-justo` (Solo Precio Justo verificado) · `match85` (Match Score > 85%) · `historial` (Historial verificado por AI) · `sin-fraude` (Sin banderas de fraude). Reglas de filtro: precio-justo excluye status `sobre`; match85 exige `match≥85`; historial y sin-fraude exigen `verified`.
- **Crear alerta AI · guardar búsqueda** (botón dashed) → toast Predictive Alerts.

### 17.3 Chips activos (sobre resultados)
Fila de chips con cada filtro activo + botón `✕` para remover individual, más "Limpiar todo". Incluye cuota (`≤ RD$ X/mes`) y AI signals. Solo visible si hay ≥1 filtro (`hasActiveChips`).

### 17.4 VehicleCard enriquecida (densidad AutoTrader)
Sobre lo de §8.6, ahora incluye:
- **Contador de fotos** (bottom-right foto): `{18 + (id*3)%12} fotos` con icono cámara.
- **Features line** en mayúsculas por vehículo (mapa `featuresLine` por id) — ej. `AUTOMÁTICO · CUERO · CÁMARA 360° · SUNROOF`.
- **Cuota detallada**: `RD$ X/mes · 60 meses · 13.5% APR` bajo el precio.
- **Row de badges**: `{match}% match` (brand-soft) · `Recién publicado` (azul, ids 3 y 7) · `Certificado Nadakki` (violeta, year≥2023 o badge Certificado) · `Dealer Verified` (verde, si verified).
- **Row de dealer**: iniciales en cuadro + nombre (`dealerName` por id) + rating con estrella.
- **CTAs**: "Aplicar financiamiento" (primary, hover `brightness(1.1)`) + "Ver".
`dealerName`: verified → ['AutoMundo RD','Motores del Este','Autos del Cibao','Caribe Motors'][id%4]; si no → 'Nadakki Particular'. `avgResp`: ['15 min','1 hora','30 min','2 horas'][id%4].

### 17.5 VDP — Análisis de precio Nadakki AI (Price Evaluation, AI-08)
Barra de 3 rangos coloreados (Excelente 0–40% verde brillante · Precio Justo 40–70% verde · Sobre mercado 70–100% ámbar) con marcador en la posición de la oferta. Cálculo de rangos:
```
lo  = round(price*0.932 / 1000)*1000
mid = price
hi  = round(price*1.068 / 1000)*1000
top = round(price*1.135 / 1000)*1000
pos = (mid-lo)/(top-lo)*100   // posición del marcador
```
Copy: "Este precio es 5% mejor que el promedio del mercado." + "Basado en 47 {make} {model} {year} vendidos en RD en los últimos 90 días · desembolsos verificados en la red Nadakki + Credicefi."

### 17.6 VDP — Verificaciones Nadakki AI (tab Historial, AI-10)
Bajo el timeline, card `--brand-soft` con 4 checks: "VIN validado en registros oficiales (DGII)" · "{photoCount} fotos verificadas sin manipulación digital" · "Dealer con {rating} estrellas y 342 ventas previas" · "Sin señales de fraude detectadas por Nadakki AI".

### 17.7 VDP — Sidebar: Contactar vendedor + Trade-in
- **Contactar {dealerName}**: rating + "responde en ~{avgResp}", mensaje pre-llenado (`¡Hola! Este {make} {model} {year} se ve interesante. ¿Sigue disponible?`), botón "Enviar mensaje" (primary), "Ver número" (con dot de privacidad → 809-555-01XX).
- **Trade-in**: card con icono + "Evaluación instantánea de tu vehículo actual con AI" + botón "Añadir datos de mi vehículo".

### 17.8 VDP — Header sticky de navegación
Aparece al scroll `> 520px` (`vdpStuck`), `position:sticky; top:63px`, animación `nkUp`. Contenido: thumbnail 60×60 (gradiente del vehículo) · título + features line · precio · segmented **Anterior / "{index} de 400" / Siguiente** (`prevVeh`/`nextVeh` ciclan el array) · Guardar (heart) · **Contactar vendedor** (primary). En móvil colapsa (envuelve).

### 17.9 Bottom-sheet de filtros (móvil)
- **FAB "Filtros (N)"** fijo bottom-left, solo cuando `screen==='search' && device==='mobile'` (`showFilterFab`). N = conteo de filtros activos.
- **Sheet**: `fixed` bottom, `border-radius:22px 22px 0 0`, `max-height:88vh`, slide-up `nkUp`, backdrop `rgba(8,12,22,.5)`. Handle bar arriba (tap → cerrar). Header "Filtros" + "Limpiar todo". Cuerpo scrolleable = Buscar por cuota + todas las facetas + AI Signals. Footer fijo **"Aplicar (N vehículos)"** con conteo dinámico (`applyLabel`) → cierra + `runLoading`.

### 17.10 Loading states (skeletons)
`runLoading()` pone `loading:true` ~700ms al entrar a búsqueda o aplicar filtros. Grid muestra 6 skeleton cards con **shimmer** (`nkShimmer`, gradiente `--surface-2`↔`--surface-3`, `background-size:460px`). Sin spinners.

### 17.11 State nuevo (además de §10)
`vdpStuck` (scroll), `filtersSheet` (bottom-sheet abierto), `loading` (skeletons), y arrays de faceta: `years[]`, `fuels[]`, `trans[]`, `traccion[]`, `condicion[]`, `vendedor[]`, `feats[]`, `aiSignals[]`. Listener global de `scroll` (passive) alterna `vdpStuck`; limpiar en unmount.

### 17.12 Innovaciones AI — dónde viven
AI-04 Match Score → cards + VDP · AI-08 Precio Justo explicado → Price Evaluation §17.5 · AI-02 Concierge contextual → panel/FAB · AI-11 Voice Search → overlay mic · AI-10 Historial AI → §17.6 · AI-12 Predictive Alerts → "Crear alerta AI" §17.2 · Credit Hub → "Match My Approval" (nav) · AI-07 Listing Studio / AI-05 Lead Rescue / AI-06 Inventory Health → referenciadas en rutas de dealer (P2, aún por diseñar).

---

## 16. Archivos en este paquete
- `Nadakki Auto.dc.html` — prototipo de referencia completo (4 pantallas P0 + secciones de marketing + adiciones iteraciones 2–3, tema/tenant/device switchers). Ábrelo en un navegador para ver interacciones, animaciones y estados reales.
- `README.md` — este documento.
