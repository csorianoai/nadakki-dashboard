/**
 * Migas de Realtor OS por ruta (auditoría de navegación de Cowork, 2026-10-15): Smart Calendar, Propietarios,
 * Alta y Agente web. Sin grupo inventado «Herramientas», sin rótulos en bruto del segmento de la URL.
 */
import { migasDe } from "@/lib/migas";

const INICIO = { label: "Inicio", href: "/" };
const RT = { label: "Realtor OS", href: "/realtor" };

const CASOS: [string, { label: string; href: string }[]][] = [
  ["/realtor/smart-calendar", [INICIO, RT, { label: "Smart Calendar", href: "/realtor/smart-calendar" }]],
  ["/realtor/propietarios", [INICIO, RT, { label: "Clientes", href: "/realtor/clientes" }, { label: "Propietarios", href: "/realtor/propietarios" }]],
  ["/realtor/alta", [INICIO, RT, { label: "Alta", href: "/realtor/alta" }]],
  ["/realtor/agente-web", [INICIO, RT, { label: "Agente web", href: "/realtor/agente-web" }]],
];

describe("migas de Realtor OS", () => {
  test.each(CASOS)("%s", (ruta, esperado) => {
    const m = migasDe(ruta);
    expect(m).toEqual(esperado);
    expect(m.map((x) => x.label)).not.toContain("Herramientas");
    expect(m.every((x) => x.label === "Inicio" || /^[A-ZÁÉÍÓÚ]/.test(x.label))).toBe(true);
  });
});
