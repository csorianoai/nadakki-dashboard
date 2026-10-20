/** Identificador de la solicitud en la URL del asistente: ?application_id= o, en su defecto, ?id=. */
export function wizardApplicationIdFromParams(params: Pick<URLSearchParams, "get">): string {
  if (params.get("new") === "1") return "";
  return (params.get("application_id") ?? params.get("id") ?? "").trim();
}
