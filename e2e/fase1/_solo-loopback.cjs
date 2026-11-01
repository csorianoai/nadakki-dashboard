"use strict";
/**
 * Guard de red de la puerta de la fase 1 de marketing (G2): todo lo que corre en Node solo puede conectar a 127.0.0.1,
 * ::1 y localhost (y a sockets unix). Cubre lo que los argumentos de Chromium NO cubren: el fixture `request` de
 * Playwright (APIRequestContext, corre en el Node de los workers) y `next start` (fetch del lado servidor, p. ej. el proxy
 * app/api/v2/[[...path]]). Se instala en el proceso con require() y en sus hijos de Node por NODE_OPTIONS.
 *
 * Que NO cubre (aislamiento de red del SO si lo cubriria; aqui no hay Docker en ci-8g y unshare depende de AppArmor):
 * procesos que no son Node (un spec que lance `curl` con child_process), addons nativos y process.binding.
 *
 * Fail-closed: un destino que no se puede clasificar como local se bloquea. No resuelve nombres antes de decidir.
 */
const ID = "__nadakki_solo_loopback__";
if (!globalThis[ID]) {
  Object.defineProperty(globalThis, ID, { value: true });

  const net = require("node:net");
  const dns = require("node:dns");
  const dgram = require("node:dgram");

  const LOCAL = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]);
  const limpio = (h) => String(h).trim().toLowerCase().replace(/^\[|\]$/g, "");
  const permitido = (host) => host === undefined || host === null || host === "" || LOCAL.has(limpio(host));
  const bloqueo = (host) => {
    const e = new Error(`EGRESS_BLOCKED: la puerta de la fase 1 solo admite 127.0.0.1 (intento: ${host})`);
    e.code = "ERR_EGRESS_BLOCKED";
    return e;
  };

  // Los hijos de Node (next start, workers, forks) heredan el guard.
  const propio = `--require=${__filename}`;
  const actual = process.env.NODE_OPTIONS || "";
  if (!actual.includes(propio)) process.env.NODE_OPTIONS = `${propio} ${actual}`.trim();

  // net.Socket.prototype.connect: lo usan net, http, https, http2, tls, undici (fetch) y ws.
  // net.connect() llama a connect([opciones, cb]) con los argumentos YA normalizados en un array marcado con un simbolo:
  // hay que mirar dentro del array, o toda conexion creada por net.connect/http/fetch pasaria sin clasificar.
  const destino = (args) => {
    const a = Array.isArray(args[0]) ? args[0][0] : args[0];
    if (a !== null && typeof a === "object") return { path: a.path, host: a.host };
    if (typeof a === "string" && !/^\d+$/.test(a)) return { path: a };
    return { host: typeof args[1] === "string" ? args[1] : undefined };
  };
  const connect = net.Socket.prototype.connect;
  net.Socket.prototype.connect = function (...args) {
    const d = destino(args);
    // Como net: solo un `path` con texto es un socket unix. http.Agent manda `path: null` en conexiones TCP, y tomar
    // «path definido» por «socket unix» deja pasar cualquier http.get (hallado al probar el canario).
    const ipc = typeof d.path === "string" && d.path !== "";
    if (!ipc && !permitido(d.host)) {
      const err = bloqueo(d.host);
      process.nextTick(() => this.destroy(err));
      return this;
    }
    return connect.apply(this, args);
  };

  // DNS: ni siquiera se pregunta por un nombre que no sea local (tambien corta la exfiltracion por consultas).
  const envolver = (obj, nombre) => {
    const f = obj[nombre];
    if (typeof f !== "function") return;
    obj[nombre] = function (host, ...resto) {
      if (!permitido(host)) {
        const err = bloqueo(host);
        const cb = resto.find((x) => typeof x === "function");
        if (cb) { process.nextTick(cb, err); return undefined; }
        throw err;
      }
      return f.call(this, host, ...resto);
    };
  };
  const envolverPromesa = (obj, nombre) => {
    const f = obj[nombre];
    if (typeof f !== "function") return;
    obj[nombre] = async function (host, ...resto) {
      if (!permitido(host)) throw bloqueo(host);
      return f.call(this, host, ...resto);
    };
  };
  for (const n of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "resolveCname", "resolveMx", "resolveNs",
    "resolveSrv", "resolveTxt", "resolvePtr", "resolveNaptr", "resolveSoa", "reverse"]) {
    envolver(dns, n);
    if (dns.promises) envolverPromesa(dns.promises, n);
  }

  // UDP: send() y connect() con una direccion que no sea local.
  const direccion = (args) => args.find((x) => typeof x === "string" && !/^\d+$/.test(x));
  for (const n of ["send", "connect"]) {
    const f = dgram.Socket.prototype[n];
    if (typeof f !== "function") continue;
    dgram.Socket.prototype[n] = function (...args) {
      const dir = n === "send" ? args.slice(1).find((x) => typeof x === "string" && !/^\d+$/.test(x)) : direccion(args);
      if (dir !== undefined && !permitido(dir)) {
        const err = bloqueo(dir);
        const cb = args.find((x) => typeof x === "function");
        if (cb) { process.nextTick(cb, err); return undefined; }
        throw err;
      }
      return f.apply(this, args);
    };
  }
}

module.exports = { instalado: true };
