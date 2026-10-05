import { DCC_TOKEN_KEYS, DCC_TOKENS, type DccTokenKey } from "@/lib/dcc/tokens";

/**
 * Lamina de tokens (claro / oscuro) generada desde lib/dcc/tokens.ts. El fichero
 * docs/design/DCC_TOKENS_LAMINA.html es la salida de `laminaHtml()` y un test
 * comprueba que coinciden: el valor de un token se escribe en un solo sitio.
 */
export const USO_DE_TOKEN: Partial<Record<DccTokenKey, string>> = {
  "--dcc-canvas": "Lienzo del contenido",
  "--dcc-surface": "Tarjeta",
  "--dcc-surface-muted": "Panel interno, mosaico sin dato",
  "--dcc-border": "Borde casi imperceptible",
  "--dcc-border-strong": "Borde de controles",
  "--dcc-fg": "Títulos y texto principal (marino)",
  "--dcc-fg-muted": "Texto secundario",
  "--dcc-fg-subtle": "Etiquetas y metadatos",
  "--dcc-navy": "Marino: barra lateral",
  "--dcc-on-navy": "Texto sobre marino",
  "--dcc-on-navy-muted": "Texto secundario sobre marino",
  "--dcc-navy-2": "Superficie elevada sobre marino",
  "--dcc-action": "Botón principal (marino)",
  "--dcc-action-hover": "Botón principal · hover",
  "--dcc-on-action": "Texto del botón principal",
  "--dcc-gold": "Dorado: ítem activo, filo de tarjetas clave, acentos",
  "--dcc-gold-ink": "Dorado legible: cifras principales sobre claro",
  "--dcc-gold-bg": "Banda dorada",
  "--dcc-on-gold": "Texto sobre dorado",
  "--dcc-teal": "Turquesa: iconos de sección, “En vivo”",
  "--dcc-teal-ink": "Turquesa legible: enlaces y acciones secundarias",
  "--dcc-teal-bg": "Fondo turquesa suave",
  "--dcc-ok-fg": "Sello verificado",
  "--dcc-partial-fg": "Sello parcial (ámbar anaranjado)",
  "--dcc-blocked-fg": "Sello bloqueado",
  "--dcc-error-fg": "Riesgo / error",
};

const COLOR = /^(#|rgba?\()/;

function celda(valor: string): string {
  const muestra = COLOR.test(valor)
    ? `<span class="m" style="background:${valor}"></span>`
    : "";
  return `<td>${muestra}<code>${valor}</code></td>`;
}

export function laminaHtml(): string {
  const filas = DCC_TOKEN_KEYS.map(
    (k) =>
      `<tr><td><code>${k}</code></td><td>${USO_DE_TOKEN[k] ?? ""}</td>${celda(DCC_TOKENS.light[k])}${celda(DCC_TOKENS.dark[k])}</tr>`,
  );
  return [
    "<!doctype html>",
    '<html lang="es"><head><meta charset="utf-8"><title>Tokens DCC</title>',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<style>body{font:14px system-ui,sans-serif;background:#F5F7FA;color:#0B1220;margin:24px}",
    "table{border-collapse:collapse;background:#fff;width:100%}td,th{border-bottom:1px solid #E6EAF0;padding:6px 10px;text-align:left;vertical-align:middle}",
    ".m{display:inline-block;width:22px;height:16px;border:1px solid #D5DCE5;border-radius:4px;margin-right:8px;vertical-align:middle}</style>",
    "</head><body>",
    "<h1>Tokens · Dealer Command Center</h1>",
    "<p>Generada desde <code>lib/dcc/tokens.ts</code> por <code>laminaHtml()</code>. No editar a mano.</p>",
    "<table><thead><tr><th>Token</th><th>Uso</th><th>Claro (principal)</th><th>Oscuro (alternativa)</th></tr></thead><tbody>",
    ...filas,
    "</tbody></table></body></html>",
    "",
  ].join("\n");
}
