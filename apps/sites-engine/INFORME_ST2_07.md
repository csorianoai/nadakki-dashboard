# ST2-07: datos de Baylara que el contrato (C-SITES-RENDER) no modela

Se reportan, no se inventan. Decision pendiente de producto/contrato (S1/S3):

- **Video del hero**: `PublicMedia` solo admite `image/(jpeg|png|webp|avif)`. La clase `.hero-video` existe en la hoja de estilos pero ningun bloque la emite.
- **Color de reserva del medio** (`Media.js:18`): `PublicMedia` no trae color dominante/placeholder.
- **GA4 / Google Ads por sitio** (`Analytics.js:6-7,29`): Baylara usa variables globales `NEXT_PUBLIC_*`; el manifiesto no trae identificadores de analitica por sitio, y un valor global mezclaria sitios.
- **`form_rendered_at` + temporizador `<noscript>`** (`LeadForm.js:143-148`): la CSP del motor (`script-src 'self'`, sin inline) impide fijarlo al pintar en el cliente; el HTML lo emite vacio y el tiempo minimo lo garantiza `handleLead` con la cookie firmada de host (ST2-05).
- **Home**: el contrato exige slug no vacio; la home usa la clave `home` en la raiz de cada idioma. Las claves de pagina deben ser `snake_case` (`not_sent`, no `notSent`).
- **Importacion de contenido real** de Baylara al core: pertenece a S1/S3; aqui solo `blocks.schema.json` y fixtures sinteticos.
