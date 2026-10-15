# Clientes (O2-P-CLIENTES)

Pantalla `/realtor/clientes` sobre el armazón DL10A; referencia visual `../DL10A/ref/clientes.png`.
- Cliente = contacto con rol de cliente vigente; los prospectos van en la pestaña Leads.
- Filtros: rol, origen, estado del lead. Ningún dato ni filtro de clase protegida (el idioma preferido tampoco filtra).
- Teléfono y correo siempre enmascarados en la ficha.
- Sin fuente conectada (fuera de DEMO): «Sin datos todavía», sin cifras. DEMO solo con `NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1"`.
- Pendiente: la lista real depende del contrato C-RE-CLIENTES del backend; hoy no hay llamada de datos (solo `/acceso`).

## Pasada de fidelidad DL10A (O2-F-CLIENTES) — Contactos unificado
- La pantalla es «Contactos» en la misma ruta: filtro de tipo Todos / Cliente / Lead / Propietario. Con «Propietario» cada fila enlaza a `/realtor/propietarios` (ruta no tocada).
- Propietario = contacto con rol de propietario (`arrendador`/`vendedor`, tipos de `lib/realtor/propietarios/types.ts`, solo lectura) más sus mandatos por propiedad.
- `docs/contracts/C-RE-OLA2/schema.json` no existe en este repo: no pude verificar el valor de rol del schema (landlord/seller). NECESITA_DECISION si difiere de «owner» de la Ola 3.
- Ficha con recorrido (operación, presupuesto, zona, consentimiento, propiedades compatibles) solo en DEMO. Medida visual: ver `UMBRAL.md`.
