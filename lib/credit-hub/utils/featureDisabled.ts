export class FeatureDisabledError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message = "Feature disabled", status = 503, body?: unknown) {
    super(message);
    this.name = "FeatureDisabledError";
    this.status = status;
    this.body = body;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function isChFeatureDisabledPayload(status: number, body: unknown): boolean {
  const root = asRecord(body);
  if (root?.feature_enabled === false) return true;

  const detail = root?.detail;
  const detailObj = asRecord(detail);
  if (detailObj?.feature_enabled === false) return true;
  if (detailObj?.error === "routeone_parity_disabled") return true;

  if (status === 503 && typeof detail === "string") {
    return detail.toLowerCase().includes("parity");
  }

  return false;
}

export function throwIfChFeatureDisabled(status: number, body: unknown): void {
  if (!isChFeatureDisabledPayload(status, body)) return;

  const root = asRecord(body);
  const detailObj = asRecord(root?.detail);
  const message =
    (typeof detailObj?.message === "string" && detailObj.message) ||
    (typeof root?.detail === "string" && root.detail) ||
    "Feature disabled";

  throw new FeatureDisabledError(message, status, body);
}
