import { z, type ZodSchema } from "zod";

export class ContractViolationError extends Error {
  constructor(
    public readonly contract: string,
    public readonly issues: z.ZodIssue[],
  ) {
    super(`Contract violation [${contract}]: ${issues.map((i) => i.message).join("; ")}`);
    this.name = "ContractViolationError";
  }
}

export function parseContract<T>(schema: ZodSchema<T>, payload: unknown, contract: string): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ContractViolationError(contract, result.error.issues);
  }
  return result.data;
}

export function safeParseContract<T>(
  schema: ZodSchema<T>,
  payload: unknown,
): { ok: true; data: T } | { ok: false; error: ContractViolationError } {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return { ok: false, error: new ContractViolationError("unknown", result.error.issues) };
  }
  return { ok: true, data: result.data };
}
