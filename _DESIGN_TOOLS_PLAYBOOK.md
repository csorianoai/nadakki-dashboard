# _DESIGN_TOOLS_PLAYBOOK.md — NADAKKI FORGE
## Cuándo y cómo usar herramientas de diseño visual ANTES de escribir código
### Para Cowork — Workflow obligatorio para tareas P1 y P2

---

## 🎯 EL PRINCIPIO FUNDAMENTAL

**No codees ciego.** Antes de escribir un componente complejo o una página completa:

1. **Investiga visualmente** — busca referencias reales del benchmark
2. **Boceta** — describe la estructura ANTES del código
3. **Valida** — confirma con Cesar que la dirección está correcta
4. **Ahora sí codea**

Saltarse este loop = riesgo de tener que rehacer 4 horas de trabajo. Hacerlo = ahorra tiempo neto y mejora calidad.

---

## 🛠️ EL TOOLKIT DE DISEÑO

Tienes **4 herramientas** disponibles. Úsalas en el orden correcto:

### Tool 1 — Web search para benchmarks visuales

**Cuándo:** Antes de empezar cualquier tarea P1 (componentes complejos: DataTable, EvidenceCard, AuditTimeline) o P2 (cualquier hero page).

**Cómo:**
```
Searches recomendadas según el componente:

DataTable institucional:
  - "Goldman Sachs Marquee dashboard table screenshot"
  - "Stripe dashboard transactions table 2026"
  - "Brex transactions list dashboard"

Hero pages bank:
  - "Bloomberg terminal credit application screenshot"
  - "Goldman Marquee deal monitor"
  - "credit application review dashboard fintech"

Wizard de aplicación:
  - "Stripe atlas wizard 5 steps"
  - "fintech multi-step form Linear style"

EvidenceCard / AI signals:
  - "AI evidence card financial dashboard"
  - "credit risk signals Bloomberg style"
```

**Reglas:**
- Mínimo 3 referencias visuales antes de empezar
- Captura URLs en `_design/REFERENCES_<task_id>.md`
- Identifica QUÉ vas a tomar de cada referencia (NO copies todo, NO copies nada literal)
- Anota QUÉ vas a rechazar de cada referencia

### Tool 2 — Claude (chat) para crítica de diseño

**Cuándo:**
- Antes de codear cualquier componente "signature" (EvidenceCard, AuditTimeline, DataTable)
- Cuando tengas dos opciones de layout y no estés seguro cuál es más institucional
- Cuando termines un componente y quieras que lo revisen ANTES de marcarlo DONE

**Cómo:**
1. Abre una pestaña aparte de **Claude chat** (no Cowork — chat)
2. Pega esto como apertura de la consulta:

```
Soy Cowork trabajando en Nadakki Forge — un design system institucional para fintech LATAM. 
Benchmark = Goldman Marquee × Stripe × Linear. 
Anti-benchmark = Dribbble fintech, glassmorphism, neon.

Necesito que actúes como Staff Product Designer (Goldman/Stripe) y critiques mi propuesta.

Reglas duras del sistema (no se rompen):
- Tokens CSS desde tokens.css, jamás hex hardcodeado
- Border-radius máx 8px (pills 9999px)
- Sombras casi planas (shadow-xs default, shadow-lg modal max)
- Tipografía: Source Serif 4 (display) + Inter (body), tabular-nums
- Status SIEMPRE icono+texto, nunca solo color
- Multi-tenant via [data-tenant], jamás `if(tenant === 'X')`

Aquí está mi propuesta para <componente/página>:
[describir layout en ASCII art o pegar el TSX]

Críticame con dureza. Específicamente:
1. ¿Esto se ve institucional o consumer?
2. ¿Densidad vs whitespace correctos para Bank persona?
3. ¿Algún anti-pattern del Forge spec?
4. Mejora #1 más impactante que harías
```

3. Toma la crítica en serio. Si Claude detecta un anti-pattern → arréglalo ANTES de codear.

**Reglas:**
- Usa Claude chat para feedback de diseño, NO para que escriba código (eso es para Code/Cowork)
- Documenta el feedback en `_design/REVIEWS_<task_id>.md`
- Si Claude y tú no se ponen de acuerdo → escala a Cesar, no improvises

### Tool 3 — Imagen + Visualizer para mockups rápidos

