# FASE 5 — Grafo de dependencias tickets P11 + camino crítico

**Fecha:** 2026-05-09  
**Convención:** Estimaciones orientativas (h); paralelización supone ≥2 devs y APIs disponibles cuando aplique.

---

## Tickets (referencia P11-00 … P11-10)

```
P11-00 Visual System V2 (tokens.css + variables Forge preview)
├── DEPENDS ON: —
├── BLOCKS: P11-01, P11-02, P11-07
└── EST: 8–12 h

P11-01 Component primitives V2 (Button, Card, Input, KPI, Table density)
├── DEPENDS ON: P11-00
├── BLOCKS: P11-02, P11-03, P11-04
└── EST: 16–24 h

P11-02 Layout shell V2 (AppShell, Sidebar 18, Topbar, chrome errores)
├── DEPENDS ON: P11-00, P11-01
├── BLOCKS: P11-03, P11-08
└── EST: 12–18 h

P11-03 Dashboard bank widgets (KPI row, bandeja, charts existentes)
├── DEPENDS ON: P11-02
├── BLOCKS: P11-05
└── EST: 16–24 h

P11-04 Application detail EvidenceCard V2
├── DEPENDS ON: P11-01
├── BLOCKS: —
└── EST: 20–28 h

P11-05 Analytics gaps UI (funnel, heatmap, scatter, geo strip) — front placeholders + datos
├── DEPENDS ON: P11-03 (layout) + **backend slices** (ver 02)
├── BLOCKED BY BACKEND: sí para datos reales (heatmap, funnel, geo)
└── EST: 24–40 h front + variable back

P11-06 Admin / control plane parity (opcional producto)
├── DEPENDS ON: P11-01
├── BLOCKED BY BACKEND: billing/MRR unificado **AMBIGUOUS**
└── EST: 16–32 h

P11-07 Cmd+K global polish (acciones, búsqueda apps)
├── DEPENDS ON: P11-00, P11-02
├── BLOCKS: —
└── EST: 8–14 h

P11-08 Compliance widgets (AML strip, regulatory cards)
├── DEPENDS ON: P11-03
├── BLOCKED BY BACKEND: AML / fraud domain decision
└── EST: 12–20 h

P11-09 LLM surfaces (brief ejecutivo, narrative evidence)
├── DEPENDS ON: P11-04 (UX evidence), orchestrator integration
├── BLOCKED BY BACKEND: endpoint LLM / quotas
└── EST: 24–48 h (cross-funcional)

P11-10 Hardening, visual QA, Storybook/preview sync
├── DEPENDS ON: P11-03–P11-09 (según alcance)
├── BLOCKS: release
└── EST: 16–24 h
```

---

## CRITICAL PATH (mínimo bloqueante end-to-end UI)

**P11-00 → P11-01 → P11-02 → P11-03 → P11-10**  
Sin **P11-00**, los demás tokens/layout quedan inconsistentes. **P11-09** y **P11-05** pueden estar fuera del MVP si se aceptan mocks.

---

## PARALELIZABLES (tras P11-02 cerrado)

| Tramo | Tickets en paralelo |
|-------|---------------------|
| Post P11-02 | P11-04 (detail) ∥ P11-07 (Cmd+K) |
| Post P11-03 | P11-05 (charts gap) ∥ P11-08 (AML) — front puede usar mocks |
| Post P11-04 | P11-09 (LLM) con contrato API paralelo |

---

## BLOCKED BY BACKEND

| Ticket | Bloqueo |
|--------|---------|
| P11-05 | Series funnel, heatmap, geo, scatter server-side |
| P11-06 | Tabla tenants + MRR si no existe agregado billing |
| P11-08 | Fuente AML consolidada |
| P11-09 | Endpoint narrativa / insights LLM |

---

## STANDALONE (bajo dependencia de tokens)

- **P11-07** puede avanzar en paralelo una vez **P11-02** tiene slots de comando.
- **P11-06** es opcional si el release es solo Credit Hub banco.

---

## Sugerencia de sprints

| Sprint | Objetivo | Tickets |
|--------|----------|---------|
| **S1 — Foundation** | Tokens + primitivas + shell | P11-00, P11-01, P11-02 |
| **S2 — Core product** | Dashboard + detalle | P11-03, P11-04, P11-07 |
| **S3 — Data-rich** | Charts gap + AML | P11-05, P11-08 (+ backend pairing) |
| **S4 — Intelligence** | LLM + QA release | P11-09, P11-10 (+ admin opcional P11-06) |

---

## Resultado FASE 5

**FASE 5 COMPLETA — Critical path: 5 tickets encadenados (P11-00→…→P11-03→P11-10)**; **paralelizables: P11-04, P11-07 tras P11-02; P11-05/P11-08 tras P11-03**; bloqueos backend en P11-05/06/08/09.

**Archivo:** `_design_p11_audit/05_DEPENDENCY_GRAPH.md`
