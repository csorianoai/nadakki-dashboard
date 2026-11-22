import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * META-TITULOS (auditoría Cowork, staging 7dcc6c6): todas las pantallas de /realtor heredaban «Plataforma de crédito»
 * del layout raíz. Cada página de app/realtor tiene título propio, distinto de las demás, y el layout de Realtor pone
 * la plantilla «<pantalla> · Real Estate · Nadakki». Recorre el disco: una página nueva sin título falla aquí.
 */
jest.mock("next/font/local", () => () => ({ variable: "" }));
const RAIZ = join(__dirname, "../../../app/realtor");

function paginas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return paginas(p);
    return n === "page.tsx" ? [p] : [];
  });
}
const ruta = (archivo: string) => "/" + join("realtor", relative(RAIZ, archivo)).replace(/\/?page\.tsx$/, "");

type Meta = { title?: unknown };
/** El título de la página o, si es de cliente («use client» no admite metadata), el de su layout. */
function tituloDe(archivo: string): unknown {
  const pagina = require(archivo) as { metadata?: Meta };
  if (pagina.metadata) return pagina.metadata.title;
  try {
    return (require(join(archivo, "../layout.tsx")) as { metadata?: Meta }).metadata?.title;
  } catch { return undefined; }
}

const todas = paginas(RAIZ);

it("hay páginas que comprobar (recorrido del disco)", () => {
  expect(todas.length).toBeGreaterThanOrEqual(18);
});

it.each(todas.map((a) => [ruta(a), a]))("%s tiene título propio, no el de la plataforma de crédito", (_r, archivo) => {
  const t = tituloDe(archivo);
  expect(typeof t).toBe("string");
  expect((t as string).trim().length).toBeGreaterThan(0);
  expect(t).not.toMatch(/cr[eé]dito/i);
});

it("ningún título se repite entre pantallas", () => {
  const titulos = todas.map(tituloDe);
  expect(new Set(titulos).size).toBe(titulos.length);
});

it("el layout de Realtor pone la plantilla «… · Real Estate · Nadakki»", () => {
  const { metadata } = require(join(RAIZ, "layout.tsx")) as { metadata?: { title?: { template?: string; default?: string } } };
  expect(metadata?.title?.template).toBe("%s · Real Estate · Nadakki");
  expect(metadata?.title?.default).toBe("Real Estate · Nadakki");
});

it("el título sale del rótulo del menú: Mi día, Contactos y Operaciones dicen lo mismo que la barra", () => {
  const por = Object.fromEntries(todas.map((a) => [ruta(a), tituloDe(a)]));
  expect(por["/realtor/mi-dia"]).toBe("Mi día");
  expect(por["/realtor/clientes"]).toBe("Contactos");
  expect(por["/realtor/operaciones"]).toBe("Operaciones");
});
