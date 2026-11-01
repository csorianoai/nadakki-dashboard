/**
 * @jest-environment node
 *
 * G2, re-auditoria externa (vuelta 1): los argumentos de red de Chromium NO limitan a lo que corre en Node. Un spec con el
 * fixture `request` (APIRequestContext, corre en el Node de Playwright) y una URL absoluta llega a un backend real; page.route
 * y context.route no lo interceptan. Tampoco `next start` (fetch del lado servidor, p. ej. el proxy app/api/v2/[[...path]]).
 *
 * Via elegida: un guard en proceso (e2e/fase1/_solo-loopback.cjs) que solo deja conectar a 127.0.0.1, ::1 y localhost, y que
 * se hereda por NODE_OPTIONS. Aqui se reproduce el escenario con un «upstream» en 127.0.0.2 (loopback, pero NO 127.0.0.1): sin
 * guard se alcanza, con guard no. 127.0.0.2 existe en cualquier Linux sin configurar nada.
 */
import { execFile } from "child_process";
import fs from "fs";
import http from "http";
import net from "net";
import os from "os";
import path from "path";

const RAIZ = path.resolve(__dirname, "../..");
const GUARD = path.join(RAIZ, "e2e/fase1/_solo-loopback.cjs");
const T = 120_000;

type Salida = { code: number; out: string };
function correr(cmd: string, args: string[], env: NodeJS.ProcessEnv = {}, cwd = RAIZ): Promise<Salida> {
  const limpio: NodeJS.ProcessEnv = { ...process.env, ...env };
  for (const k of ["PLAYWRIGHT_BASE_URL", "BASE_URL", "NODE_OPTIONS"]) if (!(k in env)) delete limpio[k];
  // Playwright se niega a correr si ve variables de Jest en el entorno
  for (const k of Object.keys(limpio)) if (k.startsWith("JEST_")) delete limpio[k];
  delete limpio.NODE_ENV;
  return new Promise((ok) => {
    execFile(cmd, args, { cwd, env: limpio, timeout: 100_000 }, (err, stdout, stderr) =>
      ok({ code: err ? ((err as NodeJS.ErrnoException & { code?: number }).code as number) || 1 : 0, out: String(stdout) + String(stderr) }));
  });
}

async function servidor(host: string): Promise<{ port: number; hits: () => number; cerrar: () => Promise<void> }> {
  let n = 0;
  const srv = http.createServer((_q, r) => { n++; r.end("UPSTREAM_REACHED"); });
  await new Promise<void>((ok) => srv.listen(0, host, ok));
  return { port: (srv.address() as net.AddressInfo).port, hits: () => n, cerrar: () => new Promise((ok) => srv.close(() => ok())) };
}

const nodeConGuard = (codigo: string, host: string, port: number, guard = true) =>
  correr(process.execPath, ["-e", codigo], { H: host, P: String(port), ...(guard ? { NODE_OPTIONS: `--require=${GUARD}` } : {}) });

const ESCENARIOS: Record<string, string> = {
  "net.connect": `const s=require("net").connect(+process.env.P,process.env.H);s.on("connect",()=>{console.log("REACHED");s.destroy()});s.on("error",e=>console.log("ERR "+e.code))`,
  "http.get": `require("http").get({host:process.env.H,port:+process.env.P},r=>{console.log("REACHED");r.resume()}).on("error",e=>console.log("ERR "+e.code))`,
  "fetch (undici)": `fetch("http://"+process.env.H+":"+process.env.P+"/").then(()=>console.log("REACHED"),e=>console.log("ERR "+((e.cause&&e.cause.code)||e.code)))`,
  "https.request": `require("https").request({host:process.env.H,port:+process.env.P,rejectUnauthorized:false},()=>console.log("REACHED")).on("error",e=>console.log("ERR "+e.code)).end()`,
};

