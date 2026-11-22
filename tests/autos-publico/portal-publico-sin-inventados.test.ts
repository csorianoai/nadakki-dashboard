/**
 * Decision 14a / F-27: el portal publico de autos no muestra datos inventados.
 * El certificador de produccion (web_sin_inventados) encontro «Banco Piloto» en el
 * tooltip de TopNav, que se sirve en TODAS las paginas de /autos.
 *
 * («Precio justo» es un concepto calculado que aun vive en lib/vehicles.ts y badges: queda fuera de
 * esta guarda a proposito; ver nota en el PR.)
 *
 * Esta prueba recorre el grafo de imports (alias @/) desde las paginas publicas y falla si
 * algun literal inventado vuelve a ser alcanzable, o si reaparece el bloque de financiacion
 * o el chat en la ficha.
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "../..");
const ENTRADAS = [
  "app/autos/layout.tsx",
  "app/autos/page.tsx",
  "app/autos/vehiculos/page.tsx",
  "app/autos/vehiculo/[id]/page.tsx",
];
// lib/tenants.ts define los tenants de demo; su unico consumidor permitido es TenantProvider.
const EXCLUIDOS = new Set(["lib/tenants.ts"]);
const INVENTADOS =
  /Banco Piloto|Credicefi|15 usuarios|47 vendidos|Aliados bancarios|Un solo formulario, múltiples ofertas|María L\.|Carlos R\./i;

function resolverImport(spec: string): string | null {
  const base = path.join(RAIZ, spec.replace(/^@\//, ""));
  for (const c of [base + ".tsx", base + ".ts", path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
    if (fs.existsSync(c)) return path.relative(RAIZ, c).split(path.sep).join("/");
  }
  return null;
}

function alcanzables(): Map<string, string> {
  const vistos = new Map<string, string>();
  const pila = [...ENTRADAS];
  while (pila.length) {
    const rel = pila.pop()!;
    if (vistos.has(rel) || EXCLUIDOS.has(rel)) continue;
    const abs = path.join(RAIZ, rel);
    if (!fs.existsSync(abs)) continue;
    const src = fs.readFileSync(abs, "utf8");
    vistos.set(rel, src);
    for (const m of src.matchAll(/(?:from|import)\s*\(?\s*["'](@\/[^"']+)["']/g)) {
      const r = resolverImport(m[1]!);
      if (r) pila.push(r);
    }
  }
  return vistos;
}

describe("portal publico de autos sin datos inventados", () => {
  const grafo = alcanzables();

  it("recorre un grafo real (si queda vacio la prueba no protege nada)", () => {
    expect(grafo.has("components/nav/TopNav.tsx")).toBe(true);
    expect(grafo.has("app/autos/vehiculo/[id]/page.tsx")).toBe(true);
    expect(grafo.size).toBeGreaterThan(20);
  });

  it("ningun archivo alcanzable desde las paginas publicas contiene literales inventados", () => {
    const malos: string[] = [];
    for (const [rel, src] of grafo) {
      src.split("\n").forEach((linea, i) => {
        if (/^\s*(\/\/|\/\*|\*)/.test(linea)) return; // comentarios
        if (INVENTADOS.test(linea)) malos.push(`${rel}:${i + 1}: ${linea.trim().slice(0, 90)}`);
      });
    }
    expect(malos).toEqual([]);
  });

  it("solo TenantProvider consume lib/tenants (sin selector de tenants de demo en el portal)", () => {
    const consumidores = [...grafo].filter(([, s]) => /@\/lib\/tenants["']/.test(s)).map(([r]) => r).sort();
    expect(consumidores).not.toContain("components/nav/TopNav.tsx");
    for (const [rel, src] of grafo) {
      if (rel !== "components/system/TenantProvider.tsx") expect([rel, /TENANT_OPTIONS/.test(src)]).toEqual([rel, false]);
    }
  });

  it("la ficha no monta el bloque de financiacion ni el chat", () => {
    const ficha = grafo.get("app/autos/vehiculo/[id]/page.tsx")!;
    expect(ficha).not.toMatch(/<PaymentCalculator|<VehicleChatWidget|FinancingLeadButton/);
  });

  it("la portada no monta bancos, comparador, barra de confianza ni testimonios", () => {
    const portada = grafo.get("app/autos/page.tsx")!;
    expect(portada).not.toMatch(/BankPartners|ApprovalComparator|TrustBar|Testimonials/);
  });
});
