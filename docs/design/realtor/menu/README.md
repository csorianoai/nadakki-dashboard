# Menú de Real Estate (barra lateral de Realtor OS)

Menú aprobado por César el 2026-10-14. Sustituye al anterior (grupos DL10A, con «Más»/«Próximamente»).
Fuente única: `REALTOR_MENU` en `lib/realtor/menu.ts`, compuesto desde `REALTOR_CENTERS` (`lib/realtor/centers.ts`).

## Estructura

Bloques fijos arriba, sin cambios: **Career Director · guía** y **Smart Calendar**. Después, cuatro grupos (ninguno «Próximamente»):

| Grupo | Entradas |
|---|---|
| Hoy | Mi día (`/realtor/mi-dia`) · Bandeja del broker (solo rol `broker_supervisor`) |
| Clientes | Contactos (`/realtor/clientes`) · Conversaciones (Pronto) · Propiedades (`/realtor/propiedades`) |
| Negocios | Operaciones (`/realtor/operaciones`, con la Finanzas dentro) · Documentos (`/realtor/documentos`) |
| Crecer | Marketing (`/realtor/marketing-ai`) · Mercado (`/realtor/demand-radar`) · Resultados (`/realtor/resultados`) · Academia (Pronto) |

- **Propiedades pasa a Clientes** (antes estaba en Cartera).
- **Mercado es Demand Radar** y **Marketing es Marketing AI**: solo cambia el rótulo; ids y rutas no cambian.
- **Contactos** es el listado unificado de clientes y propietarios con filtro de rol (lo construye O2-F-CLIENTES; absorbe al CRM).
  El propietario es un contacto con rol de propietario más `re_owner_mandates` (decisión D8).
- Finanzas va dentro de Operaciones (la sección la construye O2-F-OPERACIONES); ya no es fila.
- Mi oficina y CRM dejan de ser filas: Mi oficina se alcanza por Career Director y por `/realtor/alta`.
- **«Pronto»**: marca discreta (texto pequeño y apagado) de los centros aún no construidos; no tienen ruta. Al construirse pierden la marca y ganan `href` en su `center.ts`.

## Bandeja del broker

Solo se muestra si `GET /api/v1/realestate/acceso` responde 200 con `broker_supervisor` en `roles`
(`fetchPanelAccessInfo` / `useRealtorAccessInfo`, aditivos; `useRealtorAccess` y `fetchPanelAccessStatus` no cambian de firma).
Sin roles legibles: no se muestra (fail-closed). El selector simulado Agente/Broker de la barra superior no la concede.
En esta base no existe ruta de la bandeja (ni de Mi oficina): la entrada va sin `href` y con «Pronto». El tenant sale del token, nunca del cliente.

## Nada se pierde

Rutas vivas: `/realtor`, `mi-dia`, `clientes`, `propietarios`, `propiedades`, `marketing-ai`, `demand-radar`, `operaciones`,
`documentos`, `smart-calendar`, `career-director`, `alta`, `agente-web`, `resultados`. `OFF_MENU_ROUTES` (menu.ts) lista las que
no son fila, con su motivo; `tests/realtor/menu.test.tsx` exige que cada `app/realtor/**/page.tsx` esté en el menú o en esa lista.

## Cambios deliberados respecto a DL10A

Nombres de grupo (Hoy, Clientes, Negocios, Crecer), el orden y los rótulos Contactos/Marketing/Mercado difieren del prototipo por decisión de César.
La barra oscura de 288 px y los tokens `RT`/`FONT_DISPLAY`/`FONT_BODY` no cambian.
