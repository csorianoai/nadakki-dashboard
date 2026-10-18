# e2e/api — evidencia hermética del BFF

`bff-jwt.spec.ts` (PI-P0-2) no necesita despliegue, credenciales ni backend. `playwright.config.ts` arranca
`next start` (hay que haber hecho `next build` antes) con `NEXT_PUBLIC_RENDER_API_URL=http://backend.invalid` y
`NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true`, y fija `baseURL` local (puerto `BFF_JWT_PORT`, 3107 por defecto).

El spec no inicia sesión real: firma un JWT con un secreto efímero y dobla la inicialización de sesión
(`/auth/refresh`, `/auth/me`) con `page.route`. Comprueba que:

1. `/competitor-research` emite sus peticiones `/api/v1/spyfu/*` solo a su mismo origen local;
2. un JWT con la firma alterada, enviado al BFF, recibe 401/403 sin llegar a ningún backend.

```
NEXT_PUBLIC_RENDER_API_URL=http://backend.invalid NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED=true npm run build
npx playwright test --config e2e/api/playwright.config.ts e2e/api/bff-jwt.spec.ts
```

La prueba de que el BACKEND real responde 401 a una firma alterada se mide en el certificador de PI-CERT-1
(paso «firma_alterada», nivel production). La parte de reenvío de `Authorization` vive en
`tests/api/bff-spyfu-jwt-firma.test.ts`.
