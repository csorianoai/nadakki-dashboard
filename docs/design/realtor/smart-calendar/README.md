# Smart Calendar (O2-P-SMART-CALENDAR)

Pantalla `/realtor/smart-calendar`, abierta desde el botón Smart Calendar de la barra del armazón DL10A.
DL10A no tiene pantalla propia para este botón: la referencia visual es la de Mi día (nav-0), `../DL10A/ref/smart-calendar.png` (copia de `mi_dia.png`).
- Calendario de citas y visitas de la semana (lunes–domingo); el único filtro es el tipo de evento. Ningún dato ni filtro de clase protegida.
- Sin backend de citas en la Ola 2: fuera de DEMO, «Sin datos todavía», sin cifras. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`.
- Hoy no hay llamada de datos, solo `/acceso`; el tenant nunca viaja desde el cliente.
