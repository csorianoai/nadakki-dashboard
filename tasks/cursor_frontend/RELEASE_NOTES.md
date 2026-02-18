# Frontend Release Notes

## Production readiness (Deploy + Env + Smoke)

### Environment variables (Vercel)

Configure in Vercel → Project → Settings → Environment Variables:

| Variable | Value | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://nadakki-ai-suite.onrender.com` | Yes |
| `NEXT_PUBLIC_DEV_ROLE` | `user` (optional, for X-Role header) | No |

### Verified routes

- `/agents/execute` — Ejecutar agentes con tenant switch + LIVE toggle + Dynamic Catalog
- `/audit` — Audit logs por tenant (fallback graceful si backend no disponible)

### Build proof

```bash
cd C:\Users\cesar\Projects\nadakki-dashboard
npm run build
# ✓ Compiled successfully
# 133 rutas generadas, incluyendo /agents/execute y /audit
```

### Smoke tests (post-deploy)

1. **/agents/execute**
   - Carga lista de agentes (Dynamic Catalog: ON si API responde, OFF si fallback)
   - Selector de tenant persiste en `localStorage` (`nadakki_tenant_id`)
   - Ejecutar agente en DRY_RUN devuelve resultado o error controlado

2. **/audit**
   - Carga logs o mensaje "No logs yet for this tenant." / "Backend no disponible"
   - Selector de tenant + Refresh funcionan

### Changes applied (F1–F4)

- **F1** API URL: fallback `https://nadakki-ai-suite.onrender.com`, header `X-Tenant-ID`, optional `X-Role`, body con `dry_run`, `payload`, `tenant_id`
- **F2** Badge "Dynamic Catalog: ON/OFF (fallback)" en /agents/execute
- **F3** Audit: mensaje vacío "No logs yet for this tenant.", error graceful
- **F4** Build OK, rutas confirmadas, env vars documentados
