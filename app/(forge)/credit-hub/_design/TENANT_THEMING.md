# Guía de theming y onboarding de tenant (Forge Credit Hub)

**English summary (≈80 words):** This guide explains how to onboard a new financial institution onto Forge Credit Hub: the `TenantBranding` contract, a 15-minute checklist, brand colour workflow with contrast and OKLCH scales, currency/locale/regulatory matrix, logo requirements, copy overrides, pitfalls, and a final verification list. It references Phase 6 **TestBank Mexico** (`REUSABILITY_TEST.md`) as the proof-of-concept. Primary audience: brand ops and engineering leads preparing a pilot tenant (e.g. Credicefi, Banco Piloto RD). Spanish (es-DO neutral) is the authoring language.

---

## A. Contrato `TenantBranding` (schema conceptual)

| Campo | Tipo / restricción | Notas |
|-------|-------------------|--------|
| `tenant_id` | UUID | Identificador estable en APIs. |
| `slug` | string `^[a-z0-9-]+$` | Se refleja en `data-tenant` sobre `.forge-app` (Path B / Phase 8). |
| `primary_color` | `#RRGGBB` | Color institucional principal; debe pasar contraste AA sobre superficie de tarjeta. |
| `logo_svg_url` | URL HTTPS | SVG preferido; ver sección E. |
| `locale` | `es-DO`, `en-US`, … | Alimenta `useTenantConfig().tenantConfig.locale`. |
| `currency_code` | ISO 4217 | `DOP`, `USD`, etc. |
| `regulatory_profile` | enum | p. ej. `DO_LEY_172_13` — alinear con textos de cumplimiento. |
| `copy_overrides` | JSON opcional | Claves por pantalla / sección (Apéndice B v3.2). |

---

## B. Flujo de onboarding (15 minutos)

1. Crear fila de tenant en tu **servicio de identidad** (fuera de este repo).
2. Insertar branding mínimo (ajusta nombres de tabla/columnas a tu backend):

```sql
-- Ejemplo ilustrativo (PostgreSQL)
INSERT INTO tenant_branding (tenant_id, slug, primary_color, locale, currency_code, regulatory_profile)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'banco-boliviano',
  '#1a365d',
  'es-DO',
  'BOB',
  'BO_REG_GENERAL'
);
```

3. Configurar override local: `NEXT_PUBLIC_FORGE_TEST_TENANT=mx` (o slug acordado) siguiendo [`REUSABILITY_TEST.md`](./REUSABILITY_TEST.md).
4. Añadir bloque `.forge-app[data-tenant="slug"]` en [`tokens.css`](./tokens.css) (derivación de `--forge-brand-*`).
5. Verificar `/credit-hub/preview` + ruta banco/dealer en desktop y móvil.

---

## C. Flujo de color de marca

1. Elegir primario en hex (p. ej. `#7B1F1F` en prueba MX — ver [`REUSABILITY_TEST.md`](./REUSABILITY_TEST.md): ajuste de contraste documentado).
2. **Contraste:** validar con [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) (texto normal y grande sobre `surface-card`).
3. **Escala OKLCH:** derivar pasos 50–950 con herramienta de diseño (Figma / OKLCH.com) y **trasladar** a hex para `tokens.css` (mantener pasos consistentes).
4. **Anillo de foco:** comprobar `forgeBrand-500` sobre cabeceras oscuras; si falla, usar `forgeBrand-300` o doble anillo según [`COMPONENTS.md#button`](./COMPONENTS.md#button).

---

## D. Matriz moneda / locale / perfil regulatorio

| Dimensión | Fuente en app | Comportamiento |
|-----------|---------------|----------------|
| Moneda | `useTenantConfig().tenantConfig.currency_code` | Formateo `formatForgeCurrency`. |
| Locale | `tenantConfig.locale` | Toasts / vacíos EN/ES (`utils/forge-*-copy.ts`). |
| Regulación | `regulatory_profile` | Textos de cumplimiento / disclaimers. |

---

## E. Requisitos de logo

- **240×80 px** (ratio 3:1), **SVG** preferido.
- Variante **claro sobre oscuro** para sidebar `data-forge-sidebar-header`.
- Sin raster borroso: evitar PNG escalado en nav.

---

## F. Copy overrides (Apéndice B v3.2)

- Mantener overrides **por clave estable** (`bank.dashboard.hero_subtitle`, etc.).
- No duplicar cadenas que ya existen en bundles i18n salvo excepción de marca.

---

## G. Errores frecuentes

- Contraste insuficiente en primario sobre blanco.
- Saturación excesiva en `viz-*` (rompe lectura institucional).
- Logo demasiado alto (rompe altura del sidebar).

---

## H. Checklist de verificación (10 ítems)

1. `data-tenant` presente en `.forge-app` para el slug piloto.
2. `--forge-brand-500` legible como texto sobre blanco (si se usa como texto).
3. Sidebar legible (logo + labels).
4. `locale` correcto en toasts de prueba.
5. Moneda correcta en tablas de importes.
6. `/credit-hub/preview` sin regresiones visuales.
7. Lighthouse a11y `/credit-hub/preview` ≥ **0.95**.
8. `npm run build` verde.
9. Capturas reusabilidad actualizadas si cambia cromo.
10. Documentar ajustes de color en esta guía (fecha + motivo).

---

## Referencia Phase 6

Ver [`REUSABILITY_TEST.md`](./REUSABILITY_TEST.md): **TestBank Mexico** — fixture `NEXT_PUBLIC_FORGE_TEST_TENANT=mx`, ajuste de contraste en primario `#7B1F1F` y evidencia Lighthouse.
