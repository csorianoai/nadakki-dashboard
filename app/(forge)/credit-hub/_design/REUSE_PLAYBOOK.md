# Playbook de reutilización (fork de Forge)

**English summary:** This playbook explains how to reuse Forge Credit Hub design tokens, UI primitives, and multi-tenant patterns in a **different product** (e.g. treasury, insurance underwriting). Sections cover reusable assets, parts that must be replaced, a six-step fork procedure, a decision tree (monorepo vs package vs copy-paste), and anti-patterns. Spanish (es-DO neutral) prose; code paths stay literal.

---

## A. Reutilizable tal cual

- `tokens.css` + `tailwind.config.js` capa `forgeBrand` / `forgeInk` / `forgeSurface`.
- Primitivos `components/forge/ui/*` y layout genérico `Sidebar` / `Topbar`.
- `CommandPalette` + patrones de enfoque / a11y documentados.
- Utilidades de formato `utils/forge-*` (toasts, vacíos, locale).
- Estrategia multi-tenant (`data-tenant`, prueba Phase 6).

---

## B. Debe reemplazarse

- Hooks `lib/credit-hub/**` acoplados a crédito.
- Rutas `app/(forge)/credit-hub/**`.
- `ForgeCreditHubAppShell` (marca Credit Hub) — clonar patrón con nuevo namespace.
- Cualquier texto regulatorio específico de RD/LATAM si el vertical cambia.

---

## C. Procedimiento de fork (6 pasos)

1. **Duplicar** árbol `components/forge` → `components/<product>-ui` *o* extraer paquete privado.
2. **Copiar** `tokens.css` y ajustar marca neutra.
3. **Reemplazar** shell y rutas; mantener `docs:validate` equivalente.
4. **Sustituir** hooks por dominio nuevo (API contracts).
5. **Ejecutar** `npm run build` + suite a11y base.
6. **Publicar** guía interna (versión de este playbook para el nuevo producto).

---

## D. Árbol de decisión: monorepo vs paquete vs copy-paste

| Criterio | Monorepo (workspace) | Paquete privado (`@nadakki/forge-ui`) | Copy-paste |
|----------|----------------------|---------------------------------------|------------|
| Equipos >1 consumiendo la misma UI | ✅ | ✅ | ❌ |
| Ciclo de release independiente | ⚠️ | ✅ | ❌ |
| Prototipo rápido <2 semanas | ⚠️ | ❌ | ✅ |
| Necesidad de semver estricto | ⚠️ | ✅ | ❌ |

**Regla práctica:** si solo hay **un** producto más, monorepo + path alias suele bastar. Si hay **2+** productos con cadencias distintas → paquete privado.

---

## E. Anti-patrones al hacer fork

- Mezclar tokens de Forge con paleta legacy sin plan (`AUDIT.md` lista deriva).
- Copiar `components/credit-hub/**` — es legado, no sistema de diseño.
- Reintroducir `framer-motion` en runtime (Phase 7).
- Omitir `docs:validate` y divergencias de headings.

---

## Ejemplo ficticio: *Treasury Management Suite*

| Reutilizar | Reemplazar |
|------------|------------|
| `Button`, `DataTable`, `Modal`, tokens | Hooks de liquidez / cash positioning |
| `CommandPalette` patrón | Navegación sidebar (rutas treasury) |
| Toasts / vacíos | Textos regulatorios US/EU |

**Plan (resumen):** (1) workspace package `@acme/treasury-shell`; (2) copiar `tokens.css` con marca verde oliva institucional; (3) nuevo `app/(forge)/treasury/layout.tsx` leyendo `PersonaProvider` adaptado; (4) APIs internas de posición; (5) `docs:validate` renombrado a script propio; (6) publicar `TREASURY_PLAYBOOK.md` hijo de esta guía.

Secciones citadas: **A–E** arriba.

## Enlaces

- [`COMPONENTS.md`](./COMPONENTS.md) · [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)

