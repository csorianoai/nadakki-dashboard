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
  // Un `lookup` propio decide la IP de un nombre sin pasar por dns.*: con host «localhost» el destino real es 127.0.0.2.
  "http.get con lookup propio": `require("http").get({host:"localhost",port:+process.env.P,lookup:(h,o,cb)=>o&&o.all?cb(null,[{address:"127.0.0.2",family:4}]):cb(null,"127.0.0.2",4)},r=>{console.log("REACHED");r.resume()}).on("error",e=>console.log("ERR "+e.code))`,
  "net.connect con lookup propio": `const s=require("net").connect({host:"localhost",port:+process.env.P,lookup:(h,o,cb)=>o&&o.all?cb(null,[{address:"127.0.0.2",family:4}]):cb(null,"127.0.0.2",4)});s.on("connect",()=>{console.log("REACHED");s.destroy()});s.on("error",e=>console.log("ERR "+e.code))`,
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

  test("dns.Resolver y dns.promises.Resolver no consultan nombres que no son locales", async () => {
    const r = await correr(process.execPath, ["-e",
      `const d=require("dns");new d.Resolver().resolve4("example.com",e=>console.log("CB "+(e&&e.code)));
new d.promises.Resolver().resolve4("example.com").then(()=>console.log("PR OK"),e=>console.log("PR "+e.code));
try{new d.Resolver().reverse("8.8.8.8",e=>console.log("REV "+(e&&e.code)))}catch(e){console.log("REV "+e.code)}`],
      { NODE_OPTIONS: `--require=${GUARD}` });
    expect(r.out).toContain("CB ERR_EGRESS_BLOCKED");
    expect(r.out).toContain("PR ERR_EGRESS_BLOCKED");
    expect(r.out).toContain("REV ERR_EGRESS_BLOCKED");
  }, T);

  test("un lookup propio con una IP local literal sigue funcionando (el guard no sobre-bloquea)", async () => {
    const lo = await servidor("127.0.0.1");
    try {
      const r = await nodeConGuard(`require("net").connect({host:"127.0.0.1",port:+process.env.P,lookup:(h,o,cb)=>cb(null,"127.0.0.1",4)}).on("connect",function(){console.log("REACHED");this.destroy()}).on("error",e=>console.log("ERR "+e.code))`, "127.0.0.1", lo.port);
      expect(r.out).toContain("REACHED");
    } finally {
      await lo.cerrar();
    }
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

// ── Barrera estatica contra procesos que no son Node (decision de Cesar, 2-nov) ────────────────────────────────────────
// El guard de red (_solo-loopback.cjs) solo ve codigo de Node. Un spec que lance `curl` con child_process arrancaria un
// proceso que NO lo carga y llegaria a un host externo. Riesgo residual ACEPTADO (B-14 de la adenda): el cierre total es
// aislamiento de red a nivel del SO en los runners ci-8g. Mientras tanto, esta barrera hace fallar a cualquier fichero de
// e2e/fase1/** y de tests/e2e/fase1-*.test.ts que cree procesos, hilos o enlaces nativos. Sin comentarios quitados a
// proposito: quitarlos con una regex dejaria pasar codigo detras de una URL («http://...»); es preferible un falso positivo.
type Hallazgo = string;

const PATRONES: Array<[Hallazgo, RegExp]> = [
  ["child_process", /\bchild_process\b/],
  ["worker_threads", /\bworker_threads\b/],
  ["process.binding", /\bprocess\s*(?:\.\s*binding\b|\[\s*["'`]binding["'`]\s*\])/],
  ["process.dlopen", /\bprocess\s*\.\s*dlopen\b/],
  ["exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)", /(?<![.\w$])(?:exec|execFile|execSync|execFileSync|spawn|spawnSync|fork)\s*\(/],
  ["execFile/execSync/execFileSync/spawn/spawnSync/fork (metodo)", /\.\s*(?:execFile|execSync|execFileSync|spawn|spawnSync|fork)\s*\(/],
  ["eval", /\beval\s*\(/],
  ["Function()", /\b(?:new\s+)?Function\s*\(/],
  // Solo se admite un literal COMPLETO como unico argumento: `require("a" + "b")`, `import("a" + x)` y plantillas con ${} fallan.
  ["require/import no literal", /\b(?:require|import)\s*\(\s*(?!\)|(?:"[^"\n\\]*"|'[^'\n\\]*'|`[^`$\n\\]*`)\s*[,)])/],
  // Un literal con escapes («child_pro\x63ess») esconde el nombre al patron de child_process.
  ["require/import con escapes", /\b(?:require|import)\s*\(\s*["'`][^"'`\n]*\\/],
  // cp["spawn"](...), cp["exec"+""](...): acceso por corchetes a los lanzadores.
  ["lanzador por corchetes", /\[\s*["'`](?:exec|execFile|execSync|execFileSync|spawn|spawnSync|fork)["'`]\s*\]\s*\(/],
  // `process` solo se usa como process.X; `process[...]` (salvo env), `const p = process`, `{ binding } = process` o pasarlo
  // como argumento permiten llegar a binding/dlopen con nombres calculados.
  ["process por corchetes (no env)", /\bprocess\s*\[(?!\s*["'`]env["'`]\s*\])/],
  ["process sin acceso directo", /(?<![.\w$"'`/-])process\b(?!\s*\.)(?!\s*\[)(?![\w$"'`-])/],
  ["executablePath", /\bexecutablePath\b/],
];

function detectar(texto: string): Hallazgo[] {
  return PATRONES.filter(([, re]) => re.test(texto)).map(([nombre]) => nombre);
}

// El canario NECESITA lanzar procesos de Node (el control sin guard y el hijo con guard). Unica excepcion, con limites.
const EXENTO = "e2e/fase1/_canario-red.cjs";
const PERMITIDO_AL_EXENTO = new Set(["child_process", "exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)"]);

function ficherosFase1(raiz: string = RAIZ): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(p);
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(e.name)) salida.push(path.relative(raiz, p).split(path.sep).join("/"));
    }
  };
  recorrer(path.join(raiz, "e2e/fase1"));
  const dirTests = path.join(raiz, "tests/e2e");
  if (fs.existsSync(dirTests)) {
    for (const n of fs.readdirSync(dirTests)) if (/^fase1-[^/]*\.test\.ts$/.test(n)) salida.push(`tests/e2e/${n}`);
  }
  return salida.sort();
}

describe("e2e/fase1: ningun fichero crea procesos, hilos ni enlaces nativos (riesgo residual B-14)", () => {
  test("ficheros de e2e/fase1/** y tests/e2e/fase1-*.test.ts, salvo el canario, sin ninguna construccion prohibida", () => {
    const malos: string[] = [];
    for (const f of ficherosFase1()) {
      if (f === EXENTO) continue;
      const h = detectar(fs.readFileSync(path.join(RAIZ, f), "utf8"));
      if (h.length) malos.push(`${f}: ${h.join(", ")}`);
    }
    expect(malos).toEqual([]);
  });

  test("el canario solo puede lanzar `process.execPath` con execFile: nada mas de la lista", () => {
    const texto = fs.readFileSync(path.join(RAIZ, EXENTO), "utf8");
    const extra = detectar(texto).filter((h) => !PERMITIDO_AL_EXENTO.has(h));
    expect(extra).toEqual([]);
    const llamadas = [...texto.matchAll(/(?<![.\w$])execFile\s*\(\s*([^,)]*)/g)].map((m) => m[1].trim());
    expect(llamadas.length).toBeGreaterThan(0);
    expect(llamadas.every((c) => c === "process.execPath")).toBe(true);
    expect(texto).not.toMatch(/["'`]curl["'`]|["'`]wget["'`]|["'`]sh["'`]|["'`]bash["'`]/);
  });

  test("el guard no menciona ni usa nada de la lista (tampoco en comentarios)", () => {
    expect(detectar(fs.readFileSync(path.join(RAIZ, "e2e/fase1/_solo-loopback.cjs"), "utf8"))).toEqual([]);
  });

  test("el escaner ve los ficheros de ambos sitios", () => {
    const f = ficherosFase1();
    expect(f).toContain("e2e/fase1/_solo-loopback.cjs");
    expect(f).toContain(EXENTO);
  });

  test("el escaner encuentra los specs de ambos sitios en una raiz de prueba (y solo esos)", () => {
    const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "fase1-escaner-"));
    try {
      for (const f of ["e2e/fase1/a.spec.ts", "e2e/fase1/sub/b.spec.ts", "e2e/fase1/_guard.cjs", "tests/e2e/fase1-centinela.test.ts",
        "tests/e2e/fase1-otro.test.ts", "tests/e2e/otra-cosa.test.ts", "tests/e2e/fase1/x.test.ts", "e2e/otra/z.spec.ts", "e2e/fase1/nota.md"]) {
        fs.mkdirSync(path.dirname(path.join(raiz, f)), { recursive: true });
        fs.writeFileSync(path.join(raiz, f), "x");
      }
      expect(ficherosFase1(raiz)).toEqual(["e2e/fase1/_guard.cjs", "e2e/fase1/a.spec.ts", "e2e/fase1/sub/b.spec.ts",
        "tests/e2e/fase1-centinela.test.ts", "tests/e2e/fase1-otro.test.ts"]);
    } finally {
      fs.rmSync(raiz, { recursive: true, force: true });
    }
  });

  test("el detector muerde: cada construccion prohibida se detecta", () => {
    const casos: Array<[string, string]> = [
      ['import { execSync } from "child_process";', "child_process"],
      ['const cp = require("node:child_process");', "child_process"],
      ['const m = await import("node:child_process");', "child_process"],
      ['import { Worker } from "worker_threads";', "worker_threads"],
      ['process.binding("tcp_wrap");', "process.binding"],
      ['process["binding"]("tcp_wrap");', "process.binding"],
      ['process.dlopen(m, "/tmp/x.node");', "process.dlopen"],
      ['await exec("curl https://example.com");', "exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)"],
      ['execFile("curl", ["https://example.com"]);', "exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)"],
      ['spawn("sh", ["-c", "curl x"]);', "exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)"],
      ['fork("./otro.js");', "exec/execFile/execSync/execFileSync/spawn/spawnSync/fork (llamada suelta)"],
      ['cp.spawn("curl", []);', "execFile/execSync/execFileSync/spawn/spawnSync/fork (metodo)"],
      ['eval("1+1");', "eval"],
      ['new Function("return 1")();', "Function()"],
      ['require(nombre);', "require/import no literal"],
      ['await import(ruta);', "require/import no literal"],
      ['require("child"+"_process");', "require/import no literal"],
      ['await import("child"+"_process");', "require/import no literal"],
      ['require(`child${"_"}process`);', "require/import no literal"],
      ['require("child_pro\\x63ess");', "require/import con escapes"],
      ['cp["spawn"]("curl", []);', "lanzador por corchetes"],
      ['cp[\'execFile\']("curl");', "lanzador por corchetes"],
      ['process["bind"+"ing"]("tcp_wrap");', "process por corchetes (no env)"],
      ['const p = process; p.binding("tcp_wrap");', "process sin acceso directo"],
      ['const { binding } = process;', "process sin acceso directo"],
      ['f(process);', "process sin acceso directo"],
      ['test.use({ launchOptions: { executablePath: "/usr/bin/curl" } });', "executablePath"],
      ['const u = "http://backend.invalid"; require("child_process");', "child_process"],   // codigo detras de una URL
    ];
    for (const [codigo, esperado] of casos) expect(detectar(codigo)).toContain(esperado);
  });

  test("el detector no da falsos positivos con codigo normal de un spec", () => {
    const limpio = `
      import { test, expect } from "@playwright/test";
      const re = /marketing\\/(\\w+)/;
      test("x", async ({ page }) => {
        const m = re.exec(page.url());
        await page.goto("/marketing");
        const exec_time = 1, forked = 2, spawned = [].map((x) => x);
        await expect(page.locator("a")).toBeVisible();
        const mod = require("fs");
        const h = process.env.HOME, e = process["env"].X, q = await import("node:path");
        const nota = "el proceso termina"; // la palabra suelta fuera de codigo es un falso positivo conocido: se escribe «proceso»
      });`;
    expect(detectar(limpio)).toEqual([]);
  });
});
