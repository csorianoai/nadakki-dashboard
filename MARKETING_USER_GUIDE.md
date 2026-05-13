# Guía de usuario — Marketing Core (NADAKKI)

Documento de referencia (audit Cowork). La experiencia interactiva principal vive en **`/marketing/onboarding`** en el portal.

## Contenido

1. **Bienvenida** — Qué es el Marketing Core y el orden recomendado.
2. **Configuración en 5 minutos** — Conectores + objetivos mínimos.
3. **Conectar cuentas** — Google, Meta, LinkedIn, TikTok (OAuth).
4. **Primera campaña** — Estructura, medición, presupuesto de aprendizaje.
5. **Casos de uso**
   - **Nadakki Excursions** — Turismo, estacionalidad, remarketing.
   - **CrediCefi** — Crédito responsable, compliance, disclaimers.
6. **Catálogo de agentes** — Estrategia, creatividad, operación y pacing.
7. **Workflows** — Plantillas, aprobaciones, automatización segura.
8. **Troubleshooting** — Tokens OAuth, pixel/conversiones, permisos Business Manager.

## Persistencia

- **Portal:** `localStorage` bajo clave versionada por tenant (`marketing_core_v1`).
- **Suite:** cuando exista el endpoint `PUT /api/v1/tenants/{id}/onboarding/marketing-core`, el portal reintentará sincronizar el progreso con la tabla de estado de onboarding del tenant.

## Enlaces rápidos en el producto

| Tema            | Ruta                          |
|-----------------|-------------------------------|
| Onboarding UI   | `/marketing/onboarding`       |
| Conexiones      | `/marketing/social-connections` |
| Campañas        | `/marketing/campaigns/new`    |
| Agentes         | `/marketing/agents`           |
| Workflows       | `/workflows`                  |
| Ajustes         | `/settings`                   |

## Soporte

Para bloqueos de compliance o permisos en Meta/Google, abrir ticket con capturas del Business Manager y del error en consola de redes.
