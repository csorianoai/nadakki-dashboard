# Smart Calendar (O2-P-SMART-CALENDAR)

Pantalla `/realtor/smart-calendar`, abierta desde el botón Smart Calendar de la barra del armazón DL10A.
DL10A no tiene pantalla propia para este botón: la referencia visual es la de Mi día (nav-0), `../DL10A/ref/smart-calendar.png` (copia de `mi_dia.png`).
- Calendario de citas y visitas de la semana (lunes–domingo); el único filtro es el tipo de evento. Ningún dato ni filtro de clase protegida.
- Sin backend de citas en la Ola 2: fuera de DEMO, «Sin datos todavía», sin cifras. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`.
- Hoy no hay llamada de datos, solo `/acceso`; el tenant nunca viaja desde el cliente.

## F2 · CALENDAR-V1 (ROP-UX-CALENDAR-V1)
- Navegación Anterior / Hoy / Siguiente: la semana elegida se pide con `fetchCalendarEvents(lunes)` y `fetchOpenVisits(lunes)` (mismo GET `from`/`to`/`limit`, contrato sin cambios). Rango con la locale del idioma (`week.ts`).
- Encabezado «Lun 26» por día; hoy con fondo RT.calloutBg, rótulo «Hoy» y `aria-current="date"`. Línea «Ahora HH:MM» (aria-hidden) antes del primer evento posterior a la hora actual.
- Tarjeta (`EventCard.tsx`): inicio–fin (`end` sale de `ends_at`), título a 2 líneas con `title=`, tipo con color y rótulo. El contrato solo trae `property_id`/`contact_id` (uuid): no se pinta línea de propiedad ni contacto.
- Acciones de visita en un menú «…» (`VisitActions.tsx`, teclado/Escape/clic fuera). Mover y «Programar visita» en un panel lateral modal (`Drawer.tsx`).
- No se reutilizan `components/ui/sheet.tsx` ni `components/ui/dropdown-menu.tsx` (Radix + Tailwind con estilo de cristal oscuro, portal, sin `aria-modal`, nunca usados en Realtor): el menú y el panel son locales y usan RT.
- Bordes de control `RT.control` (#6B7B89, 4,36:1; `lib/realtor/tokens.ts`), foco visible 3 px RT.teal. Semana con scroll propio (columnas ≥146 px) y lista vertical a ≤480 px.
- Fuera de F2 (F5): rejilla horaria por duración, vistas Día/Agenda, solapes en subcolumnas.
