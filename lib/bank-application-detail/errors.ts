export class BankApplicationAuthError extends Error {
  constructor(message = "Missing or invalid auth for bank application detail") {
    super(message);
    this.name = "BankApplicationAuthError";
  }
}

export class BankApplicationHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "BankApplicationHttpError";
  }
}
