# Marketing AI (O2-P-MARKETING-AI)

Pantalla `/realtor/marketing-ai` sobre el armazón DL10A; referencia visual `../DL10A/ref/marketing-ai.png` (copia de `marketing_ai.png`, nav-4).
- Puerta de solo lectura al core de Marketing: enlaza a campañas, plantillas/contenido, publicaciones y conexiones sociales. No ejecuta agentes ni publica.
- Fuera de DEMO: «Sin datos todavía», sin cifras ni resúmenes. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"` (resúmenes SYNTH en `lib/realtor/marketing-ai/demo.ts`).
- Fair Housing: ningún filtro ni dato de clase protegida.
- Fuera de DEMO lee `GET /api/v1/realestate/marketing-ai/summary` (C-RE-OLA3, congelado; `lib/realtor/marketing-ai/api.ts`, sin tenant en el cliente): conteos y gasto por tipo y moneda. 404/503, cuerpo inválido o sin datos → «Sin datos todavía». Campañas, sugerencias y el resto del contrato no se leen aún.
- El centro se declara vivo en `lib/realtor/marketing-ai/center.ts`.
