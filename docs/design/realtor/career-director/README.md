# Career Director (O2-P-CAREER-DIRECTOR)

Pantalla `/realtor/career-director` sobre el armazón DL10A. DL10A no tiene pantalla propia: solo el bloque «Career Director · guía»
de la barra. La referencia visual es Mi oficina (nav-11), `../DL10A/ref/career-director.png`.

- Contenido: licencia y vencimiento, supervisión y metas.
- Métricas sin fuente hoy (`source: false` en `lib/realtor/career-director/demo.ts`): se muestran `NO_DISPONIBLE`, también en DEMO.
  `RE_METRIC_REGISTRY` no existe en este repo; la lista local es provisional hasta que exista.
- DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`; fuera de DEMO, «Sin datos todavía» sin cifras.
- Fail-closed: sin `NEXT_PUBLIC_REALTOR_PANEL="1"` y sin 200 de `/api/v1/realestate/acceso` no se pinta nada. El tenant sale del token.
- Fair Housing: sin filtros ni datos de clase protegida; el idioma preferido no filtra.
