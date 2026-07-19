# HN-03 — Auditoría i18n Legal (lista completa)

**Convención:** `messages/es/legal-cases.json` + `lib/legal/presentation-labels.ts`  
**Fecha:** 2026-07-19

## Hallazgos Founder QA (5 confirmados) — corregidos

| String inglés (antes) | Ubicación | Traducción (después) |
|-----------------------|-----------|----------------------|
| Add Actor | Acciones expediente (`display_name` backend) | Agregar parte (`action_labels.add_actor`) |
| CLOSED / TRIAGE | Transiciones de estado | Cerrado / Análisis automático (`states.*`) |
| Audit Trail | `/legal/audit` título | Trazabilidad de auditoría (`audit.title`) |
| audit_chain_verification | Botón auditoría | Verificar cadena del expediente |
| snapshots/verify (fallback) | Botón auditoría | Verificar cadena de versiones |
| UNKNOWN | Badge pack config | DESCONOCIDO (`pack_status.unknown`) |
| VERIFIED | Badge pack (cuando aplique) | VERIFICADO (`pack_status.verified`) |

## Strings adicionales detectados en grep — corregidos

| String inglés (antes) | Ubicación | Traducción (después) |
|-----------------------|-----------|----------------------|
| Docs | Resumen expediente header | Documentos (`overview.docs_count`) |
| Diff vs anterior | Snapshots lista | Comparar con versión anterior |
| Pack hash | Research trazabilidad + home | Hash del pack |
| Domain filter | Research trazabilidad RAG | Filtro de dominio |
| Query hash | Research trazabilidad RAG | Hash de consulta |
| RAG latency | Research trazabilidad RAG | Latencia RAG |
| Legal Intelligence Core | Home legal dashboard | Núcleo Legal Inteligente |
| Knowledge Pack | Home legal KPI | Pack normativo |
| audit trail (texto) | Home legal links/subtítulos | trazabilidad de auditoría |
| success / error / timeout | Filtros audit trail | éxito / error / tiempo agotado |
| low / medium / high | Filtros riesgo audit | bajo / medio / alto |
| Timestamp | Columna tabla audit | Fecha y hora |
| ISO 27001 ready | Badge audit | Preparado ISO 27001 |
| Queries (filtradas) | Métrica audit | Consultas (filtradas) |
| {role} / {actor_kind} raw | Panel partes | Etiquetas ES vía `wizard.roles` / `actor_kind` |

## Intencionalmente en inglés (badges de producto / API)

| String | Razón |
|--------|--------|
| MOCK / DEMO / DRAFT — NO CERTIFICADO | Badges de honestidad visual spec v1.0 |
| RAG (sigla) | Sigla técnica aceptada en dominio legal-tech |
| request_id | Identificador técnico de auditoría |

## Verificación

```bash
rg 'Add Actor|Audit Trail|UNKNOWN|/legal/guide' components/legal app/\(forge\)/legal
npm run build
```
