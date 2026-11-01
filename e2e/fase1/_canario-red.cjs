"use strict";
/**
 * Canario de red de la puerta de la fase 1 (G2). Corre en el job, con el Node del job, ANTES de Playwright, y comprueba
 * en esa maquina que el guard (_solo-loopback.cjs) hace lo que dice:
 *   0. control: sin guard, un hijo de Node SI llega a un upstream en 127.0.0.2 (si no, el canario no prueba nada);
 *   1. con guard, http.get y fetch a ese upstream se bloquean y el upstream no recibe nada;
 *   2. con guard, 127.0.0.1 sigue funcionando (el guard no sobre-bloquea).
 * 127.0.0.2 es loopback pero no 127.0.0.1: existe en cualquier Linux sin configurar nada. Sale con 1 si algo falla.
 */
const http = require("node:http");
const path = require("node:path");
const { execFile } = require("node:child_process");

const GUARD = path.join(__dirname, "_solo-loopback.cjs");
const CODIGO = `
const t = (n) => (e) => console.log(n + " " + ((e && (e.cause && e.cause.code || e.code)) || "OK"));
const u = "http://" + process.env.H + ":" + process.env.P + "/";
Promise.all([
  new Promise((ok) => http.get(u, (r) => { r.resume(); t("HTTP")(null); ok(); }).on("error", (e) => { t("HTTP")(e); ok(); })),
  fetch(u).then(() => t("FETCH")(null), t("FETCH")),
]);
const http = require("node:http");`.replace('const http = require("node:http");', "");

function abrir(host) {
  let n = 0;
  const srv = http.createServer((_q, r) => { n++; r.end("ok"); });
  return new Promise((ok) => srv.listen(0, host, () => ok({ srv, port: srv.address().port, hits: () => n })));
}

function hijo(host, port, conGuard) {
  const env = { ...process.env, H: host, P: String(port) };
  delete env.NODE_OPTIONS;
  if (conGuard) env.NODE_OPTIONS = `--require=${GUARD}`;
  const prefijo = 'const http = require("node:http");';
  return new Promise((ok) => {
    execFile(process.execPath, ["-e", prefijo + CODIGO], { env, timeout: 20000 }, (_e, out, err) => ok(String(out) + String(err)));
  });
}

(async () => {
  const ajeno = await abrir("127.0.0.2");
  const propio = await abrir("127.0.0.1");
  const fallos = [];
  try {
    const control = await hijo("127.0.0.2", ajeno.port, false);
    if (!/HTTP OK/.test(control) || !/FETCH OK/.test(control)) fallos.push(`control: sin guard no se llega al upstream (${control.trim()})`);
    const antes = ajeno.hits();
    const bloqueado = await hijo("127.0.0.2", ajeno.port, true);
    if (!/HTTP ERR_EGRESS_BLOCKED/.test(bloqueado) || !/FETCH ERR_EGRESS_BLOCKED/.test(bloqueado)) fallos.push(`con guard NO se bloquea 127.0.0.2: ${bloqueado.trim()}`);
    if (ajeno.hits() !== antes) fallos.push("el upstream recibio una peticion con el guard activo");
    const local = await hijo("127.0.0.1", propio.port, true);
    if (!/HTTP OK/.test(local) || !/FETCH OK/.test(local)) fallos.push(`con guard 127.0.0.1 deja de funcionar: ${local.trim()}`);
  } finally {
    ajeno.srv.close();
    propio.srv.close();
  }
  console.log(`canario de red: Node ${process.version}, ${fallos.length ? "FALLA" : "OK"}`);
  for (const f of fallos) console.log("  - " + f);
  process.exit(fallos.length ? 1 : 0);
})();