**Cuándo:**
- Para tareas P2 (hero pages) — necesitas un mockup visual antes de codear
- Para EvidenceCard, AuditTimeline, KpiCard signature
- Cuando Cesar te pida "muéstrame cómo va a quedar antes de codear"

**Cómo (usando Claude chat — abre pestaña aparte):**
1. Pega esto:

```
Genera un MOCKUP HTML+CSS de la siguiente página/componente del Nadakki Forge, 
usando estos design tokens exactos (no inventar):

--forge-brand-500: #2E5F97
--forge-ink-800: #1A2540
--forge-ink-200: #DDE3EA
--forge-surface-page: #F7F8FA
--forge-surface-card: #FFFFFF
--forge-success-500: #0F7A3E
--forge-warning-500: #B7791F
--forge-danger-500: #B5201E

Tipografía:
- Headings: 'Source Serif 4', Georgia, serif
- Body: 'Inter', sans-serif (con tabular-nums)
- Body size: 14px (densidad institucional)

Reglas:
- Border-radius máx 8px (pills 9999px)
- Sombras casi planas (shadow-xs default)
- Status pill: SIEMPRE icono Lucide + texto
- Numbers: text-align right + tabular-nums
- Whitespace generoso (space-6 = 24px en cards)

Componente/página a mockear: <descripción>
Datos de ejemplo: <ejemplos JSON realistas>

Genera UN solo archivo HTML autocontenido (CSS inline en <style>), responsive 
desktop-first 1280px+. Nada de animaciones más allá de hover sutil.
```

2. Claude genera el mockup HTML
3. Lo abres en el browser para ver cómo queda
4. Si algo está mal → iteras con feedback específico
5. **Solo cuando el mockup esté aprobado, lo conviertes a TSX**

**Reglas:**
- Mockup HTML primero, código React después — NUNCA al revés
- Guarda el mockup HTML en `_design/mockups/<task_id>.html` para historial
- Si Cesar lo aprueba → lo conviertes a TSX usando los tokens reales
- Si Cesar lo rechaza → otra iteración hasta aprobación

### Tool 4 — Claude Code para conversión mockup → TSX

**Cuándo:** Cuando el mockup HTML está aprobado y hay que convertirlo a componentes Forge.

**Cómo:**
1. Abre Claude Code (otra pestaña en Claude Desktop)
2. Apúntalo al repo `nadakki-dashboard`
3. Pásale instrucción tipo:

```
Convierte este mockup HTML a un componente TSX dentro del Forge design system.

Archivo destino: components/forge/<categoria>/<NombreComponente>.tsx

Reglas:
1. NO uses hex codes — usa Tailwind classes que mapean a CSS variables 
   (text-forge-ink-800, bg-forge-surface-card, etc.)
2. NO uses inline styles para colores
3. Cada elemento interactive debe tener focus ring visible
4. Status pills: <StatusPill> component (ya existe), no recrear
5. Buttons: <Button> component (ya existe)
6. TypeScript estricto — JAMÁS `any`
7. JSDoc completo arriba del componente con: descripción, usage rules, accessibility, ejemplo
8. Import path absoluto: @/components/forge/...

Mockup HTML:
[pegar contenido del .html aprobado]

Datos de ejemplo (TypeScript types):
[pegar interface/type del API]
```

4. Claude Code genera el TSX
5. Tú (Cowork) integras al repo, corres `npm run build`, commiteas

---

## 📋 WORKFLOW POR TIPO DE TAREA

### Para tareas P0 (fundación)
**Sin diseño visual** — son tokens, layout shell, audit. Solo código directo.

### Para tareas P1 (componentes base)

```
[1] Tool 1: Web search benchmarks (15 min)
       └─> Output: _design/REFERENCES_<task_id>.md
[2] Tool 2: Claude chat para crítica del approach (10 min)
       └─> Output: _design/REVIEWS_<task_id>.md
[3] Codear componente (variable)
[4] Crear preview page con todas las variantes
[5] Tool 2: Claude chat para crítica final ANTES de DONE (10 min)
[6] Si pasa: commit DONE
[7] Si no: iterar
```

### Para tareas P2 (hero pages — wizard, dashboard, detail)

