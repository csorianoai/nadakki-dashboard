# Legal UI — E2E checklist (manual)

## Pre-requisitos

- [ ] Backend uvicorn en `:8010`
- [ ] Variables LLM según entorno (p. ej. `MOCK_LLM=false` en backend)
- [ ] Frontend `npm run dev` en `:3000`
- [ ] Tenant válido en sesión / selector

## Test 1: `/legal` Home

- [ ] Carga sin errores de consola
- [ ] 4 KPIs con datos reales o estados “No disponible” / error explícito
- [ ] Grid de agentes desde API
- [ ] Actividad reciente o empty state
- [ ] Salud del sistema desde `/api/legal/health`

## Test 2: `/legal/research`

- [ ] `chat_asesor_legal` responde con backend real
- [ ] Sidebar citas / RAG / monitor / audit
- [ ] Disclaimer / revisión abogado cuando aplique
- [ ] Refresh: conversación persiste (`sessionStorage` por tenant)
- [ ] Agente distinto: banner Worker M
- [ ] Aviso piloto / trazabilidad visible

## Test 3: `/legal/audit`

- [ ] Tabla con entradas reales
- [ ] Filtros y paginación
- [ ] Fila expandible
- [ ] CSV UTF-8 BOM, columnas sin texto completo de input/respuesta

## Test 4: Regresión (otras secciones)

- [ ] `/marketing`
- [ ] `/credit`
- [ ] `/google-ads` o ruta equivalente del proyecto
- [ ] `/admin` si existe
- [ ] Sidebar: todas las secciones visibles

## Fallos conocidos

- Timeout LLM → UI 504 / mensaje acorde
- Sin knowledge pack → KPIs degradados
- Sin `tenant_id` → error tras ventana de hidratación
