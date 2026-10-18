/**
 * PULIDO 7, pasada 2: textos visibles de los módulos de la Suite sin inglés ni tildes rotas.
 * Reutiliza el detector de la pasada 1. Fuera de alcance (zonas propias): Legal, Realtor, asistente del
 * concesionario y menú/carcasa.
 */
import fs from "fs";
import path from "path";
import { detectarEnRutas, type Hallazgo } from "./detector-textos";

const MODULOS = [
  "proyectos", "contable", "market-intel", "billing", "content", "leads", "notifications", "sic", "admin", "settings",
];

/** Excepciones de esta pasada, cada una con su justificación (criterio c). */
const EXCEPCIONES_MODULOS: { motivo: RegExp; texto: RegExp; porque: string }[] = [
  { motivo: /«Error»|«Roles»/, texto: /^(Error|Roles)( [a-záéíóúñ]| HTTP| \$\{|$)/, porque: "«error» y «roles» son palabras españolas" },
  { motivo: /«Tenant»/, texto: /^X-Tenant-ID$/, porque: "nombre de cabecera HTTP, no se muestra" },
];

const esPrueba = (f: string) => /(^|\/)tests\/|\.test\.tsx?$/.test(f);
const permitido = (h: Hallazgo) => EXCEPCIONES_MODULOS.some((e) => e.motivo.test(h.motivo) && e.texto.test(h.texto));

function hallazgosDe(modulo: string): string[] {
  return detectarEnRutas([`app/${modulo}`, `components/${modulo}`])
    .filter((h) => !esPrueba(h.archivo) && !permitido(h))
    .map((h) => `${h.archivo}:${h.linea} ${h.motivo} → ${h.texto}`);
}

describe.each(MODULOS)("módulo %s", (modulo) => {
  test("sin inglés ni tildes rotas en textos visibles", () => {
    expect(hallazgosDe(modulo)).toEqual([]);
  });
});

describe("mensajes y codificación", () => {
  test("messages/es sin secuencias mal codificadas", () => {
    const dir = path.join(process.cwd(), "messages/es");
    const malos = fs.readdirSync(dir).filter((f) => /[ÃÂ]|�/.test(fs.readFileSync(path.join(dir, f), "utf8")));
    expect(malos).toEqual([]);
  });
});