```
[1] Tool 1: Web search benchmarks (20 min)
[2] Tool 3: Generar mockup HTML completo (30 min)
       └─> Output: _design/mockups/<task_id>.html
[3] Mostrar mockup a Cesar y esperar aprobación
[4] Tool 4: Claude Code convierte mockup → TSX
[5] Cowork integra al repo + tests visuales
[6] Tool 2: Claude chat critica final
[7] Commit DONE
```

### Para tareas P3 (polish + reusability)
**Mayoría sin diseño nuevo** — solo refinement. Si hay un nuevo componente: workflow P1.

---

## 🚫 ANTI-PATTERNS DE DISEÑO (consultas mal formuladas)

### ❌ Mal: pedir diseño sin tokens
```
"Hazme una tabla bonita para mi app de finanzas"
```
→ Claude va a inventar colores, no va a respetar el design system.

### ✅ Bien: pedir diseño CON tokens
```
"Genera tabla usando estos design tokens exactos: [lista]. 
Reglas no negociables: [lista]. 
Anti-patterns prohibidos: [lista]."
```

### ❌ Mal: copiar literal de otra app
```
"Hazlo idéntico a Stripe"
```
→ Resultado genérico que no es Forge.

### ✅ Bien: tomar elementos específicos
```
"Toma de Stripe: la densidad de tabla, los status pills, los focus states. 
Rechaza: el morado de Stripe, los gradientes de marketing."
```

### ❌ Mal: codear sin aprobar mockup
```
"Voy a codear el dashboard ahora mismo"
```
→ Si el approach está mal, perdiste 4 horas.

### ✅ Bien: aprobar primero, codear después
```
"Aquí está el mockup HTML del dashboard. ¿Apruebas el approach 
antes de que lo convierta a TSX?"
```

---

## 📝 ARCHIVOS QUE GENERA ESTE WORKFLOW

Por cada tarea P1/P2, debes producir:

```
_design/
├── REFERENCES_<task_id>.md    ← URLs + screenshots de benchmarks
├── mockups/
│   └── <task_id>.html         ← Mockup aprobado
└── REVIEWS_<task_id>.md       ← Feedback de Claude chat
```

Estos archivos quedan en el repo. Sirven de:
- Historial visual del producto
- Onboarding para futuros engineers
- Evidencia ante un cliente que pregunta "¿por qué esta decisión?"

---

## 🎨 CHECKLIST DE DISEÑO ANTES DE CADA TAREA P1/P2

```
[ ] ¿Busqué al menos 3 referencias visuales del benchmark?
[ ] ¿Documenté QUÉ tomar y QUÉ rechazar de cada referencia?
[ ] ¿Pedí crítica a Claude chat antes de codear?
[ ] ¿Para hero pages: generé mockup HTML primero?
[ ] ¿Cesar aprobó el mockup antes de convertir a TSX?
[ ] ¿El componente cumple TODOS los anti-patterns (cero violaciones)?
[ ] ¿Pedí crítica final a Claude chat antes de marcar DONE?
[ ] ¿Documenté en _design/ el proceso?
```

**Solo cuando todos estén ✓ → marca la tarea DONE.**

---

## 🤝 COORDINACIÓN CON CESAR (CTO)

**Cesar va a revisar visualmente:**
- Cada mockup HTML antes de que lo conviertas a TSX (P2)
- Cada componente signature en preview page (P1: EvidenceCard, AuditTimeline, DataTable)
- Cada hero page completa (P2)

**Cómo le pides revisión:**

```
Hola Cesar, terminé el mockup de <task_id>: <título>.

Está en: _design/mockups/<task_id>.html

Decisiones que tomé:
- <decisión 1 + por qué>
- <decisión 2 + por qué>

Referencias que usé:
- <URL 1>: tomé X
- <URL 2>: tomé Y

¿Apruebas para convertir a TSX?
```

Cesar responde con: ✅ aprobado / ⚠️ ajustar X / ❌ rehacer.

---

## 🎯 CIERRE — LA REGLA DE ORO

**Una hora de investigación visual + mockup ahorra cuatro horas de refactor.**

No es "perder tiempo" antes de codear. Es **profesionalismo de diseño**.

Goldman Sachs no codea su Marquee sin mockups previos. Stripe no lanza un dashboard sin diseño. **Nosotros tampoco.**

El listón es Goldman Marquee. Esto es lo que separa Goldman Marquee de un proyecto Dribbble: el **proceso**, no el código.
