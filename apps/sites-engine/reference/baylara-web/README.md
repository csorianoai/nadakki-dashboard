# baylara-web

Sitio de BAYLARA (baylara.com) — Next.js 16, páginas estáticas, español e inglés.

## Reglas del proyecto

- **Nunca** desplegar a producción ni conectar baylara.com sin aprobación explícita de César.
- `vercel.json` desactiva los despliegues de la rama `main`. Se trabaja en `develop` (y ramas de función): cada push genera una vista previa protegida.
- El build de producción **falla** mientras falten datos obligatorios (`scripts/check-compliance.mjs`).
- Los textos describen propiedades, nunca al comprador o inquilino ideal. Si falta un dato, la sección se oculta; no se inventa.

## Dónde está cada cosa

| Qué | Archivo |
|---|---|
| Datos del agente, correduría, teléfonos, testimonios | `content/site.json` |
| Textos de interfaz (ES/EN) | `content/ui.json` |
| Textos de cada página | `content/pages/*.json` |
| Propiedades (se reemplaza por el feed IDX) | `content/listings.json` |
| Zonas y precios de referencia | `content/zones.json` |
| Privacidad y términos | `content/legal/*.json` |
| Guías e informes de mercado | `content/guides/*.json` (ver README de la carpeta) |
| Rutas en cada idioma | `lib/routes.js` |
| Formularios → email | `app/api/lead/route.js` |
| Medición (Google tag) | `components/Analytics.js`, `components/track.js` |

## Variables de entorno

Ver `.env.example`. En Vercel: Project Settings → Environment Variables (marcar Preview y, cuando se apruebe, Production).

- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL` — envío de formularios. Sin ellas el formulario responde 503.
- `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GADS_ID`, `NEXT_PUBLIC_GADS_LEAD_LABEL`, `NEXT_PUBLIC_GADS_WHATSAPP_LABEL`, `NEXT_PUBLIC_GADS_CALL_LABEL` — opcionales.

Eventos: `generate_lead` (con `lead_intent`: buyer / seller / tenant) + conversión de Ads; `click_whatsapp` y `click_call` + conversiones secundarias.

## Desarrollo

```
npm install
npm run dev        # http://localhost:3000 → redirige a /es o /en
npm run check      # muestra los datos pendientes
npm run build
```

## Conectar el feed IDX

Reemplazar la lectura de `content/listings.json` en `lib/content.js` (`getListings`) por el feed, devolviendo los mismos campos (`slug, kind, status, zone, type, price, beds, baths, sqft, title, description, features, photos, listingBrokerage, mlsNumber…`). Añadir los dominios de las fotos del MLS en `next.config.mjs` → `images.remotePatterns`. Aplicar las reglas de visualización del MLS.