describe("guard de red e2e/fase1/_solo-loopback.cjs", () => {
  test("el fichero existe", () => {
    expect(fs.existsSync(GUARD)).toBe(true);
  });

  for (const [nombre, codigo] of Object.entries(ESCENARIOS)) {
    test(`${nombre}: sin guard llega a 127.0.0.2 (control); con guard se bloquea`, async () => {
      const up = await servidor("127.0.0.2");
      try {
        const control = await nodeConGuard(codigo, "127.0.0.2", up.port, false);
        if (nombre !== "https.request") expect(control.out).toContain("REACHED");
        const antes = up.hits();
        const guardado = await nodeConGuard(codigo, "127.0.0.2", up.port, true);
        expect(guardado.out).toContain("ERR ERR_EGRESS_BLOCKED");
        expect(guardado.out).not.toContain("REACHED");
        expect(up.hits()).toBe(antes);
      } finally {
        await up.cerrar();
      }
    }, T);
  }

  test("bloquea un host por nombre antes de resolverlo (dns.lookup y la ruta de http)", async () => {
    const r = await correr(process.execPath, ["-e",
      `require("dns").lookup("example.com",e=>console.log("DNS "+(e&&e.code)));require("http").get("http://example.com/").on("error",e=>console.log("HTTP "+e.code))`],
      { NODE_OPTIONS: `--require=${GUARD}` });
    expect(r.out).toContain("DNS ERR_EGRESS_BLOCKED");
    expect(r.out).toContain("HTTP ERR_EGRESS_BLOCKED");
  }, T);

  test("bloquea UDP a un host que no es 127.0.0.1 (dgram)", async () => {
    const r = await correr(process.execPath, ["-e",
      `const s=require("dgram").createSocket("udp4");try{s.send("x",9,"127.0.0.2",e=>{console.log("SEND "+(e&&e.code));s.close()})}catch(e){console.log("THROW "+e.code);s.close()}`],
      { NODE_OPTIONS: `--require=${GUARD}` });
    expect(r.out).toMatch(/(SEND|THROW) ERR_EGRESS_BLOCKED/);
  }, T);

  test("un hijo de Node lanzado desde un proceso guardado hereda el guard", async () => {
    const up = await servidor("127.0.0.2");
    try {
      const hijo = ESCENARIOS["net.connect"].replace(/"/g, '\\"');
      const r = await nodeConGuard(`require("child_process").spawn(process.execPath,["-e","${hijo}"],{stdio:"inherit"})`, "127.0.0.2", up.port);
      expect(r.out).toContain("ERR ERR_EGRESS_BLOCKED");
      expect(up.hits()).toBe(0);
    } finally {
      await up.cerrar();
    }
  }, T);

  test("cargado solo con require() (como hace la config), el guard se propaga a los hijos de Node por NODE_OPTIONS", async () => {
    const up = await servidor("127.0.0.2");
    try {
      const hijo = ESCENARIOS["net.connect"].replace(/"/g, '\\"');
      const codigo = `require(${JSON.stringify(GUARD)});require("child_process").spawn(process.execPath,["-e","${hijo}"],{stdio:"inherit"})`;
      const r = await correr(process.execPath, ["-e", codigo], { H: "127.0.0.2", P: String(up.port) });   // sin NODE_OPTIONS en el padre
      expect(r.out).toContain("ERR ERR_EGRESS_BLOCKED");
      expect(up.hits()).toBe(0);
    } finally {
      await up.cerrar();
    }
  }, T);

  test("NO sobre-bloquea: 127.0.0.1, localhost, ::1 y un socket unix siguen funcionando", async () => {
    const lo = await servidor("127.0.0.1");
    const sock = path.join(os.tmpdir(), `solo-loopback-${process.pid}.sock`);
    try { fs.unlinkSync(sock); } catch { /* no existia */ }
    const unix = net.createServer((c) => { c.on("error", () => undefined); c.end("x"); });
    await new Promise<void>((ok) => unix.listen(sock, ok));
    try {
      for (const h of ["127.0.0.1", "localhost"]) {
        const r = await nodeConGuard(ESCENARIOS["net.connect"], h, lo.port);
        expect(r.out).toContain("REACHED");
      }
      const u = await correr(process.execPath, ["-e", `const s=require("net").connect(process.env.S);s.on("connect",()=>{console.log("REACHED");s.destroy()});s.on("error",e=>console.log("ERR "+e.code))`],
        { S: sock, NODE_OPTIONS: `--require=${GUARD}` });
      expect(u.out).toContain("REACHED");
      // net trata {path, host} como socket unix y descarta host: el guard no debe bloquearlo por el host
      const ph = await correr(process.execPath, ["-e", `const s=require("net").connect({path:process.env.S,host:"example.invalid"});s.on("connect",()=>{console.log("REACHED");s.destroy()});s.on("error",e=>console.log("ERR "+e.code))`],
        { S: sock, NODE_OPTIONS: `--require=${GUARD}` });
      expect(ph.out).toContain("REACHED");
    } finally {
      await lo.cerrar();
      await new Promise<void>((ok) => unix.close(() => ok()));
      try { fs.unlinkSync(sock); } catch { /* ya no esta */ }
    }
  }, T);
});

describe("el escenario del CHANGE_REQUEST: fixture request de Playwright con URL absoluta", () => {
  const SPEC = `import { test, expect } from "@playwright/test";
test("request a un upstream que no es 127.0.0.1", async ({ request }) => {
  const r = await request.get(process.env.UPSTREAM_URL!);
  expect(await r.text()).toBe("UPSTREAM_REACHED");
});
`;

  async function playwright(configGuardada: boolean, upstreamUrl: string): Promise<Salida & { dir: string }> {
    const dir = fs.mkdtempSync(path.join(RAIZ, "test-results-red-"));
    fs.writeFileSync(path.join(dir, "req.spec.ts"), SPEC);
    const cfg = configGuardada
      ? `import { defineConfig } from "@playwright/test";
import base from ${JSON.stringify(path.join(RAIZ, "playwright.config.fase1"))};
export default defineConfig({ ...base, testDir: __dirname, webServer: undefined, projects: [{ name: "api" }], use: {}, reporter: "line" });
`
      : `import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: __dirname, projects: [{ name: "api" }], reporter: "line", retries: 0 });
`;
    fs.writeFileSync(path.join(dir, "playwright.config.ts"), cfg);
    const r = await correr("npx", ["playwright", "test", "-c", path.join(dir, "playwright.config.ts")], { CI: "1", UPSTREAM_URL: upstreamUrl });
    return { ...r, dir };
  }

  test("CONTROL sin guard: el request llega al upstream (UPSTREAM_REACHED); con la config de la puerta no llega", async () => {
    const up = await servidor("127.0.0.2");
    const url = `http://127.0.0.2:${up.port}/ping`;
    const limpiar: string[] = [];
    try {
      const control = await playwright(false, url);
      limpiar.push(control.dir);
      expect(control.out).toContain("1 passed");
      expect(up.hits()).toBe(1);                         // el upstream recibio la peticion: el escenario es real

      const guardado = await playwright(true, url);
      limpiar.push(guardado.dir);
      expect(guardado.code).not.toBe(0);
      expect(guardado.out).toMatch(/EGRESS_BLOCKED/);
      expect(up.hits()).toBe(1);                         // no subio: el segundo request no llego
    } finally {
      await up.cerrar();
      for (const d of limpiar) fs.rmSync(d, { recursive: true, force: true });
    }
  }, 200_000);
});

describe("specs de e2e/fase1: sin URLs absolutas que no sean locales", () => {
  const PERMITIDOS = new Set(["127.0.0.1", "localhost", "backend.invalid"]);

  function ficheros(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return ficheros(p);
      return /\.(ts|tsx|js|mjs)$/.test(e.name) && !e.name.startsWith("_") ? [p] : [];
    });
  }

  test("ningun spec escribe una URL absoluta a un host fuera de 127.0.0.1, localhost y backend.invalid", () => {
    const malos: string[] = [];
    for (const f of ficheros(path.join(RAIZ, "e2e/fase1"))) {
      const texto = fs.readFileSync(f, "utf8");
      for (const m of texto.matchAll(/\b(?:https?|wss?):\/\/([A-Za-z0-9.\-[\]:]+)/g)) {
        const host = m[1].replace(/:\d+$/, "");
        if (!PERMITIDOS.has(host)) malos.push(`${path.relative(RAIZ, f)}: ${m[0]}`);
      }
    }
    expect(malos).toEqual([]);
  });

  test("el detector muerde: una URL real se detectaria", () => {
    const re = /\b(?:https?|wss?):\/\/([A-Za-z0-9.\-[\]:]+)/g;
    const hosts = [..."await request.get('https://api.nadakki.com/x'); fetch('http://127.0.0.1:3310/')".matchAll(re)].map((m) => m[1]);
    expect(hosts.filter((h) => !PERMITIDOS.has(h.replace(/:\d+$/, "")))).toEqual(["api.nadakki.com"]);
  });
});
