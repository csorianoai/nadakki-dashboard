import { modulosVisibles, type ContextoUsuario } from "@/lib/modulos/registro";

/** Nombres visibles (lib/modulos/registro.ts) de los módulos que el tenant tiene, sin repetir. */
export function modulosDePortada(u: ContextoUsuario): { ids: string[]; nombres: string[] } {
  const mods = modulosVisibles(u);
  return { ids: mods.map((m) => m.id), nombres: mods.map((m) => m.label) };
}

const lista = (n: string[]): string =>
  n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`;

/** Subtítulo de la portada: el de crédito solo con módulo de crédito; si no, solo los módulos del tenant. */
export function subtituloPortada(ids: string[], nombres: string[]): string {
  if (ids.includes("credito")) {
    return "Plataforma enterprise de IA: riesgo crediticio, crecimiento autonomo y dominios operativos.";
  }
  return nombres.length > 0 ? `Plataforma enterprise de IA: ${lista(nombres)}.` : "Plataforma enterprise de IA.";
}

/** Línea «Arquitectura del producto»: nombra solo los módulos del tenant. */
export function arquitecturaPortada(ids: string[], nombres: string[]): string | null {
  if (ids.includes("credito")) {
    return "Sistema · SIC / riesgo · Crecimiento (publicidad, workflows, marketing) · Autopilot IA · Dominios de negocio · Admin y control.";
  }
  return nombres.length > 0 ? nombres.join(" · ") : null;
}
