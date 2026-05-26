import { redirect } from "next/navigation";
import { resolveProyectoRouteId } from "@/lib/projects/proyectoApiPaths";

/** Server pages under `/proyectos/[id]/*` — rejects literal `{id}` route placeholders. */
export function requireProyectoRouteId(raw: string): string {
  const proyectoId = resolveProyectoRouteId(raw);
  if (!proyectoId) {
    redirect("/proyectos/portafolio");
  }
  return proyectoId;
}
