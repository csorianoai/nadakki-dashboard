# Mi día (O2-P-MIDIA)

Pantalla `/realtor/mi-dia` sobre el armazón DL10A (RE-SHELL). Referencia: `docs/design/realtor/DL10A/ref/mi-dia.png`
(copia de `mi_dia.png`, centro 0 del prototipo).

- Interruptor `NEXT_PUBLIC_REALTOR_PANEL="1"`; sin 200 de `/api/v1/realestate/acceso` solo se ve el aviso (fail-closed).
- DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`: rotulado «DEMO · datos sintéticos», datos SYNTH en `lib/realtor/mi-dia/demo.ts`.
- Sin DEMO: «Sin datos todavía» y cada sección en NO_DISPONIBLE; nunca cifras ni 0 inventados.
- Secciones: leads sin primera respuesta, listings con requisitos bloqueantes, pendientes del broker desk (solo vista Broker).
- Fair Housing: la agenda ordena por espera y requisitos; ningún dato ni filtro de clase protegida.
- Alcance: la agenda aún no tiene fuente conectada; el centro queda vivo (`center.ts`) con datos NO_DISPONIBLE.
