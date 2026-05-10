# REFERENCES_P10-05.md
## P10-05 · Live `tenant_branding` fetch — visual benchmarks

**Tarea:** Implementar fetch real de branding del tenant con manejo de los 3 estados (loading / error / success).
**Workflow paso:** 1 (web search) — output para informar el mockup en paso 2.
**Fecha:** 2026-05-09

---

## El problema visual a resolver

El usuario verá tres estados perceptibles cuando el sistema fetcha branding del tenant en `app/(forge)/credit-hub/layout.tsx`:

1. **LOADING** — primer render mientras `useTenantBranding(tenantId)` está en `isPending: true`. Layout existe pero logo, nombre del tenant, y colores aún no están aplicados.
2. **ERROR** — fetch falló (red, 500, 403). Sistema cae al branding default y muestra banner notificando al usuario.
3. **SUCCESS** — fetch completado. Logo, colores, locale, currency aplicados.

El bar institucional es **Goldman Marquee × Stripe × Linear**, no Dribbble. Los 3 estados deben sentirse calmados, predecibles, y comunicar autoridad — no "delight".

---

## Referencias evaluadas (4 búsquedas, 3 elegidas como vinculantes)

### REF-1 · Stripe Dashboard — animación que compra tiempo de carga
**Fuente:** [Dashboard Design Patterns for Modern Web Apps 2026 — Art of Styleframe](https://artofstyleframe.com/blog/dashboard-design-patterns-web-apps/) · [Stripe Dashboard States — Mobile Patterns](https://www.simform.com/mobile-patterns/iphone/stripe-dashboard/states-loading-loading-views-503)

**Lo que dice:** *"Stripe introduces people to their dashboard with motion, and animation also buys Stripe time to load data in the background."*

**Qué TOMAR:**
- ✅ Patrón de "skeleton-screen-as-bridge": no spinner — la silueta del componente final (header, sidebar, KPI strips) se renderiza en gris muy sutil con shimmer y la transición a contenido real es seamless. Reduce perceived latency ~30%.
- ✅ Sidebar layout estable durante loading — la nav nunca cambia, solo el chrome del topbar (logo + tenant name) carga después.
- ✅ Card layouts y sidebar-based navigation que escalan independientemente del state.

**Qué RECHAZAR:**
- ❌ "Motion buys time" → no aplica para Forge. Forge filosofía #5 (Motion functional only — no delight). Animation solo para shimmer del skeleton (≤120ms duration token), nunca para entrada de contenido.
- ❌ El gradiente decorativo de Stripe en headers — Forge anti-pattern #5 (no animated gradients).
- ❌ Iconos coloreados/marketing — Forge usa Lucide icons monocromáticos.

---

### REF-2 · Linear Workspaces — switching como command primitive
**Fuente:** [Workspaces — Linear Docs](https://linear.app/docs/workspaces)

**Lo que dice:** *"To switch workspaces in Linear, you hover over Switch workspace and select Create or join a workspace... you can also switch workspaces by typing O then W."* Multiple workspaces under single account, distinct member lists, separate billing.

**Qué TOMAR:**
- ✅ El switching de workspace/tenant **NO es un side-effect mágico**. Linear lo trata como una acción explícita del usuario (hover, click, o keyboard). Para Forge, el tenant viene del JWT/X-Tenant-ID al hacer login — **no hay switcher visible en el chrome**, pero cuando hay error de fetch, el banner debe ser igual de explícito que un toast de Linear: claro, no apologético, accionable.
- ✅ Identidad del workspace visible en topbar (logo + name) — el usuario siempre sabe en qué tenant está. Esto es lo que renderizamos en SUCCESS state.
- ✅ Subtle pulse / fade animation — Linear lo usa cuando algo cambia. Reusable para nuestro skeleton shimmer.

**Qué RECHAZAR:**
- ❌ El UI de "Create or join workspace" — no aplica, los tenants Forge se crean en backoffice, no en runtime.
- ❌ Linear usa color magenta vibrante para acciones — Forge usa brand-500 (navy) para nav y semantic colors para acciones. No mezclar.
- ❌ Linear permite múltiples workspaces simultáneos en una cuenta — no es nuestro modelo (un usuario = un tenant via JWT).

---

### REF-3 · Goldman Marquee — institutional dashboard chrome (referencia visual de bar)
**Fuente:** [Goldman Sachs Marquee — Welcome](https://marquee.gs.com/welcome/home) · [Marquee MarketView](https://marquee.gs.com/welcome/our-platform/marketview)

**Lo que dice:** *"Personalized dashboards... pin and rearrange widgets... API delivery... clients can customize and create their own widgets and dashboards."*

**Qué TOMAR:**
- ✅ El chrome (sidebar + topbar) es **invariable visualmente** — densidad alta, espacios uniformes, colores institucionales (navy/charcoal/white), tipografía serif para headlines, sans para data. Esto define nuestro skeleton: cuando el tenant branding está cargando, el chrome SE VE igual que en SUCCESS, solo cambian los slots tenant-specific (logo, name).
- ✅ Datos siempre con `tabular-nums` — currency formatted ya en SUCCESS state (RD$1,847,500 para Credicefi DOP, $1,847,500 para US, MX$1,847,500 para test-mx).
- ✅ Empty/loading states **silenciosos** — banker no necesita celebración. Loading = silencio visual + skeleton, no spinner azul girando.
- ✅ Density: 14px body, headlines 28-36px, padding 24px en cards. Esto es `text-base`, `text-2xl`, `space-6` en nuestros tokens.

**Qué RECHAZAR:**
- ❌ Marquee no documenta su loading/error states públicamente — referencia visual indirecta vía screenshots de welcome page. No copiar pixel-perfect; tomar solo el principio "chrome estable + slots fluidos".
- ❌ El widget customization de Marquee (pin/rearrange) — fuera de scope P10-05.

---

### REF-4 · React/Next.js loading + error patterns (referencia técnica, no visual)
**Fuente:** [Empty States Loading States Error States The UX AI Forgets — Vibe Coder Blog](https://blog.vibecoder.me/empty-states-loading-states-error-states) · [App Router Streaming — Next.js](https://nextjs.org/learn/dashboard-app/streaming) · [Carbon Design System Loading](https://carbondesignsystem.com/patterns/loading-pattern/)

**Lo que dice (síntesis):** Cinco estados a manejar siempre — empty, loading, API error, offline, permission denied. Skeleton screens reducen perceived loading ~30% vs spinners. Fallback components wrapped en Suspense (`<Suspense fallback={<CardSkeleton />}>`). Carbon Design System: "Loading pattern" usa `<Loading />` overlay en operaciones bloqueantes vs skeleton para parciales.

**Qué TOMAR:**
- ✅ El esquema de estados completo: loading, error, success — y dentro de error, distinguir "fetch failed (use default + warn)" vs "no tenantId (block UI con CTA)". Forge necesita los dos.
- ✅ React Suspense + react-query como mecánica para gestionar transiciones — alineado con `_API_CONTRACT.md` patrón recomendado.
- ✅ Carbon's overlay vs skeleton split: usar **skeleton para slots tenant-specific** (logo/name/colors) y **NO bloquear** la página completa — el resto del contenido puede empezar a renderizar con default branding mientras el fetch sucede.

**Qué RECHAZAR:**
- ❌ Spinners full-page — Forge anti-pattern #7 (spinner donde skeleton funciona).
- ❌ Carbon's full-page modal overlay — bloquea UI completa, contradice el principio "chrome estable + slots fluidos" del REF-3.

---

## Síntesis: el approach Forge para los 3 estados

| State | Topbar logo slot | Topbar tenant name slot | Sidebar header bg | Banner | Currency en KPIs | Status pills |
|---|---|---|---|---|---|---|
| **LOADING** | Skeleton 32×80px shimmer | Skeleton 12×120px shimmer | `--forge-brand-500` default | (none) | Skeleton row | Skeleton row |
| **ERROR** | Default Forge wordmark | "Default theme" label en `text-forge-ink-500` | `--forge-brand-500` default | `--forge-danger-50` bg + `--forge-danger-500` border-left + texto + `Retry` button | Default `Intl.NumberFormat('en-US')` | Default labels EN |
| **SUCCESS** | `<img src={branding.logo_url}>` con `next/image` | `branding.display_name` en `font-display` weight 600 | `var(--forge-brand-900)` (deepest navy del tenant) | (none) | `Intl.NumberFormat(branding.locale, { currency: branding.currency })` | Labels desde `branding.application_status_labels` |

**Layout policy en los 3 estados:**
- Sidebar nav SIEMPRE visible (no skeleton de los items — la IA nunca cambia)
- Main content area renderiza con default tokens mientras fetch sucede (no se bloquea)
- Solo los slots tenant-specific (logo, name, sidebar header bg, currency formatters, status labels) se diferencian entre estados
- Skeleton shimmer respeta `prefers-reduced-motion` (no anima, solo muestra silueta estática)

**Decisiones tomadas (y por qué):**

1. **No bloquear la app completa con un Suspense full-page.** Razón: filosofía #1 (Authority over decoration) — un banco no espera frente a un spinner; los datos generales del Credit Core no dependen de branding. Branding es chrome.
2. **Banner de error en `--forge-danger-50` con `--forge-danger-500` border-left.** Razón: REF-1 + REF-3, el banker debe poder identificar el problema en 1 segundo y no perder contexto. Banner tiene Reference ID (ERR-2026-05-09-XXXX) para soporte.
3. **Skeleton shimmer ≤120ms (token `--forge-duration-fast`) con animation linear.** Razón: filosofía #5 (Motion functional only) + REF-2 (Linear's subtle pulse) — el shimmer indica "loading" sin ser decorativo.
4. **No mostrar "Selecciona una institución" en estado vacío.** Razón: este es el caso edge donde no hay tenantId en JWT — eso es bug del auth layer, no UX problem. Por ahora, escalamos a banner de error rojo con copy "Sesión sin institución asignada. Contacta soporte." y deshabilitamos toda acción downstream (no es scope de P10-05 implementarlo si auth no falla nunca; documentamos para Phase 11).

---

## Referencias adicionales consultadas (no vinculantes)

- [Stripe Apps Design Patterns](https://docs.stripe.com/stripe-apps/patterns) — confirma sidebar + main + topbar pattern
- [Skeleton Screens 101 — NN/G](https://www.nngroup.com/articles/skeleton-screens/) — fundamento UX del skeleton
- [Carbon Design System Skeleton](https://cedar.rei.com/components/skeleton) — REI Cedar fork; confirms low-fidelity outline + pulse approach
- [LogRocket — React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/) — librería específica (no la usaremos; nuestros `Skeleton` y `MicroChart` ya implementan esto en `components/forge/ui/`)

---

## Notas para el mockup (paso 2)

- Usar tokens **exactos** leídos de `app/(forge)/credit-hub/_design/tokens.css` — ver tabla en mockup
- Demostrar los 3 estados en una sola página HTML, stackeados vertical con headers de sección
- El SUCCESS state debe usar `[data-tenant="credicefi"]` para mostrar el override navy real
- El ERROR state debe mostrar Reference ID format `ERR-YYYY-MM-DD-NNNN`
- Layout responsive: el chrome es desktop-first (1280px); mockup puede ser desktop-only

---

*Fin de REFERENCES_P10-05.md. Next: `_design/mockups/P10-05_tenant_branding_states.html`.*
