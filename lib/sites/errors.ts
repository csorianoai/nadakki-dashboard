import type { Problem, ProblemCode, Violation } from "./types";

export type SitesErrorCode = ProblemCode | "UNKNOWN" | "NETWORK";

/** Error del API de Mi web: status HTTP (0 si no salio de este equipo), codigo estable y, en PUBLISH_BLOCKED, las violaciones. */
export class SitesApiError extends Error {
  readonly status: number;
  readonly code: SitesErrorCode;
  readonly violations?: Violation[];
  readonly problem?: Problem;

  constructor(status: number, code: SitesErrorCode, message: string, extra: { violations?: Violation[]; problem?: Problem } = {}) {
    super(message);
    this.name = "SitesApiError";
    this.status = status;
    this.code = code;
    this.violations = extra.violations;
    this.problem = extra.problem;
  }
}

function esViolacion(v: unknown): v is Violation {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return ["rule_id", "severity", "message", "field"].every((k) => typeof o[k] === "string");
}

/** Convierte una respuesta no exitosa en SitesApiError; tolera cuerpos ilegibles. */
export async function errorFromResponse(res: Response): Promise<SitesApiError> {
  let body: unknown;
  try {
    body = JSON.parse(await res.text());
  } catch {
    body = undefined;
  }
  const p = body && typeof body === "object" ? (body as Partial<Problem>) : undefined;
  const code = (typeof p?.code === "string" ? p.code : "UNKNOWN") as SitesErrorCode;
  const message = (typeof p?.detail === "string" && p.detail) || (typeof p?.title === "string" && p.title) || `HTTP ${res.status}`;
  const violations = code === "PUBLISH_BLOCKED" && Array.isArray(p?.violations) ? p.violations.filter(esViolacion) : undefined;
  return new SitesApiError(res.status, code, message, { violations, problem: p as Problem | undefined });
}
