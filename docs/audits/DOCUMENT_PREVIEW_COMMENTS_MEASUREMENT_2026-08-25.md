# Document preview API comments — runtime measurement

**Fecha:** 2026-08-25  
**Target:** `https://nadakki-ai-suite-staging.onrender.com`  
**SHA desplegado (`/health`):** `40b996f53b3fb8c408aeeab8ff4259f2ce73fca1`  
**OpenAPI de referencia citada por producto:** `71faf775` (incluye `/download` vía #1030)

## Qué se midió

| Ruta | Evidencia |
|---|---|
| `.../documents/{document_id}/download` | En OpenAPI staging. Con `Authorization: Bearer fake` → **401** `invalid_token` (no 404). |
| `.../documents/{doc_id}/thumbnail` | En OpenAPI. Bearer inválido → **401**. |
| `.../documents/{doc_id}/preview.json` | En OpenAPI (query `token` HMAC requerido). Bearer inválido → **401**. |

## Qué no se pudo medir

Login banker **NO_EJECUTADO**:

- Staging: `(ENOIDENTIFIER) no tenant identifier provided (external_id or sni_hostname required)` (varios `trace_id`, p.ej. `39ae7d635c664268`)
- `api.nadakki.com`: `password authentication failed for user "nadakki_svc"`
- `NADAKKI_STAGING_DSN`: `password authentication failed for user "postgres"`

Sin JWT de banker no se verificó:

1. Que `/download` devuelva el **archivo** (bytes + content-type), no solo un 200 vacío
2. Que `preview.json` autenticado responda **410** PREVIEW_DISABLED

El comentario de `preview.json` / HMAC se conserva con fecha + SHA por el contrato OpenAPI + el router desplegado (`PREVIEW_DISABLED` → 410 cuando el flag está off).

## Cambio en dashboard

Se borraron los comentarios que decían que `/download` no existe / 404 y que el analista no puede ver documentos. Eso ya no es cierto respecto al montaje de la ruta (#1030).
