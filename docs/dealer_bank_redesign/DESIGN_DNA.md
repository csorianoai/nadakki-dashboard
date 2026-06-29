# DESIGN DNA — Cockpit Dealer / Mesa Banco (tema claro)

> Extraído del prototipo Claude Design (oscuro) y adaptado al Forge `--ch-*` en producción.

## Layout

| Zona | Dealer | Banco |
|------|--------|-------|
| Shell | Nav izquierda existente (`ChAppShell`) | Igual |
| Header | Icono + título + CTAs + avatar | Icono banco + Mesa + periodo |
| KPI strip | Grid 4×2 (8 cards) | Grid 4×2 (7 cards) |
| Estrella | Comparador 4 columnas | Cola + panel decisión |
| Rail | Pipeline + mini-KPIs derecha | Alertas (futuro) |
| Footer | Aislamiento dealer | Aislamiento banco |

Mobile: grids colapsan a 1–2 columnas; tablas `overflow-x-auto`.

## Equivalencia oscuro → claro

| Prototipo oscuro | Tema claro repo |
|------------------|-----------------|
| `#0F172A` fondo | `var(--ch-surface)` / blanco |
| Glass card | `ch-card` + `border: 1px solid var(--ch-line)` |
| Cyan acento | `var(--ch-info)` / dealer teal |
| Ámbar MEJOR oferta | `var(--ch-warning)` |
| Verde aprobación | `var(--ch-success)` |
| Violeta "con ofertas" | `DisplayStatusPill` OFFERED |
| Texto claro | `var(--ch-text)` / `--ch-text-2` |

## Patrones

- **MetricCard**: label eyebrow + icono + valor mono grande + delta + sparkline al pie.
- **Comparador**: ribbon `★ MEJOR`, APR hero, stipulation chips, CTA ámbar en ganadora.
- **Ranking**: # + avatar iniciales + chip líder + badge REAL.
- **Honestidad**: `DataTruthBadge` en cada panel; DEMO en metas/tendencias.

## Tipografía

- Títulos: `ch-serif`
- Métricas / folios: `ch-mono`
- Labels: `ch-eyebrow`

No se agregaron fuentes nuevas.
