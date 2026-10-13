# Marketing AI (O2-P-MARKETING-AI)

Pantalla `/realtor/marketing-ai` sobre el armazón DL10A; referencia visual `../DL10A/ref/marketing-ai.png` (copia de `marketing_ai.png`, nav-4).
- Puerta de solo lectura al core de Marketing: enlaza a campañas, plantillas/contenido, publicaciones y conexiones sociales. No ejecuta agentes ni publica.
- Fuera de DEMO: «Sin datos todavía», sin cifras ni resúmenes. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"` (resúmenes SYNTH en `lib/realtor/marketing-ai/demo.ts`).
- Fair Housing: ningún filtro ni dato de clase protegida.
- Pendiente: los resúmenes reales (`/api/marketing/campaigns`, `/api/marketing/templates`, `/api/marketing/posts/recent`, `/api/social/connections`) no se leen aún; hoy la única llamada es `/acceso`.
- El centro se declara vivo en `lib/realtor/marketing-ai/center.ts`.
