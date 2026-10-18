# e2e/api — evidencia contra un despliegue

`bff-jwt.spec.ts` (PI-P0-2) no levanta servidor: prueba un despliegue real. Para que imprima
`RESULT_PI_P0_2=PASS` el job que lo ejecuta necesita TODO esto:

| Requisito | Detalle |
|---|---|
| `BASE_URL` (o `PLAYWRIGHT_BASE_URL`) | Despliegue del dashboard construido con `NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true` |
| `QA_USER` / `QA_PASSWORD` | Usuario del tenant QA (nunca usuarios reales) |
| Backend alcanzable | El despliegue debe poder llegar al backend, que es quien verifica la firma y responde 401 |

Sin alguna de estas piezas el spec falla nombrando la que falta. Un runner con solo PostgreSQL
efímero no puede dar PASS: ningún cambio de código lo arregla.

```
BASE_URL=... QA_USER=... QA_PASSWORD=... \
npx playwright test --config e2e/api/playwright.config.ts e2e/api/bff-jwt.spec.ts
```

La parte hermética (el BFF reenvía `Authorization` alterado y devuelve el 401 del backend) vive en
`tests/api/bff-spyfu-jwt-firma.test.ts` y corre en CI normal.
